BEGIN;


/* ============================================================
   1. Remove temporary tables if this session already has them
   ============================================================ */

DROP TABLE IF EXISTS tmp_prprty_merge_map;
DROP TABLE IF EXISTS tmp_prprty_survivor_override;
DROP TABLE IF EXISTS tmp_prprty_ranked;


/* ============================================================
   2. Calculate corrected developments and fingerprints
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_ranked
ON COMMIT DROP
AS
WITH normalized AS
(
    SELECT
        p.*,

        NULLIF(
            BTRIM(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            BTRIM(COALESCE(p.dvlpmnt_ds, '')),

                            /* Remove a trailing #. */
                            '\s*#\s*$',
                            '',
                            'i'
                        ),

                        /* Remove a trailing standalone PH or LOT. */
                        '\s+(PH|LOT)\s*$',
                        '',
                        'i'
                    ),

                    /* Collapse repeated spaces. */
                    '\s+',
                    ' ',
                    'g'
                )
            ),
            ''
        ) AS corrected_dvlpmnt_ds

    FROM dw.prprty p
),

candidates AS
(
    SELECT
        n.*,

        CASE
            /* Development + building + unit. */
            WHEN corrected_dvlpmnt_ds IS NOT NULL
             AND NULLIF(BTRIM(bldng_ds), '') IS NOT NULL
             AND NULLIF(BTRIM(unit_id), '') IS NOT NULL
            THEN
                corrected_dvlpmnt_ds
                || '|'
                || BTRIM(bldng_ds)
                || '|'
                || BTRIM(unit_id)

            /* Development + unit. */
            WHEN corrected_dvlpmnt_ds IS NOT NULL
             AND NULLIF(BTRIM(unit_id), '') IS NOT NULL
            THEN
                corrected_dvlpmnt_ds
                || '|'
                || BTRIM(unit_id)

            /*
            When development cleanup produces a blank value but a unit
            exists, preserve the current fingerprint.

            This prevents separate units sharing one tax ID from being
            incorrectly collapsed into one property.
            */
            WHEN NULLIF(BTRIM(unit_id), '') IS NOT NULL
             AND NULLIF(BTRIM(prprty_fngrprnt_id), '') IS NOT NULL
            THEN
                prprty_fngrprnt_id

            /* Tax ID fallback. */
            WHEN NULLIF(BTRIM(tax_id), '') IS NOT NULL
            THEN
                BTRIM(tax_id)

            /* Address fallback. */
            WHEN NULLIF(BTRIM(adrs_ds), '') IS NOT NULL
            THEN
                BTRIM(adrs_ds)

            ELSE
                prprty_fngrprnt_id
        END AS corrected_fingerprint

    FROM normalized n
)

SELECT
    c.*,

    ROW_NUMBER() OVER
    (
        PARTITION BY corrected_fingerprint

        ORDER BY
            /*
            First preference:
            the property already has the corrected fingerprint.
            */
            CASE
                WHEN prprty_fngrprnt_id = corrected_fingerprint
                THEN 0
                ELSE 1
            END,

            /*
            Second preference:
            the property already has the corrected development.
            */
            CASE
                WHEN dvlpmnt_ds
                     IS NOT DISTINCT FROM corrected_dvlpmnt_ds
                THEN 0
                ELSE 1
            END,

            /*
            Third preference:
            retain the more complete property row.
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

            /* Final tie-breaker. */
            prprty_ky
    ) AS survivor_rank

FROM candidates c;


/* ============================================================
   3. Apply manually selected survivors
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_survivor_override
(
    corrected_fingerprint text PRIMARY KEY,
    survivor_prprty_ky bigint NOT NULL
)
ON COMMIT DROP;

INSERT INTO tmp_prprty_survivor_override
(
    corrected_fingerprint,
    survivor_prprty_ky
)
VALUES
    /* Keep property 1291 for Amapas 353 unit 19. */
    ('AMAPAS 353|19', 1291),

    /* Keep property 816 for Torre Punta Vallarta PH. */
    ('TORRE PUNTA VALLARTA|PH', 816);


