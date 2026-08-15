CREATE OR REPLACE FUNCTION public.geography_entity_geometry
(
    p_entity_ky bigint
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, geo
AS
$$

WITH selected_entity AS
(
    /* =========================================================
       Entity being requested
       ========================================================= */

    SELECT
        e.entity_ky,
        e.entity_type_cd,
        e.entity_identifier_cd,

        ev.entity_variant_nm AS entity_nm

    FROM geo.entity e

    LEFT JOIN geo.entity_variant ev
      ON ev.entity_ky = e.entity_ky
     AND ev.variant_type_cd = 'CA'

    WHERE e.entity_ky = p_entity_ky
),

community_entities AS
(
    /* =========================================================
       Determine which Community entities contribute geometry.

       CM:
           itself

       AR:
           immediate CM children

       ZN:
           CM grandchildren through AR
       ========================================================= */

    /* ---------------------------------------------------------
       Community requested directly
       --------------------------------------------------------- */

    SELECT
        se.entity_ky AS requested_entity_ky,
        se.entity_ky AS community_entity_ky

    FROM selected_entity se

    WHERE se.entity_type_cd = 'CM'


    UNION


    /* ---------------------------------------------------------
       Area -> Communities
       --------------------------------------------------------- */

    SELECT
        se.entity_ky AS requested_entity_ky,
        cm.entity_ky AS community_entity_ky

    FROM selected_entity se

    JOIN geo.entity_relationship rel
      ON rel.parent_entity_ky = se.entity_ky
     AND rel.relationship_type_cd = 'CB'

    JOIN geo.entity cm
      ON cm.entity_ky = rel.child_entity_ky
     AND cm.entity_type_cd = 'CM'

    WHERE se.entity_type_cd = 'AR'


    UNION


    /* ---------------------------------------------------------
       Zone -> Areas -> Communities
       --------------------------------------------------------- */

    SELECT
        se.entity_ky AS requested_entity_ky,
        cm.entity_ky AS community_entity_ky

    FROM selected_entity se

    JOIN geo.entity_relationship zone_area_rel
      ON zone_area_rel.parent_entity_ky = se.entity_ky
     AND zone_area_rel.relationship_type_cd = 'CB'

    JOIN geo.entity ar
      ON ar.entity_ky = zone_area_rel.child_entity_ky
     AND ar.entity_type_cd = 'AR'

    JOIN geo.entity_relationship area_cm_rel
      ON area_cm_rel.parent_entity_ky = ar.entity_ky
     AND area_cm_rel.relationship_type_cd = 'CB'

    JOIN geo.entity cm
      ON cm.entity_ky = area_cm_rel.child_entity_ky
     AND cm.entity_type_cd = 'CM'

    WHERE se.entity_type_cd = 'ZN'
),

selected_boundaries AS
(
    /* =========================================================
       Pull the manually reviewed government polygons belonging
       to those Community entities.
       ========================================================= */

    SELECT DISTINCT
        ce.community_entity_ky,

        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.geometry

    FROM community_entities ce

    JOIN geo.entity_boundary eb
      ON eb.entity_ky = ce.community_entity_ky

    JOIN geo.boundary b
      ON b.boundary_ky = eb.boundary_ky
),

combined_geometry AS
(
    /* =========================================================
       Combine the selected government polygons into one geometry.

       ST_UnaryUnion removes internal edges where polygons touch.
       ========================================================= */

    SELECT
        ST_UnaryUnion
        (
            ST_Collect(sb.geometry)
        ) AS geometry

    FROM selected_boundaries sb
)

SELECT
    jsonb_build_object
    (
        'entityKy',
        se.entity_ky,

        'entityName',
        se.entity_nm,

        'entityType',
        se.entity_type_cd,

        'communityCount',
        (
            SELECT COUNT(DISTINCT community_entity_ky)
            FROM community_entities
        ),

        'boundaryCount',
        (
            SELECT COUNT(DISTINCT boundary_ky)
            FROM selected_boundaries
        ),

        'geometry',
        CASE
            WHEN cg.geometry IS NULL
                THEN NULL

            ELSE ST_AsGeoJSON(cg.geometry)::jsonb
        END,

        'bbox',
        CASE
            WHEN cg.geometry IS NULL
                THEN NULL

            ELSE jsonb_build_array
            (
                ST_XMin(ST_Envelope(cg.geometry)),
                ST_YMin(ST_Envelope(cg.geometry)),
                ST_XMax(ST_Envelope(cg.geometry)),
                ST_YMax(ST_Envelope(cg.geometry))
            )
        END
    )

FROM selected_entity se

CROSS JOIN combined_geometry cg;
$$;


REVOKE ALL
ON FUNCTION public.geography_entity_geometry(bigint)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.geography_entity_geometry(bigint)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.geography_entity_geometry(bigint)
TO anon;