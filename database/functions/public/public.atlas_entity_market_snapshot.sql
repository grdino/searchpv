-- used to make atlas calc what is inside boundaries, not how defined in mls

create or replace function public.atlas_entity_market_snapshot(
    p_entity_ky bigint,
    p_property_type text default 'all',
    p_market_type text default 'all'
)
returns jsonb
language sql
stable
security definer
set search_path = public, geo, dw, rpt
as $function$

with entity_boundaries as
(
    select
        array_agg(
            eb.boundary_ky
            order by eb.boundary_ky
        ) as boundary_kys

    from geo.entity_boundary eb

    where eb.entity_ky = p_entity_ky
),

snapshot as
(
    select
        public.atlas_custom_market_snapshot(
            eb.boundary_kys,
            p_property_type,
            p_market_type
        ) as snapshot

    from entity_boundaries eb

    where
        eb.boundary_kys is not null
        and cardinality(
            eb.boundary_kys
        ) > 0
)

select
    case
        when s.snapshot is null then null

        else
            s.snapshot
            ||
            jsonb_build_object(
                'entityKy',
                    p_entity_ky,

                'sourceType',
                    'entity_footprint'
            )
    end

from snapshot s;

$function$;