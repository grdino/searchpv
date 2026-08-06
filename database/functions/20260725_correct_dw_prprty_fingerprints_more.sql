BEGIN;


/* ============================================================
   1. Remove temporary tables from a previous session
   ============================================================ */

DROP TABLE IF EXISTS tmp_prprty_normalized;
DROP TABLE IF EXISTS tmp_prprty_ranked;
DROP TABLE IF EXISTS tmp_prprty_survivor_override;
DROP TABLE IF EXISTS tmp_prprty_merge_exclusion;
DROP TABLE IF EXISTS tmp_prprty_excluded_fingerprint;
DROP TABLE IF EXISTS tmp_prprty_merge_approval;
DROP TABLE IF EXISTS tmp_prprty_merge_map;
DROP TABLE IF EXISTS tmp_prprty_unique_update;
DROP TABLE IF EXISTS tmp_prprty_unsafe_merge;


/* ============================================================
   2. Calculate corrected development names

   Cleanup order:

   1. Trim whitespace.
   2. Remove trailing # and trailing hyphens.
   3. Remove trailing standalone PH or LOT.
   4. Collapse repeated whitespace.
   5. Remove a trailing unit suffix only when it matches unit_id.

   Unit matching ignores spaces and hyphens:

       D-5  matches D5
       A-12 matches A12
       2 A  matches 2A

   Up to three trailing whitespace-delimited pieces are tested.
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_normalized
ON COMMIT DROP
AS
WITH initial_cleanup AS
(
    SELECT
        p.*,

        NULLIF(
            BTRIM(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            BTRIM(COALESCE(p.dvlpmnt_ds, '')),

                            /*
                            Remove trailing punctuation.

                            Examples:
                                NAME #
                                NAME-
                                NAME -
                                NAME - #
                            */
                            '\s*[#-]+\s*$',
                            '',
                            'i'
                        ),

                        /*
                        Remove a trailing standalone PH or LOT.
                        */
                        '\s+(PH|LOT)\s*$',
                        '',
                        'i'
                    ),

                    /*
                    Collapse repeated whitespace.
                    */
                    '\s+',
                    ' ',
                    'g'
                )
            ),
            ''
        ) AS punctuation_cleaned_dvlpmnt_ds,

        NULLIF(
            REGEXP_REPLACE(
                UPPER(BTRIM(COALESCE(p.unit_id, ''))),
                '[^A-Z0-9]',
                '',
                'g'
            ),
            ''
        ) AS normalized_unit_id

    FROM dw.prprty p
),

unit_suffix_candidates AS
(
    SELECT
        i.*,

        /*
        Last one whitespace-delimited piece.

        Examples:
            D-5
            A12
            PH3
        */
        SUBSTRING(
            punctuation_cleaned_dvlpmnt_ds
            FROM '(\S+)$'
        ) AS suffix_1,

        /*
        Last two whitespace-delimited pieces.

        Examples:
            2 A
            A 12
        */
        SUBSTRING(
            punctuation_cleaned_dvlpmnt_ds
            FROM '(\S+\s+\S+)$'
        ) AS suffix_2,

        /*
        Last three whitespace-delimited pieces.

        Example:
            A - 12
        */
        SUBSTRING(
            punctuation_cleaned_dvlpmnt_ds
            FROM '(\S+\s+\S+\s+\S+)$'
        ) AS suffix_3

    FROM initial_cleanup i
),

matched_suffix AS
(
    SELECT
        c.*,

        CASE
            /*
            Prefer the shortest matching suffix.
            */
            WHEN normalized_unit_id IS NOT NULL
             AND suffix_1 IS NOT NULL
             AND REGEXP_REPLACE(
                    UPPER(suffix_1),
                    '[^A-Z0-9]',
                    '',
                    'g'
                 ) = normalized_unit_id
            THEN suffix_1

            WHEN normalized_unit_id IS NOT NULL
             AND suffix_2 IS NOT NULL
             AND REGEXP_REPLACE(
                    UPPER(suffix_2),
                    '[^A-Z0-9]',
                    '',
                    'g'
                 ) = normalized_unit_id
            THEN suffix_2

            WHEN normalized_unit_id IS NOT NULL
             AND suffix_3 IS NOT NULL
             AND REGEXP_REPLACE(
                    UPPER(suffix_3),
                    '[^A-Z0-9]',
                    '',
                    'g'
                 ) = normalized_unit_id
            THEN suffix_3

            ELSE NULL
        END AS matched_unit_suffix

    FROM unit_suffix_candidates c
),

