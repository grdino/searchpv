BEGIN;


/* ============================================================
   1. Remove temporary tables if they already exist
   ============================================================ */

DROP TABLE IF EXISTS tmp_prprty_normalized;
DROP TABLE IF EXISTS tmp_prprty_nonduplicate_cleanup;


/* ============================================================
   2. Calculate corrected development names and fingerprints
      for every remaining property row

   These are the same cleanup rules used in the duplicate
   property merge:

   - Remove a trailing #
   - Remove a trailing standalone PH
   - Remove a trailing standalone LOT
   - Collapse repeated spaces
   - Recalculate the property fingerprint
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_normalized
ON COMMIT DROP
AS
WITH normalized_development AS
(
    SELECT
        p.prprty_ky,

        p.dvlpmnt_ds AS old_dvlpmnt_ds,
        p.prprty_fngrprnt_id AS old_fingerprint,

        p.bldng_ds,
        p.unit_id,
        p.tax_id,
        p.adrs_ds,

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

corrected_values AS
(
    SELECT
        n.*,

        CASE
            /*
            Development + building + unit.
            */
            WHEN corrected_dvlpmnt_ds IS NOT NULL
             AND NULLIF(BTRIM(bldng_ds), '') IS NOT NULL
             AND NULLIF(BTRIM(unit_id), '') IS NOT NULL
            THEN
                corrected_dvlpmnt_ds
                || '|'
                || BTRIM(bldng_ds)
                || '|'
                || BTRIM(unit_id)

            /*
            Development + unit.
            */
            WHEN corrected_dvlpmnt_ds IS NOT NULL
             AND NULLIF(BTRIM(unit_id), '') IS NOT NULL
            THEN
                corrected_dvlpmnt_ds
                || '|'
                || BTRIM(unit_id)

            /*
            If development cleanup results in NULL but the property
            has a unit, preserve the current fingerprint.

            This prevents separate units sharing a tax ID from being
            unintentionally collapsed.
            */
            WHEN NULLIF(BTRIM(unit_id), '') IS NOT NULL
             AND NULLIF(BTRIM(old_fingerprint), '') IS NOT NULL
            THEN
                old_fingerprint

            /*
            Tax ID fallback.
            */
            WHEN NULLIF(BTRIM(tax_id), '') IS NOT NULL
            THEN
                BTRIM(tax_id)

            /*
            Address fallback.
            */
            WHEN NULLIF(BTRIM(adrs_ds), '') IS NOT NULL
            THEN
                BTRIM(adrs_ds)

            ELSE
                old_fingerprint
        END AS corrected_fingerprint

    FROM normalized_development n
)

SELECT
    c.*,

    /*
    Count how many property rows would have this fingerprint
    after normalization.
    */
    COUNT(*) OVER
    (
        PARTITION BY corrected_fingerprint
    ) AS corrected_fingerprint_count

FROM corrected_values c;


/* ============================================================
   3. Build the list of safe nonduplicate rows to update

   Only include rows where:

   - the corrected fingerprint occurs exactly once, and
   - either the development or fingerprint actually changes
   ============================================================ */

CREATE TEMP TABLE tmp_prprty_nonduplicate_cleanup
ON COMMIT DROP
AS
SELECT
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint

FROM tmp_prprty_normalized

WHERE corrected_fingerprint_count = 1

  AND
  (
      old_dvlpmnt_ds
          IS DISTINCT FROM corrected_dvlpmnt_ds

      OR old_fingerprint
          IS DISTINCT FROM corrected_fingerprint
  );


/* ============================================================
   4. Confirm the cleanup list contains no duplicate property keys
   ============================================================ */

DO $$
DECLARE
    duplicate_property_key_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_property_key_count
    FROM
    (
        SELECT
            prprty_ky
        FROM tmp_prprty_nonduplicate_cleanup
        GROUP BY prprty_ky
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_property_key_count <> 0 THEN
        RAISE EXCEPTION
            'Cleanup stopped: % property keys occur more than once.',
            duplicate_property_key_count;
    END IF;
END
$$;


/* ============================================================
   5. Validate the projected final fingerprint state

   For rows eligible for safe cleanup, use the corrected
   fingerprint.

   For unresolved duplicate groups, retain the current
   fingerprint.

   The projected final state must not contain duplicate
   fingerprints.
   ============================================================ */

DO $$
DECLARE
    projected_duplicate_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO projected_duplicate_count
    FROM
    (
        SELECT
            COALESCE(
                cleanup.corrected_fingerprint,
                property.prprty_fngrprnt_id
            ) AS projected_fingerprint

        FROM dw.prprty property

        LEFT JOIN tmp_prprty_nonduplicate_cleanup cleanup
            ON cleanup.prprty_ky = property.prprty_ky

        WHERE COALESCE(
            cleanup.corrected_fingerprint,
            property.prprty_fngrprnt_id
        ) IS NOT NULL

        GROUP BY
            COALESCE(
                cleanup.corrected_fingerprint,
                property.prprty_fngrprnt_id
            )

        HAVING COUNT(*) > 1
    ) duplicate_fingerprints;

    IF projected_duplicate_count <> 0 THEN
        RAISE EXCEPTION
            'Cleanup stopped: the projected result would contain % duplicate fingerprint groups.',
            projected_duplicate_count;
    END IF;
END
$$;


/* ============================================================
   6. Create a permanent audit table
   ============================================================ */

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

    cleanup_type_cd text NOT NULL
        DEFAULT 'NONDUPLICATE_NORMALIZATION',

    cleaned_at timestamptz NOT NULL
        DEFAULT now()
);


