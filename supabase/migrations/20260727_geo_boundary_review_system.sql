BEGIN;

/* ============================================================
   1. Normalize names for entity_identifier_cd construction
   ============================================================ */

CREATE OR REPLACE FUNCTION geo.identifier_slug
(
    p_value text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS
$$
    SELECT NULLIF
    (
        TRIM
        (
            BOTH '_'
            FROM REGEXP_REPLACE
            (
                REGEXP_REPLACE
                (
                    LOWER(UNACCENT(COALESCE(p_value, ''))),
                    '[^a-z0-9]+',
                    '_',
                    'g'
                ),
                '_+',
                '_',
                'g'
            )
        ),
        ''
    );
$$;

/* ============================================================
   2. Boundary review queue
   ============================================================ */

CREATE OR REPLACE VIEW geo.v_boundary_review_queue
AS
WITH completed_boundaries AS
(
    SELECT DISTINCT bem.boundary_ky
    FROM geo.boundary_entity_match bem
    WHERE bem.review_status_cd IN
    (
        'AUTO_APPROVE',
        'MANUAL_APPROVE',
        'NON_COMMUNITY'
    )
),
property_points AS
(
    SELECT
        p.prprty_ky,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        ST_SetSRID(ST_MakePoint(p.long_nb, p.lat_nb), 4326) AS geometry
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
        b.boundary_type_cd,
        b.geometry
    FROM geo.boundary b
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM completed_boundaries cb
        WHERE cb.boundary_ky = b.boundary_ky
    )
),
spatial_counts AS
(
    SELECT
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        COUNT(p.prprty_ky) AS property_count
    FROM unresolved_boundaries b
    LEFT JOIN property_points p
      ON b.geometry && p.geometry
     AND ST_Covers(b.geometry, p.geometry)
    GROUP BY
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
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
top_candidate AS
(
    SELECT
        rc.boundary_ky,
        rc.boundary_nm,
        rc.boundary_type_cd,
        rc.zone_ds AS candidate_zone_nm,
        rc.area_ds AS candidate_area_nm,
        rc.cmnty_ds AS candidate_community_nm,
        rc.property_count AS candidate_property_count,
        rc.total_property_count,
        CASE
            WHEN rc.total_property_count > 0
            THEN rc.property_count::numeric / rc.total_property_count::numeric
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
    WHERE rc.candidate_rank_nb = 1
),
resolved_candidate AS
(
    SELECT
        tc.*,
        e.entity_ky AS candidate_entity_ky,
        e.entity_type_cd AS candidate_entity_type_cd,
        CASE
            WHEN tc.boundary_nm IS NOT NULL
             AND tc.candidate_community_nm IS NOT NULL
            THEN geo.identifier_slug(tc.boundary_nm) = geo.identifier_slug(tc.candidate_community_nm)
            ELSE false
        END AS normalized_name_exact_fg
    FROM top_candidate tc
    LEFT JOIN geo.entity e
      ON e.entity_identifier_cd = tc.candidate_entity_identifier_cd
)
SELECT
    rc.boundary_ky,
    rc.boundary_nm,
    rc.boundary_type_cd,
    rc.candidate_entity_ky,
    rc.candidate_entity_identifier_cd,
    rc.candidate_entity_type_cd,
    rc.candidate_zone_nm,
    rc.candidate_area_nm,
    rc.candidate_community_nm,
    rc.candidate_property_count,
    rc.total_property_count,
    ROUND(rc.spatial_confidence_nb, 4) AS spatial_confidence_nb,
    rc.normalized_name_exact_fg,
    CASE
        WHEN COALESCE(rc.total_property_count, 0) < 3
        THEN 'INSUFFICIENT_SPATIAL_DATA'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND rc.normalized_name_exact_fg
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.90
        THEN 'AUTO_APPROVE'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND NOT rc.normalized_name_exact_fg
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.80
        THEN 'MANUAL_ALIAS'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND rc.total_property_count >= 3
         AND rc.spatial_confidence_nb >= 0.65
        THEN 'MANUAL_SPATIAL'
        WHEN rc.candidate_entity_ky IS NULL
         AND rc.candidate_community_nm IS NOT NULL
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.80
        THEN 'NEW_COMMUNITY'
        WHEN rc.candidate_entity_ky IS NULL
         AND rc.total_property_count >= 3
        THEN 'NO_MATCH'
        WHEN UPPER(COALESCE(rc.boundary_nm, '')) ~
             '(^|[[:space:][:punct:]])(AEROPUERTO|AIRPORT|CEMENTERIO|PANTEON|PARCELA|PARQUE INDUSTRIAL|PLANTA DE TRATAMIENTO|SUBESTACION|RELLENO SANITARIO|BASURERO|TERMINAL MARITIMA|CENTRAL CAMIONERA)($|[[:space:][:punct:]])'
        THEN 'NON_COMMUNITY'
        ELSE 'MANUAL_REVIEW'
    END AS recommendation_cd,
    CASE
        WHEN COALESCE(rc.total_property_count, 0) < 3
        THEN 'Too few MLS property points are inside this polygon.'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND rc.normalized_name_exact_fg
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.90
        THEN 'Exact community and hierarchy match with strong spatial evidence.'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND NOT rc.normalized_name_exact_fg
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.80
        THEN 'Strong spatial match, but the municipal and MLS names differ.'
        WHEN rc.candidate_entity_ky IS NOT NULL
         AND rc.total_property_count >= 3
         AND rc.spatial_confidence_nb >= 0.65
        THEN 'A canonical entity exists, but the spatial result should be reviewed.'
        WHEN rc.candidate_entity_ky IS NULL
         AND rc.candidate_community_nm IS NOT NULL
         AND rc.total_property_count >= 5
         AND rc.spatial_confidence_nb >= 0.80
        THEN 'The dominant MLS community may require a new canonical entity.'
        WHEN rc.candidate_entity_ky IS NULL
         AND rc.total_property_count >= 3
        THEN 'The dominant MLS hierarchy did not resolve to a canonical entity.'
        WHEN UPPER(COALESCE(rc.boundary_nm, '')) ~
             '(^|[[:space:][:punct:]])(AEROPUERTO|AIRPORT|CEMENTERIO|PANTEON|PARCELA|PARQUE INDUSTRIAL|PLANTA DE TRATAMIENTO|SUBESTACION|RELLENO SANITARIO|BASURERO|TERMINAL MARITIMA|CENTRAL CAMIONERA)($|[[:space:][:punct:]])'
        THEN 'The boundary name appears to describe infrastructure or a non-community record.'
        ELSE 'Manual review is required.'
    END AS recommendation_tx
FROM resolved_candidate rc;

/* ============================================================
   3. Ranked companion candidates
   ============================================================ */

CREATE OR REPLACE VIEW geo.v_boundary_review_candidate
AS
WITH completed_boundaries AS
(
    SELECT DISTINCT bem.boundary_ky
    FROM geo.boundary_entity_match bem
    WHERE bem.review_status_cd IN
    (
        'AUTO_APPROVE',
        'MANUAL_APPROVE',
        'NON_COMMUNITY'
    )
),
property_points AS
(
    SELECT
        p.prprty_ky,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        ST_SetSRID(ST_MakePoint(p.long_nb, p.lat_nb), 4326) AS geometry
    FROM dw.prprty p
    WHERE p.long_nb IS NOT NULL
      AND p.lat_nb IS NOT NULL
      AND p.long_nb BETWEEN -106.00 AND -104.50
      AND p.lat_nb BETWEEN 19.50 AND 21.50
),
unresolved_boundaries AS
(
    SELECT b.boundary_ky, b.boundary_nm, b.geometry
    FROM geo.boundary b
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM completed_boundaries cb
        WHERE cb.boundary_ky = b.boundary_ky
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
     AND ST_Covers(b.geometry, p.geometry)
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
            THEN rc.property_count::numeric / rc.total_property_count::numeric
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
    ROUND(rc.spatial_confidence_nb, 4) AS spatial_confidence_nb,
    rc.candidate_entity_identifier_cd,
    e.entity_ky AS candidate_entity_ky,
    e.entity_type_cd AS candidate_entity_type_cd,
    (e.entity_ky IS NOT NULL) AS candidate_entity_exists_fg,
    CASE
        WHEN rc.candidate_community_nm IS NOT NULL
        THEN geo.identifier_slug(rc.boundary_nm) = geo.identifier_slug(rc.candidate_community_nm)
        ELSE false
    END AS normalized_name_exact_fg
FROM resolved_candidates rc
LEFT JOIN geo.entity e
  ON e.entity_identifier_cd = rc.candidate_entity_identifier_cd;

/* ============================================================
   4. Review summary
   ============================================================ */

CREATE OR REPLACE VIEW geo.v_boundary_review_summary
AS
SELECT
    recommendation_cd,
    COUNT(*) AS boundary_count
FROM geo.v_boundary_review_queue
GROUP BY recommendation_cd;

/* ============================================================
   5. Approve the current recommended candidate
   ============================================================ */

CREATE OR REPLACE FUNCTION geo.approve_boundary_candidate
(
    p_boundary_ky bigint,
    p_entity_ky bigint,
    p_review_note_tx text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = geo, public
AS
$$
DECLARE
    v_match_ky bigint;
    v_candidate_name text;
    v_confidence_nb numeric;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    SELECT
        q.candidate_community_nm,
        q.spatial_confidence_nb
    INTO
        v_candidate_name,
        v_confidence_nb
    FROM geo.v_boundary_review_queue q
    WHERE q.boundary_ky = p_boundary_ky
      AND q.candidate_entity_ky = p_entity_ky;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Boundary % does not currently recommend entity %.',
            p_boundary_ky,
            p_entity_ky;
    END IF;

    IF EXISTS
    (
        SELECT 1
        FROM geo.boundary_entity_match bem
        WHERE bem.boundary_ky = p_boundary_ky
          AND bem.review_status_cd IN ('AUTO_APPROVE', 'MANUAL_APPROVE')
    )
    THEN
        RAISE EXCEPTION
            'Boundary % already has an approved entity.',
            p_boundary_ky;
    END IF;

    INSERT INTO geo.boundary_entity_match
    (
        boundary_ky,
        entity_ky,
        matched_entity_variant_ky,
        matched_name_tx,
        match_method_cd,
        confidence_nb,
        candidate_rank_nb,
        review_status_cd,
        review_note_tx,
        reviewed_by_tx,
        reviewed_dt
    )
    VALUES
    (
        p_boundary_ky,
        p_entity_ky,
        NULL,
        v_candidate_name,
        'OFFICE_BOUNDARY_REVIEW',
        v_confidence_nb,
        1,
        'MANUAL_APPROVE',
        COALESCE
        (
            NULLIF(TRIM(p_review_note_tx), ''),
            'Approved through the SearchPV boundary review page.'
        ),
        auth.uid()::text,
        NOW()
    )
    RETURNING boundary_entity_match_ky
    INTO v_match_ky;

    UPDATE geo.boundary
    SET entity_ky = p_entity_ky
    WHERE boundary_ky = p_boundary_ky;

    RETURN v_match_ky;
END;
$$;

/* ============================================================
   6. Mark a polygon as non-community
   ============================================================ */

CREATE OR REPLACE FUNCTION geo.mark_boundary_non_community
(
    p_boundary_ky bigint,
    p_review_note_tx text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = geo, public
AS
$$
DECLARE
    v_match_ky bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    IF NOT EXISTS
    (
        SELECT 1
        FROM geo.boundary
        WHERE boundary_ky = p_boundary_ky
    )
    THEN
        RAISE EXCEPTION 'Boundary % does not exist.', p_boundary_ky;
    END IF;

    IF EXISTS
    (
        SELECT 1
        FROM geo.boundary_entity_match bem
        WHERE bem.boundary_ky = p_boundary_ky
          AND bem.review_status_cd IN
          (
              'AUTO_APPROVE',
              'MANUAL_APPROVE',
              'NON_COMMUNITY'
          )
    )
    THEN
        RAISE EXCEPTION 'Boundary % has already been completed.', p_boundary_ky;
    END IF;

    INSERT INTO geo.boundary_entity_match
    (
        boundary_ky,
        entity_ky,
        matched_entity_variant_ky,
        matched_name_tx,
        match_method_cd,
        confidence_nb,
        candidate_rank_nb,
        review_status_cd,
        review_note_tx,
        reviewed_by_tx,
        reviewed_dt
    )
    VALUES
    (
        p_boundary_ky,
        NULL,
        NULL,
        NULL,
        'OFFICE_BOUNDARY_REVIEW',
        NULL,
        NULL,
        'NON_COMMUNITY',
        COALESCE
        (
            NULLIF(TRIM(p_review_note_tx), ''),
            'Marked as a non-community boundary through the SearchPV office.'
        ),
        auth.uid()::text,
        NOW()
    )
    RETURNING boundary_entity_match_ky
    INTO v_match_ky;

    UPDATE geo.boundary
    SET entity_ky = NULL
    WHERE boundary_ky = p_boundary_ky;

    RETURN v_match_ky;
END;
$$;

/* ============================================================
   7. Detail function for the map page
   ============================================================ */

CREATE OR REPLACE FUNCTION geo.get_boundary_review_detail
(
    p_boundary_ky bigint
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = geo, public
AS
$$
    WITH selected_boundary AS
    (
        SELECT
            b.boundary_ky,
            b.boundary_nm,
            b.boundary_type_cd,
            b.geometry
        FROM geo.boundary b
        WHERE b.boundary_ky = p_boundary_ky
    ),
    queue_record AS
    (
        SELECT *
        FROM geo.v_boundary_review_queue q
        WHERE q.boundary_ky = p_boundary_ky
    ),
    ranked_candidates AS
    (
        SELECT *
        FROM geo.v_boundary_review_candidate c
        WHERE c.boundary_ky = p_boundary_ky
    ),
    contained_points AS
    (
        SELECT
            p.prprty_ky,
            p.zone_ds,
            p.area_ds,
            p.cmnty_ds,
            p.dvlpmnt_ds,
            p.lat_nb,
            p.long_nb
        FROM selected_boundary b
        JOIN dw.prprty p
          ON p.long_nb IS NOT NULL
         AND p.lat_nb IS NOT NULL
         AND b.geometry && ST_SetSRID(ST_MakePoint(p.long_nb, p.lat_nb), 4326)
         AND ST_Covers
         (
             b.geometry,
             ST_SetSRID(ST_MakePoint(p.long_nb, p.lat_nb), 4326)
         )
    )
    SELECT jsonb_build_object
    (
        'boundary',
        jsonb_build_object
        (
            'boundaryKy', b.boundary_ky,
            'boundaryName', b.boundary_nm,
            'boundaryType', b.boundary_type_cd,
            'geometry', ST_AsGeoJSON(b.geometry)::jsonb
        ),
        'review', TO_JSONB(q),
        'candidateRanks',
        COALESCE
        (
            (
                SELECT jsonb_agg(TO_JSONB(c) ORDER BY c.candidate_rank_nb)
                FROM ranked_candidates c
            ),
            '[]'::jsonb
        ),
        'propertyPoints',
        COALESCE
        (
            (
                SELECT jsonb_agg
                (
                    jsonb_build_object
                    (
                        'propertyKy', p.prprty_ky,
                        'zoneName', p.zone_ds,
                        'areaName', p.area_ds,
                        'communityName', p.cmnty_ds,
                        'developmentName', p.dvlpmnt_ds,
                        'latitude', p.lat_nb,
                        'longitude', p.long_nb
                    )
                    ORDER BY p.prprty_ky
                )
                FROM contained_points p
            ),
            '[]'::jsonb
        )
    )
    FROM selected_boundary b
    LEFT JOIN queue_record q
      ON q.boundary_ky = b.boundary_ky;
$$;

/* ============================================================
   8. Permissions
   ============================================================ */

REVOKE ALL
ON FUNCTION geo.approve_boundary_candidate(bigint, bigint, text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION geo.mark_boundary_non_community(bigint, text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION geo.get_boundary_review_detail(bigint)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION geo.approve_boundary_candidate(bigint, bigint, text)
TO authenticated;

GRANT EXECUTE
ON FUNCTION geo.mark_boundary_non_community(bigint, text)
TO authenticated;

GRANT EXECUTE
ON FUNCTION geo.get_boundary_review_detail(bigint)
TO authenticated;

GRANT SELECT
ON geo.v_boundary_review_queue
TO authenticated;

GRANT SELECT
ON geo.v_boundary_review_candidate
TO authenticated;

GRANT SELECT
ON geo.v_boundary_review_summary
TO authenticated;

COMMIT;