corrected_development AS
(
    SELECT
        m.*,

        NULLIF(
            BTRIM(
                CASE
                    /*
                    Remove the matched suffix only when:

                    1. A nonblank development name remains after removal.
                    2. The suffix contains at least one digit, or begins
                       with a recognized unit marker such as PH or PB.

                    These safeguards prevent errors such as:

                        A-1 + unit A1
                        becoming NULL

                    and:

                        GRAND VENETIAN + unit VENETIAN
                        becoming GRAND
                    */
                    WHEN matched_unit_suffix IS NOT NULL

                     AND NULLIF(
                            BTRIM(
                                LEFT(
                                    punctuation_cleaned_dvlpmnt_ds,
                                    LENGTH(punctuation_cleaned_dvlpmnt_ds)
                                    - LENGTH(matched_unit_suffix)
                                )
                            ),
                            ''
                         ) IS NOT NULL

                     AND
                         (
                             matched_unit_suffix ~ '[0-9]'
                             OR matched_unit_suffix ~* '^(PH|PB)([^A-Z]|$)'
                         )

                    THEN
                        BTRIM(
                            LEFT(
                                punctuation_cleaned_dvlpmnt_ds,
                                LENGTH(punctuation_cleaned_dvlpmnt_ds)
                                - LENGTH(matched_unit_suffix)
                            )
                        )

                    ELSE punctuation_cleaned_dvlpmnt_ds
                END
            ),
            ''
        ) AS corrected_dvlpmnt_ds,

        /*
        Record whether the matched suffix was actually removed.
        A suffix can match unit_id but still be rejected by the
        safeguards above.
        */
        CASE
            WHEN matched_unit_suffix IS NOT NULL

             AND NULLIF(
                    BTRIM(
                        LEFT(
                            punctuation_cleaned_dvlpmnt_ds,
                            LENGTH(punctuation_cleaned_dvlpmnt_ds)
                            - LENGTH(matched_unit_suffix)
                        )
                    ),
                    ''
                 ) IS NOT NULL

             AND
                 (
                     matched_unit_suffix ~ '[0-9]'
                     OR matched_unit_suffix ~* '^(PH|PB)([^A-Z]|$)'
                 )

            THEN matched_unit_suffix

            ELSE NULL
        END AS removed_unit_suffix

    FROM matched_suffix m
),

corrected_fingerprint AS
(
    SELECT
        d.*,

        CASE
            /*
            Development + normalized unit.

            This should mirror the Python property fingerprint:
                DEVELOPMENT|UNIT
            */
            WHEN corrected_dvlpmnt_ds IS NOT NULL
             AND normalized_unit_id IS NOT NULL
            THEN
                corrected_dvlpmnt_ds
                || '|'
                || normalized_unit_id

            /*
            No development correction can safely produce a new
            fingerprint when the development is NULL.

            Preserve the existing fingerprint rather than
            constructing a different fallback here.
            */
            ELSE
                prprty_fngrprnt_id
        END AS corrected_fingerprint

    FROM corrected_development d
)

SELECT
    f.*,

    COUNT(*) OVER
    (
        PARTITION BY corrected_fingerprint
    ) AS corrected_fingerprint_count

FROM corrected_fingerprint f;


/* ============================================================
   3. Rank rows within corrected fingerprint groups

   This determines the default survivor when corrections cause
   two or more properties to have the same fingerprint.
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_ranked
ON COMMIT DROP
AS
SELECT
    n.*,

    ROW_NUMBER() OVER
    (
        PARTITION BY corrected_fingerprint

        ORDER BY
            /*
            Prefer a property that already has the corrected
            fingerprint.
            */
            CASE
                WHEN prprty_fngrprnt_id = corrected_fingerprint
                THEN 0
                ELSE 1
            END,

            /*
            Prefer a property that already has the corrected
            development name.
            */
            CASE
                WHEN dvlpmnt_ds
                     IS NOT DISTINCT FROM corrected_dvlpmnt_ds
                THEN 0
                ELSE 1
            END,

            /*
            Prefer the most complete property row.
            */
            (
                CASE
                    WHEN NULLIF(BTRIM(tax_id), '') IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN NULLIF(BTRIM(adrs_ds), '') IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN lat_nb IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN long_nb IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN NULLIF(BTRIM(zone_ds), '') IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN NULLIF(BTRIM(area_ds), '') IS NOT NULL
                    THEN 1 ELSE 0
                END

              + CASE
                    WHEN NULLIF(BTRIM(cmnty_ds), '') IS NOT NULL
                    THEN 1 ELSE 0
                END
            ) DESC,

            /*
            Final deterministic tie-breaker.
            */
            prprty_ky
    ) AS survivor_rank

FROM tmp_prprty_normalized n;


/* ============================================================
   4. Manual merge controls

   These controls handle known exceptions that cannot be safely
   resolved from corrected development + normalized unit alone.

   A. Survivor overrides
      Select the property row that should survive a valid merge.

   B. Merge exclusions
      Exclude an entire corrected-fingerprint group when the same
      development may contain multiple physical units with the
      same apparent unit identifier.

   C. Unsafe-merge approvals
      Approve specific merge rows when geography is known to be
      wrong on one source property but other evidence confirms
      that the rows represent the same physical property.
   ============================================================ */


/* ------------------------------------------------------------
   4A. Manually selected survivors
   ------------------------------------------------------------ */

CREATE TEMP TABLE tmp_prprty_survivor_override
(
    corrected_fingerprint text PRIMARY KEY,
    survivor_prprty_ky bigint NOT NULL,
    override_reason_tx text NOT NULL
)
ON COMMIT DROP;


/*
SELVA ROMANTICA PELICANO 1:

Property 7404 has the credible address/community/coordinates.
Property 13907 appears to contain the bad map point.
*/
INSERT INTO tmp_prprty_survivor_override
(
    corrected_fingerprint,
    survivor_prprty_ky,
    override_reason_tx
)
VALUES
(
    'SELVA ROMANTICA|PELICANO1',
    7404,
    'Use the property row with the credible Selva Romantica location.'
);


