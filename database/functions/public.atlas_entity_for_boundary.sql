CREATE OR REPLACE FUNCTION public.atlas_entity_for_boundary
(
    p_boundary_ky bigint
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, geo
AS
$$

WITH matched_entity AS
(
    SELECT DISTINCT
        e.entity_ky,
        e.entity_type_cd,

        ev.entity_variant_nm AS entity_nm,

        parent_ev.entity_variant_nm AS parent_nm

    FROM geo.entity_boundary eb

    JOIN geo.entity e
      ON e.entity_ky = eb.entity_ky
     AND e.entity_type_cd = 'CM'

    LEFT JOIN geo.entity_variant ev
      ON ev.entity_ky = e.entity_ky
     AND ev.variant_type_cd = 'CA'

    LEFT JOIN geo.entity_relationship rel
      ON rel.child_entity_ky = e.entity_ky
     AND rel.relationship_type_cd = 'CB'

    LEFT JOIN geo.entity parent
      ON parent.entity_ky = rel.parent_entity_ky

    LEFT JOIN geo.entity_variant parent_ev
      ON parent_ev.entity_ky = parent.entity_ky
     AND parent_ev.variant_type_cd = 'CA'

    WHERE eb.boundary_ky = p_boundary_ky
)

SELECT
    CASE
        WHEN COUNT(*) = 0 THEN NULL

        ELSE jsonb_agg
        (
            jsonb_build_object
            (
                'entityKy', entity_ky,
                'entityType', entity_type_cd,
                'canonicalName', entity_nm,
                'displayName', entity_nm,
                'parentName', parent_nm
            )
            ORDER BY entity_nm
        )
    END

FROM matched_entity;
$$;


REVOKE ALL
ON FUNCTION public.atlas_entity_for_boundary(bigint)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.atlas_entity_for_boundary(bigint)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.atlas_entity_for_boundary(bigint)
TO anon;