CREATE OR REPLACE FUNCTION public.resolve_geography(p_search text, p_expected_entity_type_cd text DEFAULT NULL::text, p_limit integer DEFAULT 10)
 RETURNS TABLE(entity_ky bigint, entity_identifier_cd text, entity_type_cd text, entity_type_nm text, canonical_nm text, entity_source_cd text, longitude_nb numeric, latitude_nb numeric, matched_variant_nm text, matched_variant_type_cd text, matched_language_cd text, match_method text, confidence_nb numeric, parent_entity_ky bigint, parent_entity_type_cd text, parent_canonical_nm text, hierarchy_js jsonb)
 LANGUAGE sql
 STABLE
AS $function$
WITH RECURSIVE

-- --------------------------------------------------
-- Normalize the search text once
-- --------------------------------------------------

search_input AS
(
    SELECT
        NULLIF(TRIM(p_search), '') AS search_tx,

        REGEXP_REPLACE
        (
            TRANSLATE
            (
                LOWER(TRIM(COALESCE(p_search, ''))),
                'áéíóúüñàèìòùäëïöç',
                'aeiouunaeiouaeiouc'
            ),
            '[^a-z0-9]+',
            ' ',
            'g'
        ) AS normalized_search_tx
),

-- --------------------------------------------------
-- Create normalized versions of all searchable names
-- --------------------------------------------------

variant_source AS
(
    SELECT
        e.entity_ky,
        e.entity_identifier_cd,
        e.entity_type_cd,
        et.entity_type_nm,
        e.entity_source_cd,
        e.longitude_nb,
        e.latitude_nb,

        v.entity_variant_ky,
        v.variant_type_cd,
        v.entity_variant_nm,
        v.language_cd,

        LOWER(TRIM(v.entity_variant_nm)) AS lower_variant_nm,

        REGEXP_REPLACE
        (
            TRANSLATE
            (
                LOWER(TRIM(v.entity_variant_nm)),
                'áéíóúüñàèìòùäëïöç',
                'aeiouunaeiouaeiouc'
            ),
            '[^a-z0-9]+',
            ' ',
            'g'
        ) AS normalized_variant_nm

    FROM geo.entity e

    JOIN geo.entity_type_lu et
      ON et.entity_type_cd = e.entity_type_cd

    JOIN geo.entity_variant v
      ON v.entity_ky = e.entity_ky

    WHERE
    (
        p_expected_entity_type_cd IS NULL
        OR e.entity_type_cd = p_expected_entity_type_cd
    )
),

-- --------------------------------------------------
-- Score each matching variant
-- --------------------------------------------------

candidate_matches AS
(
    SELECT
        vs.*,

        CASE
            WHEN vs.variant_type_cd = 'CA'
             AND vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 'canonical_exact'

            WHEN vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 'variant_exact'

            WHEN vs.normalized_variant_nm =
                 si.normalized_search_tx
                THEN 'normalized_exact'

            WHEN LENGTH(si.normalized_search_tx) >= 4
             AND
             (
                 LENGTH(si.normalized_search_tx) >= 4
                    AND vs.normalized_variant_nm LIKE
                        si.normalized_search_tx || '%'
             )
                THEN 'prefix'

            ELSE NULL
        END AS match_method,

        CASE
            WHEN vs.variant_type_cd = 'CA'
             AND vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 1.00::numeric

            WHEN vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 0.98::numeric

            WHEN vs.normalized_variant_nm =
                 si.normalized_search_tx
                THEN 0.95::numeric

            WHEN LENGTH(si.normalized_search_tx) >= 4
             AND
             (
                 LENGTH(si.normalized_search_tx) >= 4
                    AND vs.normalized_variant_nm LIKE
                        si.normalized_search_tx || '%'
             )
                THEN 0.80::numeric

            ELSE 0.00::numeric
        END AS confidence_nb,

        CASE
            WHEN vs.variant_type_cd = 'CA'
             AND vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 1

            WHEN vs.lower_variant_nm = LOWER(si.search_tx)
                THEN 2

            WHEN vs.normalized_variant_nm =
                 si.normalized_search_tx
                THEN 3

            WHEN LENGTH(si.normalized_search_tx) >= 4
             AND
             (
                 LENGTH(si.normalized_search_tx) >= 4
                    AND vs.normalized_variant_nm LIKE
                        si.normalized_search_tx || '%'
             )
                THEN 4

            ELSE 99
        END AS match_rank_nb

    FROM variant_source vs
    CROSS JOIN search_input si

    WHERE si.search_tx IS NOT NULL
),

-- --------------------------------------------------
-- Keep the best matching variant for each entity
-- --------------------------------------------------

best_entity_match AS
(
    SELECT DISTINCT ON (entity_ky)
        *
    FROM candidate_matches
    WHERE match_method IS NOT NULL
    ORDER BY
        entity_ky,
        match_rank_nb,
        CASE variant_type_cd
            WHEN 'CA' THEN 1
            WHEN 'CO' THEN 2
            WHEN 'AL' THEN 3
            WHEN 'ML' THEN 4
            WHEN 'AB' THEN 5
            WHEN 'LE' THEN 6
            WHEN 'MS' THEN 7
            ELSE 99
        END,
        CASE language_cd
            WHEN 'EN' THEN 1
            WHEN 'ES' THEN 2
            ELSE 3
        END,
        entity_variant_ky
),

-- --------------------------------------------------
-- Canonical display name for every entity
-- Prefer English, then Spanish, then another CA name
-- --------------------------------------------------