/* ------------------------------------------------------------
   4B. Merge exclusions

   Exclusions apply to the ENTIRE corrected-fingerprint group.

   This is important: excluding only one old property would still
   allow another row in the group to receive the shared corrected
   fingerprint, creating a duplicate or an incorrect merge.
   ------------------------------------------------------------ */

CREATE TEMP TABLE tmp_prprty_merge_exclusion
(
    corrected_fingerprint text PRIMARY KEY,
    exclusion_reason_tx text NOT NULL
)
ON COMMIT DROP;


/*
Known ambiguous groups:

1. ALAMAR|102
   ALAMAR has multiple towers/buildings and unit 102 may occur
   more than once. Building identity is not resolved here.

2. QUINTA SAN MIGUEL CANAL|301
   The source addresses reference different towers/villas.
   These are not safe to collapse into one property.
*/
INSERT INTO tmp_prprty_merge_exclusion
(
    corrected_fingerprint,
    exclusion_reason_tx
)
VALUES
(
    'ALAMAR|102',
    'Unit 102 may exist in multiple ALAMAR towers; building identity is unresolved.'
),
(
    'QUINTA SAN MIGUEL CANAL|301',
    'Unit 301 appears in multiple towers/villas and must not be merged as one property.'
),
(
    'GRAND VENETIAN|30001004',
    'Unusual compound unit value 3000-1004 may contain meaningful tower or unit structure.'
),
(
    'SAYAN|11',
    'Unit 1-1 may encode building/floor structure and should not automatically normalize to unit 11.'
),
(
    'SAYAN|21',
    'Unit 2-1 may encode building/floor structure and should not automatically normalize to unit 21.'
),
(
    'TAHEIMA|1304PH',
    'Unit 1-304PH may encode tower 1 and unit 304PH rather than unit 1304PH.'
),
(
    'SANTA FE|104',
    'Area, community, address, and coordinates are not sufficiently consistent for automatic merging.'
);


/*
Materialize the excluded fingerprints only when they actually
exist in the current normalized data.
*/
CREATE TEMP TABLE tmp_prprty_excluded_fingerprint
ON COMMIT DROP
AS
SELECT
    exclusion.corrected_fingerprint,
    exclusion.exclusion_reason_tx
FROM tmp_prprty_merge_exclusion exclusion
WHERE EXISTS
(
    SELECT 1
    FROM tmp_prprty_ranked ranked
    WHERE ranked.corrected_fingerprint =
          exclusion.corrected_fingerprint
);


/* ------------------------------------------------------------
   4C. Explicit approvals for known bad source map points

   These approvals apply to a specific old property key after the
   final survivor has been selected.

   They do not force a merge. They only prevent a known bad map
   point from being treated as an unresolved geographic blocker.
   ------------------------------------------------------------ */

CREATE TEMP TABLE tmp_prprty_merge_approval
(
    old_prprty_ky bigint PRIMARY KEY,
    expected_corrected_fingerprint text NOT NULL,
    approval_reason_tx text NOT NULL
)
ON COMMIT DROP;


INSERT INTO tmp_prprty_merge_approval
(
    old_prprty_ky,
    expected_corrected_fingerprint,
    approval_reason_tx
)
VALUES
(
    565,
    'BAY VIEW GRAND|1301D',
    'Same development, unit, and address pattern; old source coordinate is a known bad/default point.'
),
(
    545,
    'EL CAMPANARIO|202B',
    'Same development and unit; old source coordinate is the same bad/default point found on unrelated records.'
),
(
    461,
    'BVG|C302',
    'Same development and unit; old longitude is inconsistent with the Marina address.'
),
(
    1346,
    'CASA DELFINES|1',
    'Same street address and unit; source community/map point is inconsistent.'
),
(
    13907,
    'SELVA ROMANTICA|PELICANO1',
    'Merge into survivor 7404; property 13907 contains the implausible map point.'
);


/* ============================================================
   5. Validate manual controls
   ============================================================ */

DO $$
DECLARE
    invalid_override_count bigint;
    missing_exclusion_count bigint;
    invalid_approval_count bigint;
BEGIN
    /*
    Every survivor override must identify a row belonging to the
    stated corrected-fingerprint group.
    */
    SELECT COUNT(*)
    INTO invalid_override_count
    FROM tmp_prprty_survivor_override override_row
    LEFT JOIN tmp_prprty_ranked ranked
      ON ranked.corrected_fingerprint =
         override_row.corrected_fingerprint
     AND ranked.prprty_ky =
         override_row.survivor_prprty_ky
    WHERE ranked.prprty_ky IS NULL;

    IF invalid_override_count <> 0 THEN
        RAISE EXCEPTION
            '% survivor override(s) do not belong to the specified corrected fingerprint group.',
            invalid_override_count;
    END IF;


    /*
    Every configured exclusion should match current normalized
    data. This catches stale or misspelled fingerprint values.
    */
    SELECT COUNT(*)
    INTO missing_exclusion_count
    FROM tmp_prprty_merge_exclusion exclusion
    LEFT JOIN tmp_prprty_ranked ranked
      ON ranked.corrected_fingerprint =
         exclusion.corrected_fingerprint
    WHERE ranked.prprty_ky IS NULL;

    IF missing_exclusion_count <> 0 THEN
        RAISE EXCEPTION
            '% merge exclusion fingerprint(s) were not found in the normalized data.',
            missing_exclusion_count;
    END IF;


    /*
    Each approval must identify an existing normalized row with
    the expected corrected fingerprint.
    */
    SELECT COUNT(*)
    INTO invalid_approval_count
    FROM tmp_prprty_merge_approval approval
    LEFT JOIN tmp_prprty_ranked ranked
      ON ranked.prprty_ky =
         approval.old_prprty_ky
     AND ranked.corrected_fingerprint =
         approval.expected_corrected_fingerprint
    WHERE ranked.prprty_ky IS NULL;

    IF invalid_approval_count <> 0 THEN
        RAISE EXCEPTION
            '% unsafe-merge approval(s) do not match the expected property/fingerprint.',
            invalid_approval_count;
    END IF;