/* ============================================================
   7. Save all intended changes to the audit table
   ============================================================ */

INSERT INTO dw.prprty_cleanup_audit
(
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    cleanup_type_cd
)
SELECT
    prprty_ky,

    old_dvlpmnt_ds,
    corrected_dvlpmnt_ds,

    old_fingerprint,
    corrected_fingerprint,

    'NONDUPLICATE_NORMALIZATION'

FROM tmp_prprty_nonduplicate_cleanup;


/* ============================================================
   8. Temporarily replace fingerprints for rows being changed

   This prevents an immediate unique-index conflict when one
   fingerprint is changing into a value currently occupied by
   another row that is also being changed in this transaction.
   ============================================================ */

UPDATE dw.prprty property
SET prprty_fngrprnt_id =
    '__CLEANUP_PENDING__|'
    || property.prprty_ky::text
FROM tmp_prprty_nonduplicate_cleanup cleanup
WHERE property.prprty_ky = cleanup.prprty_ky;


/* ============================================================
   9. Apply the final corrected development and fingerprint
   ============================================================ */

UPDATE dw.prprty property
SET
    dvlpmnt_ds =
        cleanup.corrected_dvlpmnt_ds,

    prprty_fngrprnt_id =
        cleanup.corrected_fingerprint

FROM tmp_prprty_nonduplicate_cleanup cleanup

WHERE property.prprty_ky =
      cleanup.prprty_ky;


/* ============================================================
   10. Validate every updated row
   ============================================================ */

DO $$
DECLARE
    incorrect_updated_row_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO incorrect_updated_row_count

    FROM tmp_prprty_nonduplicate_cleanup expected

    JOIN dw.prprty actual
      ON actual.prprty_ky = expected.prprty_ky

    WHERE actual.dvlpmnt_ds
              IS DISTINCT FROM
              expected.corrected_dvlpmnt_ds

       OR actual.prprty_fngrprnt_id
              IS DISTINCT FROM
              expected.corrected_fingerprint;

    IF incorrect_updated_row_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % updated property rows contain incorrect values.',
            incorrect_updated_row_count;
    END IF;
END
$$;


/* ============================================================
   11. Confirm no temporary fingerprints remain
   ============================================================ */

DO $$
DECLARE
    temporary_fingerprint_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO temporary_fingerprint_count
    FROM dw.prprty
    WHERE prprty_fngrprnt_id LIKE
          '__CLEANUP_PENDING__|%';

    IF temporary_fingerprint_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % temporary fingerprints remain.',
            temporary_fingerprint_count;
    END IF;
END
$$;


/* ============================================================
   12. Confirm the complete property table has no duplicate
       non-null fingerprints
   ============================================================ */

DO $$
DECLARE
    duplicate_fingerprint_group_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_fingerprint_group_count
    FROM
    (
        SELECT
            prprty_fngrprnt_id
        FROM dw.prprty
        WHERE prprty_fngrprnt_id IS NOT NULL
        GROUP BY prprty_fngrprnt_id
        HAVING COUNT(*) > 1
    ) duplicate_groups;

    IF duplicate_fingerprint_group_count <> 0 THEN
        RAISE EXCEPTION
            'Validation failed: % duplicate fingerprint groups remain.',
            duplicate_fingerprint_group_count;
    END IF;
END
$$;


/* ============================================================
   13. Return cleanup summary
   ============================================================ */

SELECT
    COUNT(*) AS cleaned_property_count,

    COUNT(*) FILTER
    (
        WHERE old_dvlpmnt_ds
              IS DISTINCT FROM corrected_dvlpmnt_ds
    ) AS development_name_change_count,

    COUNT(*) FILTER
    (
        WHERE old_fingerprint
              IS DISTINCT FROM corrected_fingerprint
    ) AS fingerprint_change_count,

    COUNT(*) FILTER
    (
        WHERE old_dvlpmnt_ds ~* '#\s*$'
    ) AS trailing_hash_removed_count,

    COUNT(*) FILTER
    (
        WHERE old_dvlpmnt_ds ~*
              '\s+(PH|LOT)\s*$'
    ) AS trailing_ph_or_lot_removed_count

FROM tmp_prprty_nonduplicate_cleanup;


/* ============================================================
   14. Show rows that were intentionally not updated because
       their corrected fingerprints still form duplicate groups

   These require a duplicate merge decision rather than a simple
   nonduplicate cleanup.
   ============================================================ */

SELECT
    corrected_fingerprint,

    COUNT(*) AS property_count,

    ARRAY_AGG(
        prprty_ky
        ORDER BY prprty_ky
    ) AS property_keys,

    ARRAY_AGG(
        old_dvlpmnt_ds
        ORDER BY prprty_ky
    ) AS current_development_names

FROM tmp_prprty_normalized

WHERE corrected_fingerprint_count > 1

GROUP BY corrected_fingerprint

ORDER BY
    property_count DESC,
    corrected_fingerprint;


/* ============================================================
   15. Force deferred constraint checks before commit
   ============================================================ */

SET CONSTRAINTS ALL IMMEDIATE;


/* ============================================================
   16. Commit after all validations pass
   ============================================================ */

COMMIT;