/* ============================================================
   4. Validate the manual survivor selections
   ============================================================ */

DO $$
DECLARE
    invalid_override_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO invalid_override_count
    FROM tmp_prprty_survivor_override o
    LEFT JOIN tmp_prprty_ranked r
        ON r.corrected_fingerprint = o.corrected_fingerprint
       AND r.prprty_ky = o.survivor_prprty_ky
    WHERE r.prprty_ky IS NULL;

    IF invalid_override_count <> 0 THEN
        RAISE EXCEPTION
            '% manual survivor override(s) do not match the calculated duplicate groups.',
            invalid_override_count;
    END IF;
END
$$;


/* ============================================================
   5. Build duplicate-to-survivor merge map
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_merge_map
ON COMMIT DROP
AS
WITH duplicate_groups AS
(
    SELECT
        corrected_fingerprint
    FROM tmp_prprty_ranked
    WHERE corrected_fingerprint IS NOT NULL
    GROUP BY corrected_fingerprint
    HAVING COUNT(*) > 1
),

selected_survivors AS
(
    SELECT
        g.corrected_fingerprint,

        COALESCE(
            o.survivor_prprty_ky,
            ranked.prprty_ky
        ) AS survivor_prprty_ky

    FROM duplicate_groups g

    LEFT JOIN tmp_prprty_survivor_override o
        ON o.corrected_fingerprint =
           g.corrected_fingerprint

    LEFT JOIN tmp_prprty_ranked ranked
        ON ranked.corrected_fingerprint =
           g.corrected_fingerprint
       AND ranked.survivor_rank = 1
)

SELECT
    duplicate.prprty_ky AS old_prprty_ky,
    selected.survivor_prprty_ky,

    duplicate.prprty_fngrprnt_id AS old_fingerprint,
    duplicate.corrected_fingerprint,

    duplicate.dvlpmnt_ds AS old_dvlpmnt_ds,
    duplicate.corrected_dvlpmnt_ds

FROM tmp_prprty_ranked duplicate

JOIN selected_survivors selected
    ON selected.corrected_fingerprint =
       duplicate.corrected_fingerprint

WHERE duplicate.prprty_ky <>
      selected.survivor_prprty_ky;


/* ============================================================
   6. Validate the merge map before changing permanent data
   ============================================================ */