END
$$;


/* ============================================================
   6. Build the duplicate-to-survivor merge map

   Only corrected fingerprints occurring more than once enter
   this table.
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_merge_map
ON COMMIT DROP
AS
WITH duplicate_groups AS
(
    SELECT
        corrected_fingerprint
    FROM tmp_prprty_ranked ranked
    WHERE ranked.corrected_fingerprint IS NOT NULL

      AND NOT EXISTS
      (
          SELECT 1
          FROM tmp_prprty_excluded_fingerprint excluded
          WHERE excluded.corrected_fingerprint =
                ranked.corrected_fingerprint
      )

    GROUP BY ranked.corrected_fingerprint
    HAVING COUNT(*) > 1
),

selected_survivors AS
(
    SELECT
        duplicate_group.corrected_fingerprint,

        COALESCE(
            survivor_override.survivor_prprty_ky,
            ranked.prprty_ky
        ) AS survivor_prprty_ky

    FROM duplicate_groups duplicate_group

    LEFT JOIN tmp_prprty_survivor_override survivor_override
      ON survivor_override.corrected_fingerprint =
         duplicate_group.corrected_fingerprint

    LEFT JOIN tmp_prprty_ranked ranked
      ON ranked.corrected_fingerprint =
         duplicate_group.corrected_fingerprint

     AND ranked.survivor_rank = 1
)

SELECT
    duplicate.prprty_ky AS old_prprty_ky,
    survivor.survivor_prprty_ky,

    duplicate.prprty_fngrprnt_id AS old_fingerprint,
    duplicate.corrected_fingerprint,

    duplicate.dvlpmnt_ds AS old_dvlpmnt_ds,
    duplicate.corrected_dvlpmnt_ds,

    duplicate.removed_unit_suffix AS matched_unit_suffix

FROM tmp_prprty_ranked duplicate

JOIN selected_survivors survivor
  ON survivor.corrected_fingerprint =
     duplicate.corrected_fingerprint

WHERE duplicate.prprty_ky <>
      survivor.survivor_prprty_ky;


/* ============================================================
   7. Build the unique-row update list

   These rows change after normalization but do not collide with
   another corrected fingerprint.
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_unique_update
ON COMMIT DROP
AS
SELECT
    prprty_ky,

    dvlpmnt_ds AS old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    prprty_fngrprnt_id AS old_fingerprint,
    corrected_fingerprint,

    removed_unit_suffix AS matched_unit_suffix

FROM tmp_prprty_ranked

WHERE corrected_fingerprint_count = 1

  AND NOT EXISTS
  (
      SELECT 1
      FROM tmp_prprty_excluded_fingerprint excluded
      WHERE excluded.corrected_fingerprint =
            tmp_prprty_ranked.corrected_fingerprint
  )

  AND
  (
      dvlpmnt_ds
          IS DISTINCT FROM corrected_dvlpmnt_ds

      OR prprty_fngrprnt_id
          IS DISTINCT FROM corrected_fingerprint
  );


/* ============================================================
   8. Validate the merge map
   ============================================================ */

DO $$
DECLARE
    duplicate_old_key_count bigint;
    self_merge_count bigint;
    missing_old_property_count bigint;
    missing_survivor_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_old_key_count
    FROM
    (
        SELECT old_prprty_ky
        FROM tmp_prprty_merge_map
        GROUP BY old_prprty_ky
        HAVING COUNT(*) > 1
    ) duplicate_keys;

    IF duplicate_old_key_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % old property keys occur more than once.',
            duplicate_old_key_count;
    END IF;


    SELECT COUNT(*)
    INTO self_merge_count
    FROM tmp_prprty_merge_map
    WHERE old_prprty_ky = survivor_prprty_ky;

    IF self_merge_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % rows attempt to merge into themselves.',
            self_merge_count;
    END IF;


    SELECT COUNT(*)
    INTO missing_old_property_count

    FROM tmp_prprty_merge_map merge_row

    LEFT JOIN dw.prprty property
      ON property.prprty_ky =
         merge_row.old_prprty_ky

    WHERE property.prprty_ky IS NULL;

    IF missing_old_property_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % old property keys do not exist.',
            missing_old_property_count;
    END IF;


    SELECT COUNT(*)
    INTO missing_survivor_count

    FROM
    (
        SELECT DISTINCT survivor_prprty_ky
        FROM tmp_prprty_merge_map
    ) merge_row

    LEFT JOIN dw.prprty property
      ON property.prprty_ky =
         merge_row.survivor_prprty_ky

    WHERE property.prprty_ky IS NULL;

    IF missing_survivor_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % survivor property keys do not exist.',
            missing_survivor_count;
    END IF;