canonical_names AS
(
    SELECT DISTINCT ON (v.entity_ky)
        v.entity_ky,
        v.entity_variant_nm AS canonical_nm
    FROM geo.entity_variant v
    WHERE v.variant_type_cd = 'CA'
    ORDER BY
        v.entity_ky,
        CASE v.language_cd
            WHEN 'EN' THEN 1
            WHEN 'ES' THEN 2
            ELSE 3
        END,
        v.entity_variant_ky
),

-- --------------------------------------------------
-- Follow only canonical hierarchy relationships
-- CB = Contained By
-- PO = Part Of
-- --------------------------------------------------

ancestor_tree AS
(
    SELECT
        bem.entity_ky AS origin_entity_ky,
        bem.entity_ky AS ancestor_entity_ky,
        0 AS depth_nb,
        ARRAY[bem.entity_ky]::bigint[] AS path_ky

    FROM best_entity_match bem

    UNION ALL

    SELECT
        at.origin_entity_ky,
        er.parent_entity_ky,
        at.depth_nb + 1,
        at.path_ky || er.parent_entity_ky

    FROM ancestor_tree at

    JOIN geo.entity_relationship er
      ON er.child_entity_ky = at.ancestor_entity_ky
     AND er.relationship_type_cd IN ('CB', 'PO')

    WHERE NOT er.parent_entity_ky = ANY(at.path_ky)
      AND at.depth_nb < 10
),

ancestor_details AS
(
    SELECT
        at.origin_entity_ky,
        at.ancestor_entity_ky,
        at.depth_nb,

        e.entity_identifier_cd,
        e.entity_type_cd,
        cn.canonical_nm,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                at.origin_entity_ky,
                e.entity_type_cd

            ORDER BY
                at.depth_nb,
                at.ancestor_entity_ky
        ) AS entity_type_rank_nb

    FROM ancestor_tree at

    JOIN geo.entity e
      ON e.entity_ky = at.ancestor_entity_ky

    LEFT JOIN canonical_names cn
      ON cn.entity_ky = e.entity_ky
),

hierarchy_rollup AS
(
    SELECT
        origin_entity_ky,

        JSONB_OBJECT_AGG
        (
            CASE entity_type_cd
                WHEN 'ZN' THEN 'zone'
                WHEN 'AR' THEN 'area'
                WHEN 'CM' THEN 'community'
                WHEN 'DV' THEN 'development'
                WHEN 'BD' THEN 'building'
                WHEN 'NB' THEN 'neighborhood'
                WHEN 'PL' THEN 'place'
                ELSE LOWER(entity_type_cd)
            END,

            JSONB_BUILD_OBJECT
            (
                'entityKey',
                ancestor_entity_ky,

                'identifier',
                entity_identifier_cd,

                'name',
                canonical_nm
            )
        ) AS hierarchy_js

    FROM ancestor_details

    WHERE entity_type_rank_nb = 1

    GROUP BY origin_entity_ky
),

-- --------------------------------------------------
-- Immediate canonical parent
-- --------------------------------------------------

immediate_parent AS
(
    SELECT DISTINCT ON (er.child_entity_ky)
        er.child_entity_ky,
        p.entity_ky AS parent_entity_ky,
        p.entity_type_cd AS parent_entity_type_cd,
        cn.canonical_nm AS parent_canonical_nm

    FROM geo.entity_relationship er

    JOIN geo.entity p
      ON p.entity_ky = er.parent_entity_ky

    LEFT JOIN canonical_names cn
      ON cn.entity_ky = p.entity_ky

    WHERE er.relationship_type_cd IN ('CB', 'PO')

    ORDER BY
        er.child_entity_ky,
        CASE er.relationship_type_cd
            WHEN 'CB' THEN 1
            WHEN 'PO' THEN 2
            ELSE 3
        END,
        er.entity_relationship_ky
)

SELECT
    bem.entity_ky,
    bem.entity_identifier_cd,
    bem.entity_type_cd,
    bem.entity_type_nm,
    cn.canonical_nm,
    bem.entity_source_cd,
    bem.longitude_nb,
    bem.latitude_nb,

    bem.entity_variant_nm AS matched_variant_nm,
    bem.variant_type_cd AS matched_variant_type_cd,
    bem.language_cd AS matched_language_cd,

    bem.match_method,
    bem.confidence_nb,

    ip.parent_entity_ky,
    ip.parent_entity_type_cd,
    ip.parent_canonical_nm,

    COALESCE(hr.hierarchy_js, '{}'::jsonb) AS hierarchy_js

FROM best_entity_match bem

LEFT JOIN canonical_names cn
  ON cn.entity_ky = bem.entity_ky

LEFT JOIN immediate_parent ip
  ON ip.child_entity_ky = bem.entity_ky

LEFT JOIN hierarchy_rollup hr
  ON hr.origin_entity_ky = bem.entity_ky

ORDER BY
    bem.match_rank_nb,
    bem.confidence_nb DESC,

    CASE bem.entity_type_cd
        WHEN 'ZN' THEN 1
        WHEN 'AR' THEN 2
        WHEN 'CM' THEN 3
        WHEN 'NB' THEN 4
        WHEN 'DV' THEN 5
        WHEN 'BD' THEN 6
        WHEN 'PL' THEN 7
        ELSE 99
    END,

    cn.canonical_nm

LIMIT LEAST
(
    GREATEST(COALESCE(p_limit, 10), 1),
    50
);
$function$