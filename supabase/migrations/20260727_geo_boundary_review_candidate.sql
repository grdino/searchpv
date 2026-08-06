CREATE OR REPLACE VIEW geo.v_boundary_review_candidate
AS
WITH approved_boundaries AS
(
    SELECT DISTINCT
        bem.boundary_ky
    FROM geo.boundary_entity_match bem
    WHERE bem.review_status_cd IN
    (
        'AUTO_APPROVE',
        'MANUAL_APPROVE'
    )
),

completed_non_community AS
(
    SELECT DISTINCT
        bem.boundary_ky
    FROM geo.boundary_entity_match bem
    WHERE bem.review_status_cd = 'NON_COMMUNITY'
),

property_points AS
(
    SELECT
        p.prprty_ky,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,

        ST_SetSRID
        (
            ST_MakePoint
            (
                p.long_nb,
                p.lat_nb
            ),
            4326
        ) AS geometry

    FROM dw.prprty p

    WHERE p.long_nb IS NOT NULL
      AND p.lat_nb IS NOT NULL
      AND p.long_nb BETWEEN -106.00 AND -104.50
      AND p.lat_nb BETWEEN 19.50 AND 21.50
),

unresolved_boundaries AS
(
    SELECT
        b.boundary_ky,
        b.boundary_nm,
        b.geometry

    FROM geo.boundary b

    WHERE NOT EXISTS
    (
        SELECT 1
        FROM approved_boundaries ab
        WHERE ab.boundary_ky = b.boundary_ky
    )

    AND NOT EXISTS
    (
        SELECT 1
        FROM completed_non_community nc
        WHERE nc.boundary_ky = b.boundary_ky
    )
),

spatial_counts AS
(
    SELECT
        b.boundary_ky,
        b.boundary_nm,

        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,

        COUNT(p.prprty_ky) AS property_count

    FROM unresolved_boundaries b

    LEFT JOIN property_points p
      ON b.geometry && p.geometry
     AND ST_Covers
     (
         b.geometry,
         p.geometry
     )

    GROUP BY
        b.boundary_ky,
        b.boundary_nm,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds
),

ranked_candidates AS
(
    SELECT
        sc.*,

        SUM(sc.property_count) OVER
        (
            PARTITION BY sc.boundary_ky
        ) AS total_property_count,

        ROW_NUMBER() OVER
        (
            PARTITION BY sc.boundary_ky
            ORDER BY
                sc.property_count DESC,
                sc.zone_ds NULLS LAST,
                sc.area_ds NULLS LAST,
                sc.cmnty_ds NULLS LAST
        ) AS candidate_rank_nb

    FROM spatial_counts sc
),

resolved_candidates AS
(
    SELECT
        rc.boundary_ky,
        rc.boundary_nm,
        rc.candidate_rank_nb,

        rc.zone_ds AS candidate_zone_nm,
        rc.area_ds AS candidate_area_nm,
        rc.cmnty_ds AS candidate_community_nm,

        rc.property_count AS candidate_property_count,
        rc.total_property_count,

        CASE
            WHEN rc.total_property_count > 0
            THEN
                rc.property_count::numeric
                / rc.total_property_count::numeric
            ELSE NULL
        END AS spatial_confidence_nb,

        CASE
            WHEN rc.zone_ds IS NOT NULL
             AND rc.area_ds IS NOT NULL
             AND rc.cmnty_ds IS NOT NULL
            THEN
                'cm__'
                || geo.identifier_slug(rc.zone_ds)
                || '__'
                || geo.identifier_slug(rc.area_ds)
                || '__'
                || geo.identifier_slug(rc.cmnty_ds)
            ELSE NULL
        END AS candidate_entity_identifier_cd

    FROM ranked_candidates rc

    WHERE rc.candidate_rank_nb <= 5
      AND rc.property_count > 0
)

SELECT
    rc.boundary_ky,
    rc.boundary_nm,
    rc.candidate_rank_nb,

    rc.candidate_zone_nm,
    rc.candidate_area_nm,
    rc.candidate_community_nm,

    rc.candidate_property_count,
    rc.total_property_count,

    ROUND
    (
        rc.spatial_confidence_nb,
        4
    ) AS spatial_confidence_nb,

    rc.candidate_entity_identifier_cd,

    e.entity_ky AS candidate_entity_ky,
    e.entity_type_cd AS candidate_entity_type_cd,

    CASE
        WHEN e.entity_ky IS NOT NULL
        THEN true
        ELSE false
    END AS candidate_entity_exists_fg,

    CASE
        WHEN rc.candidate_community_nm IS NOT NULL
         AND geo.identifier_slug(rc.boundary_nm)
             =
             geo.identifier_slug(rc.candidate_community_nm)
        THEN true
        ELSE false
    END AS normalized_name_exact_fg

FROM resolved_candidates rc

LEFT JOIN geo.entity e
  ON e.entity_identifier_cd
   = rc.candidate_entity_identifier_cd;