END
$$;


/* ============================================================
   8A. Build the geographically unsafe merge review list

   Corrected development + unit is not sufficient by itself when
   the two property rows have incompatible geography.

   A proposed merge enters this list when:

   1. Zones differ.
   2. Both latitudes exist and differ by more than 0.003 degrees.
   3. Both longitudes exist and differ by more than 0.003 degrees.

   This review version does not raise an exception here because
   Supabase would stop before displaying the review results.

   Before changing the final ROLLBACK to COMMIT, every row in this
   table must be resolved, excluded, or manually approved.
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_unsafe_merge
ON COMMIT DROP
AS
SELECT
    merge_row.old_prprty_ky,
    merge_row.survivor_prprty_ky,
    merge_row.corrected_fingerprint,

    old_property.zone_ds AS old_zone_ds,
    survivor_property.zone_ds AS survivor_zone_ds,

    old_property.lat_nb AS old_lat_nb,
    survivor_property.lat_nb AS survivor_lat_nb,

    old_property.long_nb AS old_long_nb,
    survivor_property.long_nb AS survivor_long_nb

FROM tmp_prprty_merge_map merge_row

JOIN tmp_prprty_ranked old_property
  ON old_property.prprty_ky =
     merge_row.old_prprty_ky

JOIN tmp_prprty_ranked survivor_property
  ON survivor_property.prprty_ky =
     merge_row.survivor_prprty_ky

WHERE
      (
           old_property.zone_ds
               IS DISTINCT FROM survivor_property.zone_ds

        OR (
             old_property.lat_nb IS NOT NULL
             AND survivor_property.lat_nb IS NOT NULL
             AND ABS(
                    old_property.lat_nb
                    - survivor_property.lat_nb
                 ) > 0.003
           )

        OR (
             old_property.long_nb IS NOT NULL
             AND survivor_property.long_nb IS NOT NULL
             AND ABS(
                    old_property.long_nb
                    - survivor_property.long_nb
                 ) > 0.003
           )
      )

  AND NOT EXISTS
  (
      SELECT 1
      FROM tmp_prprty_merge_approval approval
      WHERE approval.old_prprty_ky =
            merge_row.old_prprty_ky
        AND approval.expected_corrected_fingerprint =
            merge_row.corrected_fingerprint
  );


/* ============================================================
   8B. Preview proposed duplicate-property merges

   These rows will have their foreign-key references redirected
   to survivor_prprty_ky, after which old_prprty_ky will be
   deleted.

   With ROLLBACK at the end, this is a test-only preview.
   ============================================================ */

SELECT
    old_prprty_ky,
    survivor_prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    matched_unit_suffix

FROM tmp_prprty_merge_map

ORDER BY
    corrected_fingerprint,
    survivor_prprty_ky,
    old_prprty_ky;


/* ============================================================
   8C. Preview proposed nonduplicate property updates

   These properties retain the same prprty_ky. Only their
   development name and/or fingerprint will be updated.
   No foreign-key redirection is required.
   ============================================================ */

SELECT
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    matched_unit_suffix

FROM tmp_prprty_unique_update

ORDER BY
    corrected_dvlpmnt_ds,
    corrected_fingerprint,
    prprty_ky;

/* ============================================================
   9. Create audit tables
   ============================================================ */