DO $$
DECLARE
    merge_count bigint;
    duplicate_old_key_count bigint;
    self_merge_count bigint;
    missing_old_property_count bigint;
    missing_survivor_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO merge_count
    FROM tmp_prprty_merge_map;

    IF merge_count = 0 THEN
        RAISE EXCEPTION
            'Merge stopped: no duplicate property rows were found.';
    END IF;


    SELECT COUNT(*)
    INTO duplicate_old_key_count
    FROM
    (
        SELECT
            old_prprty_ky
        FROM tmp_prprty_merge_map
        GROUP BY old_prprty_ky
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_old_key_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % duplicate old property keys exist in the merge map.',
            duplicate_old_key_count;
    END IF;


    SELECT COUNT(*)
    INTO self_merge_count
    FROM tmp_prprty_merge_map
    WHERE old_prprty_ky = survivor_prprty_ky;

    IF self_merge_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % rows attempt to merge a property into itself.',
            self_merge_count;
    END IF;


    SELECT COUNT(*)
    INTO missing_old_property_count
    FROM tmp_prprty_merge_map map
    LEFT JOIN dw.prprty p
        ON p.prprty_ky = map.old_prprty_ky
    WHERE p.prprty_ky IS NULL;

    IF missing_old_property_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % duplicate property keys do not exist in dw.prprty.',
            missing_old_property_count;
    END IF;


    SELECT COUNT(*)
    INTO missing_survivor_count
    FROM
    (
        SELECT DISTINCT
            survivor_prprty_ky
        FROM tmp_prprty_merge_map
    ) map
    LEFT JOIN dw.prprty p
        ON p.prprty_ky = map.survivor_prprty_ky
    WHERE p.prprty_ky IS NULL;

    IF missing_survivor_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % survivor property keys do not exist in dw.prprty.',
            missing_survivor_count;
    END IF;
END
$$;


/* ============================================================
   7. Create a permanent audit table
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


/* ============================================================
   8. Save this merge map to the audit table
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


/* ============================================================
   9. Redirect foreign keys to the surviving properties
   ============================================================ */

UPDATE dw.clsd_sale child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


UPDATE dw.invntry_snap child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


UPDATE dw.lstng child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


UPDATE dw.lstng_prc_state child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


UPDATE dw.prc_hstry child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


UPDATE dw.stts_chg child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


/* ============================================================
   9A. Remove redundant property-boundary assignments

   geo.prprty_bndry has a unique constraint on:

       (prprty_ky, bndry_ky)

   If both the duplicate property and its survivor are already
   assigned to the same boundary, updating the duplicate row
   directly would violate that constraint.

   Retain the survivor's existing assignment and delete only the
   redundant assignment belonging to the duplicate property.
   ============================================================ */

DELETE FROM geo.prprty_bndry duplicate_assignment
USING
    tmp_prprty_merge_map map,
    geo.prprty_bndry survivor_assignment
WHERE duplicate_assignment.prprty_ky =
      map.old_prprty_ky

  AND survivor_assignment.prprty_ky =
      map.survivor_prprty_ky

  AND survivor_assignment.bndry_ky =
      duplicate_assignment.bndry_ky;


/* ============================================================
   9B. Redirect remaining property-boundary assignments
   ============================================================ */

UPDATE geo.prprty_bndry child
SET prprty_ky = map.survivor_prprty_ky
FROM tmp_prprty_merge_map map
WHERE child.prprty_ky = map.old_prprty_ky;


/* ============================================================
   10. Confirm no known FK references remain on duplicate keys
   ============================================================ */

DO $$
DECLARE
    remaining_reference_count bigint;
BEGIN
    SELECT
          (
              SELECT COUNT(*)
              FROM dw.clsd_sale child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.invntry_snap child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.lstng child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.lstng_prc_state child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.prc_hstry child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM dw.stts_chg child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

        + (
              SELECT COUNT(*)
              FROM geo.prprty_bndry child
              JOIN tmp_prprty_merge_map map
                ON map.old_prprty_ky = child.prprty_ky
          )

    INTO remaining_reference_count;

    IF remaining_reference_count <> 0 THEN
        RAISE EXCEPTION
            'Merge stopped: % child rows still reference duplicate property keys.',
            remaining_reference_count;
    END IF;
END
$$;


/* ============================================================
   11. Delete duplicate property rows
   ============================================================ */

DELETE FROM dw.prprty duplicate
USING tmp_prprty_merge_map map
WHERE duplicate.prprty_ky = map.old_prprty_ky;


/* ============================================================
   12. Clean the surviving property records
   ============================================================ */

UPDATE dw.prprty survivor
SET
    dvlpmnt_ds = clean.corrected_dvlpmnt_ds,
    prprty_fngrprnt_id = clean.corrected_fingerprint

FROM
(
    SELECT DISTINCT
        survivor_prprty_ky,
        corrected_dvlpmnt_ds,
        corrected_fingerprint
    FROM tmp_prprty_merge_map
) clean

WHERE survivor.prprty_ky =
      clean.survivor_prprty_ky;


/* ============================================================
   13. Final validation
   ============================================================ */

DO $$
DECLARE
    deleted_property_count bigint;
    incorrect_survivor_count bigint;
    remaining_duplicate_group_count bigint;
    duplicate_boundary_assignment_count bigint;
    orphan_boundary_assignment_count bigint;
BEGIN
    /*
    None of the old duplicate property keys should remain.
    */
    SELECT COUNT(*)
    INTO deleted_property_count
    FROM dw.prprty p
    JOIN tmp_prprty_merge_map map
      ON map.old_prprty_ky = p.prprty_ky;

    IF deleted_property_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % duplicate property rows still exist.',
            deleted_property_count;
    END IF;


    /*
    Every survivor should now have its corrected development and
    corrected fingerprint.
    */
    SELECT COUNT(*)
    INTO incorrect_survivor_count
    FROM
    (
        SELECT DISTINCT
            survivor_prprty_ky,
            corrected_dvlpmnt_ds,
            corrected_fingerprint
        FROM tmp_prprty_merge_map
    ) expected

    JOIN dw.prprty actual
      ON actual.prprty_ky =
         expected.survivor_prprty_ky

    WHERE actual.dvlpmnt_ds
              IS DISTINCT FROM expected.corrected_dvlpmnt_ds

       OR actual.prprty_fngrprnt_id
              IS DISTINCT FROM expected.corrected_fingerprint;

    IF incorrect_survivor_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % survivor rows have incorrect cleaned values.',
            incorrect_survivor_count;
    END IF;


    /*
    The corrected fingerprints involved in this merge should now
    identify only one property each.
    */
    SELECT COUNT(*)
    INTO remaining_duplicate_group_count
    FROM
    (
        SELECT
            p.prprty_fngrprnt_id
        FROM dw.prprty p
        WHERE p.prprty_fngrprnt_id IN
        (
            SELECT DISTINCT
                corrected_fingerprint
            FROM tmp_prprty_merge_map
        )
        GROUP BY p.prprty_fngrprnt_id
        HAVING COUNT(*) > 1
    ) remaining_duplicates;

    IF remaining_duplicate_group_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % corrected fingerprint groups remain duplicated.',
            remaining_duplicate_group_count;
    END IF;


    /*
    The property-boundary table should contain only one row for
    each property/boundary combination.
    */
    SELECT COUNT(*)
    INTO duplicate_boundary_assignment_count
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
    ) duplicate_assignments;

    IF duplicate_boundary_assignment_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % duplicate property-boundary assignments remain.',
            duplicate_boundary_assignment_count;
    END IF;


    /*
    Every geo.prprty_bndry property key must reference an existing
    dw.prprty row.
    */
    SELECT COUNT(*)
    INTO orphan_boundary_assignment_count
    FROM geo.prprty_bndry pb
    LEFT JOIN dw.prprty p
      ON p.prprty_ky = pb.prprty_ky
    WHERE p.prprty_ky IS NULL;

    IF orphan_boundary_assignment_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % orphaned property-boundary assignments remain.',
            orphan_boundary_assignment_count;
    END IF;
END
$$;


/* ============================================================
   14. Force deferred constraint checks before commit

   This causes any DEFERRABLE foreign-key or uniqueness checks
   to be evaluated now rather than waiting until COMMIT.
   ============================================================ */

SET CONSTRAINTS ALL IMMEDIATE;


/* ============================================================
   15. Return the completed merge summary
   ============================================================ */

SELECT
    COUNT(*) AS merged_property_count,
    COUNT(DISTINCT survivor_prprty_ky) AS survivor_count,

    COUNT(*) FILTER
    (
        WHERE corrected_fingerprint = 'AMAPAS 353|19'
          AND old_prprty_ky = 1445
          AND survivor_prprty_ky = 1291
    ) AS amapas_override_verified,

    COUNT(*) FILTER
    (
        WHERE corrected_fingerprint =
              'TORRE PUNTA VALLARTA|PH'
          AND old_prprty_ky = 1344
          AND survivor_prprty_ky = 816
    ) AS torre_override_verified

FROM tmp_prprty_merge_map;


/* ============================================================
   16. Commit only after all validations pass
   ============================================================ */

COMMIT;