CREATE TABLE IF NOT EXISTS dw.prprty_merge_audit
(
    prprty_merge_audit_ky bigint
        GENERATED BY DEFAULT AS IDENTITY
        PRIMARY KEY,

    old_prprty_ky bigint NOT NULL,
    survivor_prprty_ky bigint NOT NULL,

    old_fingerprint text,
    corrected_fingerprint text,

    old_dvlpmnt_ds text,
    corrected_dvlpmnt_ds text,

    merged_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS dw.prprty_cleanup_audit
(
    prprty_cleanup_audit_ky bigint
        GENERATED BY DEFAULT AS IDENTITY
        PRIMARY KEY,

    prprty_ky bigint NOT NULL,

    old_dvlpmnt_ds text,
    corrected_dvlpmnt_ds text,

    old_fingerprint text,
    corrected_fingerprint text,

    matched_unit_suffix text,

    cleanup_type_cd text NOT NULL,

    cleaned_at timestamptz NOT NULL DEFAULT now()
);

/*
The audit table may already exist from an earlier cleanup
version that did not contain matched_unit_suffix.
*/
ALTER TABLE dw.prprty_cleanup_audit
ADD COLUMN IF NOT EXISTS matched_unit_suffix text;


/* ============================================================
   10. Save merge and cleanup audit records
   ============================================================ */

INSERT INTO dw.prprty_merge_audit
(
    old_prprty_ky,
    survivor_prprty_ky,

    old_fingerprint,
    corrected_fingerprint,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds
)
SELECT
    old_prprty_ky,
    survivor_prprty_ky,

    old_fingerprint,
    corrected_fingerprint,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds

FROM tmp_prprty_merge_map;


INSERT INTO dw.prprty_cleanup_audit
(
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    matched_unit_suffix,
    cleanup_type_cd
)
SELECT
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    matched_unit_suffix,
    'UNIQUE_NORMALIZATION'

FROM tmp_prprty_unique_update;


/* ============================================================
   11. Redirect warehouse foreign keys
   ============================================================ */

UPDATE dw.clsd_sale child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


UPDATE dw.invntry_snap child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


UPDATE dw.lstng child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


UPDATE dw.lstng_prc_state child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


UPDATE dw.prc_hstry child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


UPDATE dw.stts_chg child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


/* ============================================================
   12. Handle geo.prprty_bndry uniqueness

   Delete redundant assignments where both the old and surviving
   property already point to the same boundary.
   ============================================================ */

DELETE FROM geo.prprty_bndry duplicate_assignment
USING
    tmp_prprty_merge_map merge_row,
    geo.prprty_bndry survivor_assignment

WHERE duplicate_assignment.prprty_ky =
      merge_row.old_prprty_ky

  AND survivor_assignment.prprty_ky =
      merge_row.survivor_prprty_ky

  AND survivor_assignment.bndry_ky =
      duplicate_assignment.bndry_ky;


/* ============================================================
   13. Redirect remaining geo.prprty_bndry rows
   ============================================================ */

UPDATE geo.prprty_bndry child
SET prprty_ky = merge_row.survivor_prprty_ky
FROM tmp_prprty_merge_map merge_row
WHERE child.prprty_ky = merge_row.old_prprty_ky;


/* ============================================================
   14. Confirm no child references remain on duplicate keys
   ============================================================ */

DO $$
DECLARE
    remaining_reference_count bigint;
BEGIN
    SELECT
          (
              SELECT COUNT(*)
              FROM dw.clsd_sale child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.invntry_snap child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.lstng child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.lstng_prc_state child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.prc_hstry child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.stts_chg child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM geo.prprty_bndry child
              JOIN tmp_prprty_merge_map merge_row
                ON merge_row.old_prprty_ky =
                   child.prprty_ky
          )

    INTO remaining_reference_count;

    IF remaining_reference_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % child references remain on duplicate property keys.',
            remaining_reference_count;
    END IF;
END
$$;


/* ============================================================
   15. Delete duplicate property rows
   ============================================================ */

DELETE FROM dw.prprty duplicate_property
USING tmp_prprty_merge_map merge_row
WHERE duplicate_property.prprty_ky =
      merge_row.old_prprty_ky;


/* ============================================================
   16. Give rows being changed temporary fingerprints

   This protects against immediate unique-index conflicts while
   final corrected fingerprints are being assigned.
   ============================================================ */

UPDATE dw.prprty property
SET prprty_fngrprnt_id =
    '__DEVELOPMENT_CLEANUP__|'
    || property.prprty_ky::text

WHERE property.prprty_ky IN
(
    SELECT survivor_prprty_ky
    FROM tmp_prprty_merge_map

    UNION

    SELECT prprty_ky
    FROM tmp_prprty_unique_update
);


/* ============================================================
   17. Update surviving rows from duplicate groups
   ============================================================ */

UPDATE dw.prprty property
SET
    dvlpmnt_ds =
        corrected.corrected_dvlpmnt_ds,

    prprty_fngrprnt_id =
        corrected.corrected_fingerprint

FROM
(
    SELECT DISTINCT
        merge_row.survivor_prprty_ky,
        ranked.corrected_dvlpmnt_ds,
        ranked.corrected_fingerprint

    FROM tmp_prprty_merge_map merge_row

    JOIN tmp_prprty_ranked ranked
      ON ranked.prprty_ky =
         merge_row.survivor_prprty_ky

     AND ranked.corrected_fingerprint =
         merge_row.corrected_fingerprint
) corrected

WHERE property.prprty_ky =
      corrected.survivor_prprty_ky;


/* ============================================================
   18. Update corrected nonduplicate rows
   ============================================================ */

UPDATE dw.prprty property
SET
    dvlpmnt_ds =
        corrected.corrected_dvlpmnt_ds,

    prprty_fngrprnt_id =
        corrected.corrected_fingerprint

FROM tmp_prprty_unique_update corrected

WHERE property.prprty_ky =
      corrected.prprty_ky;


/* ============================================================
   19. Final validation
   ============================================================ */

DO $$
DECLARE
    old_property_count bigint;
    temporary_fingerprint_count bigint;
    duplicate_fingerprint_count bigint;
    incorrect_unique_update_count bigint;
    duplicate_boundary_count bigint;
    orphan_boundary_count bigint;
BEGIN
    /*
    Old merged property keys must be gone.
    */
    SELECT COUNT(*)
    INTO old_property_count

    FROM dw.prprty property

    JOIN tmp_prprty_merge_map merge_row
      ON merge_row.old_prprty_ky =
         property.prprty_ky;

    IF old_property_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % merged property rows still exist.',
            old_property_count;
    END IF;


    /*
    No temporary fingerprints may remain.
    */
    SELECT COUNT(*)
    INTO temporary_fingerprint_count

    FROM dw.prprty

    WHERE prprty_fngrprnt_id LIKE
          '__DEVELOPMENT_CLEANUP__|%';

    IF temporary_fingerprint_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % temporary fingerprints remain.',
            temporary_fingerprint_count;
    END IF;


    /*
    No duplicate non-null fingerprints may remain.
    */
    SELECT COUNT(*)
    INTO duplicate_fingerprint_count

    FROM
    (
        SELECT
            prprty_fngrprnt_id

        FROM dw.prprty

        WHERE prprty_fngrprnt_id IS NOT NULL

        GROUP BY prprty_fngrprnt_id

        HAVING COUNT(*) > 1
    ) duplicate_groups;

    IF duplicate_fingerprint_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % duplicate fingerprint groups remain.',
            duplicate_fingerprint_count;
    END IF;


    /*
    Confirm unique-row corrections were applied properly.
    */
    SELECT COUNT(*)
    INTO incorrect_unique_update_count

    FROM tmp_prprty_unique_update expected

    JOIN dw.prprty actual
      ON actual.prprty_ky =
         expected.prprty_ky

    WHERE actual.dvlpmnt_ds
              IS DISTINCT FROM
              expected.corrected_dvlpmnt_ds

       OR actual.prprty_fngrprnt_id
              IS DISTINCT FROM
              expected.corrected_fingerprint;

    IF incorrect_unique_update_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % unique property rows contain incorrect corrected values.',
            incorrect_unique_update_count;
    END IF;


    /*
    No duplicate property-boundary combinations.
    */
    SELECT COUNT(*)
    INTO duplicate_boundary_count

    FROM
    (
        SELECT
            prprty_ky,
            bndry_ky

        FROM geo.prprty_bndry

        GROUP BY
            prprty_ky,
            bndry_ky

        HAVING COUNT(*) > 1
    ) duplicate_boundaries;

    IF duplicate_boundary_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % duplicate property-boundary assignments remain.',
            duplicate_boundary_count;
    END IF;


    /*
    No orphaned property-boundary assignments.
    */
    SELECT COUNT(*)
    INTO orphan_boundary_count

    FROM geo.prprty_bndry property_boundary

    LEFT JOIN dw.prprty property
      ON property.prprty_ky =
         property_boundary.prprty_ky

    WHERE property.prprty_ky IS NULL;

    IF orphan_boundary_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % orphaned property-boundary assignments remain.',
            orphan_boundary_count;
    END IF;
END
$$;


/* ============================================================
   20. Return a summary
   ============================================================ */

SELECT
    (
        SELECT COUNT(*)
        FROM tmp_prprty_merge_map
    ) AS merged_property_count,

    (
        SELECT COUNT(DISTINCT survivor_prprty_ky)
        FROM tmp_prprty_merge_map
    ) AS duplicate_survivor_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_unique_update
    ) AS unique_property_update_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_ranked
        WHERE dvlpmnt_ds ~ '\s*[#-]+\s*$'
    ) AS trailing_punctuation_candidate_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_ranked
        WHERE removed_unit_suffix IS NOT NULL
    ) AS removed_unit_suffix_count;


/* ============================================================
   21. Show mismatched numeric/unit-like endings for review

   This helps locate examples such as:

       BAY VIEW GRAND E 404
       unit_id = 401

   No update is automatically made solely because a development
   ends in a number.
   ============================================================ */

SELECT
    prprty_ky,
    dvlpmnt_ds,
    unit_id,
    corrected_dvlpmnt_ds,
    corrected_fingerprint,
    zone_ds,
    area_ds,
    cmnty_ds,
    lat_nb,
    long_nb

FROM tmp_prprty_ranked

WHERE NULLIF(BTRIM(unit_id), '') IS NOT NULL

  AND removed_unit_suffix IS NULL

  /*
  Development ends with something that looks like a unit:
      404
      A-12
      E 404
      PH3
  */
  AND dvlpmnt_ds ~*
      '(\s|^)(PH[- ]*[0-9A-Z]+|[A-Z]+[- ]+[0-9]+|[0-9]+[- ]+[A-Z]+|[0-9]{2,})\s*$'

  AND dvlpmnt_ds IS NOT DISTINCT FROM
      corrected_dvlpmnt_ds

ORDER BY
    dvlpmnt_ds,
    unit_id,
    prprty_ky;


/* ============================================================
   22. Force deferred constraints to be checked now
   ============================================================ */

SET CONSTRAINTS ALL IMMEDIATE;

/* ============================================================
   22a. REVIEW SUMMARY

   Supabase generally displays only the final SELECT result set.
   This summary appears before the detailed review query.
   ============================================================ */

SELECT
    (
        SELECT COUNT(*)
        FROM tmp_prprty_merge_map
    ) AS merged_property_count,

    (
        SELECT COUNT(DISTINCT survivor_prprty_ky)
        FROM tmp_prprty_merge_map
    ) AS survivor_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_unique_update
    ) AS unique_update_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_unique_update
        WHERE matched_unit_suffix IS NOT NULL
    ) AS unit_suffix_removal_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_unsafe_merge
    ) AS unsafe_merge_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_excluded_fingerprint
    ) AS excluded_fingerprint_count,

    (
        SELECT COUNT(*)
        FROM tmp_prprty_merge_approval
    ) AS approved_exception_count;


/* ============================================================
   22b. FINAL DISPLAY: Suspicious proposed merges

   This is intentionally the last SELECT before ROLLBACK so the
   Supabase SQL Editor displays these rows.

   It includes:
   - hard safety conflicts from tmp_prprty_unsafe_merge; and
   - softer area/community differences requiring review.
   ============================================================ */

SELECT
    merge_row.old_prprty_ky,
    merge_row.survivor_prprty_ky,

    merge_row.old_dvlpmnt_ds,
    merge_row.corrected_dvlpmnt_ds,
    merge_row.corrected_fingerprint,

    old_property.unit_id AS old_unit_id,
    survivor_property.unit_id AS survivor_unit_id,

    old_property.zone_ds AS old_zone_ds,
    survivor_property.zone_ds AS survivor_zone_ds,

    old_property.area_ds AS old_area_ds,
    survivor_property.area_ds AS survivor_area_ds,

    old_property.cmnty_ds AS old_cmnty_ds,
    survivor_property.cmnty_ds AS survivor_cmnty_ds,

    old_property.adrs_ds AS old_address,
    survivor_property.adrs_ds AS survivor_address,

    old_property.lat_nb AS old_latitude,
    survivor_property.lat_nb AS survivor_latitude,

    old_property.long_nb AS old_longitude,
    survivor_property.long_nb AS survivor_longitude,

    CASE
        WHEN approval.old_prprty_ky IS NOT NULL
        THEN 'APPROVED EXCEPTION'

        WHEN old_property.zone_ds
                 IS DISTINCT FROM survivor_property.zone_ds
        THEN 'BLOCK: DIFFERENT ZONE'

        WHEN old_property.lat_nb IS NOT NULL
         AND survivor_property.lat_nb IS NOT NULL
         AND ABS(
                old_property.lat_nb
                - survivor_property.lat_nb
             ) > 0.003
        THEN 'BLOCK: LATITUDE DIFFERENCE'

        WHEN old_property.long_nb IS NOT NULL
         AND survivor_property.long_nb IS NOT NULL
         AND ABS(
                old_property.long_nb
                - survivor_property.long_nb
             ) > 0.003
        THEN 'BLOCK: LONGITUDE DIFFERENCE'

        WHEN old_property.area_ds
                 IS DISTINCT FROM survivor_property.area_ds
        THEN 'REVIEW: DIFFERENT AREA'

        WHEN old_property.cmnty_ds
                 IS DISTINCT FROM survivor_property.cmnty_ds
        THEN 'REVIEW: DIFFERENT COMMUNITY'

        ELSE 'REVIEW'
    END AS review_reason,

    approval.approval_reason_tx

FROM tmp_prprty_merge_map merge_row

JOIN tmp_prprty_ranked old_property
  ON old_property.prprty_ky =
     merge_row.old_prprty_ky

JOIN tmp_prprty_ranked survivor_property
  ON survivor_property.prprty_ky =
     merge_row.survivor_prprty_ky

LEFT JOIN tmp_prprty_merge_approval approval
  ON approval.old_prprty_ky =
     merge_row.old_prprty_ky
 AND approval.expected_corrected_fingerprint =
     merge_row.corrected_fingerprint

WHERE
       EXISTS
       (
           SELECT 1
           FROM tmp_prprty_unsafe_merge unsafe
           WHERE unsafe.old_prprty_ky =
                 merge_row.old_prprty_ky
       )

    OR old_property.area_ds
           IS DISTINCT FROM survivor_property.area_ds

    OR old_property.cmnty_ds
           IS DISTINCT FROM survivor_property.cmnty_ds

    OR approval.old_prprty_ky IS NOT NULL

ORDER BY
    review_reason,
    merge_row.corrected_fingerprint,
    merge_row.old_prprty_ky;


/*
IMPORTANT BEFORE COMMITTING

Keep ROLLBACK while reviewing.

When ready for the permanent run:

1. Confirm tmp_prprty_unsafe_merge returns zero rows.
2. Confirm the excluded fingerprints are intentionally preserved.
3. Uncomment the guard below.
4. Replace the final ROLLBACK with COMMIT.

DO $$
DECLARE
    unsafe_merge_count bigint;
    excluded_group_touched_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO unsafe_merge_count
    FROM tmp_prprty_unsafe_merge;

    IF unsafe_merge_count <> 0 THEN
        RAISE EXCEPTION
            'Commit stopped: % geographically unsafe merges remain.',
            unsafe_merge_count;
    END IF;


    /*
    Excluded groups must not appear in either the merge map or the
    unique-update list.
    */
    SELECT
          (
              SELECT COUNT(*)
              FROM tmp_prprty_merge_map merge_row
              JOIN tmp_prprty_excluded_fingerprint excluded
                ON excluded.corrected_fingerprint =
                   merge_row.corrected_fingerprint
          )
        + (
              SELECT COUNT(*)
              FROM tmp_prprty_unique_update unique_row
              JOIN tmp_prprty_excluded_fingerprint excluded
                ON excluded.corrected_fingerprint =
                   unique_row.corrected_fingerprint
          )
    INTO excluded_group_touched_count;

    IF excluded_group_touched_count <> 0 THEN
        RAISE EXCEPTION
            'Commit stopped: % excluded-group rows entered the merge/update lists.',
            excluded_group_touched_count;
    END IF;
END
$$;
*/


/* ============================================================
   23. Commit after all validations succeed
   ============================================================ */

COMMIT;