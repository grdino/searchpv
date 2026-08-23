-- To display the three most sold communities in the past 6 months as 
-- buttons on the atlas into screen
-- NOTE - Ended up not using this, but using public.atlas_popular_areas instead based
-- on footprints instead of mls names.

create or replace function public.atlas_popular_communities(
    p_months integer default 6,
    p_limit integer default 3
)
returns table
(
    entity_ky bigint,
    display_name text,
    sales_count bigint
)
language sql
stable
security definer
set search_path = public, geo, dw, rpt
as $function$

with

/* ============================================================
   CURRENT ATLAS REPORTING DATE
   ============================================================ */

as_of as
(
    select
        max(a.snapshot_date)::date as as_of_date

    from public.active_listing a
),

/* ============================================================
   CANONICAL COMMUNITY NAMES

   Prefer the English canonical name.

   CA = Canonical
   ============================================================ */

community_names as
(
    select distinct on (
        ev.entity_ky
    )
        ev.entity_ky,
        ev.entity_variant_nm as display_name

    from geo.entity_variant ev

    where
        ev.variant_type_cd = 'CA'

    order by
        ev.entity_ky,

        case
            when lower(ev.language_cd) = 'en'
                then 0
            else 1
        end,

        ev.entity_variant_ky
),

/* ============================================================
   MLS COMMUNITIES WITH SAVED ATLAS FOOTPRINTS

   Union each entity's selected government boundaries into one
   geometry.

   This ensures the ranking uses the same geographic definition
   displayed by Atlas.
   ============================================================ */

community_geometry as
(
    select
        e.entity_ky,

        n.display_name,

        ST_UnaryUnion(
            ST_Collect(
                b.geometry
            )
        ) as geometry

    from geo.entity e

    join geo.entity_boundary eb
      on eb.entity_ky =
         e.entity_ky

    join geo.boundary b
      on b.boundary_ky =
         eb.boundary_ky

    left join community_names n
      on n.entity_ky =
         e.entity_ky

    where
        e.entity_type_cd = 'CM'

    group by
        e.entity_ky,
        n.display_name
),

/* ============================================================
   RECENT CLOSED RESIDENTIAL SALES

   Condos + Houses only.

   All market types are intentionally included.

   The trailing window is based on the same current reporting
   date used elsewhere in Atlas.
   ============================================================ */

recent_sales as
(
    select
        cs.clsd_sale_ky,

        ST_SetSRID(
            ST_MakePoint(
                p.long_nb::double precision,
                p.lat_nb::double precision
            ),
            4326
        ) as point_geometry

    from dw.clsd_sale cs

    join dw.prprty p
      on p.prprty_ky =
         cs.prprty_ky

    cross join as_of d

    where
        d.as_of_date is not null

        and p.prprty_type in (
            'Condos',
            'Houses'
        )

        and p.long_nb is not null
        and p.lat_nb is not null

        and to_date(
            cs.sold_date_ky::text,
            'YYYYMMDD'
        ) >
            d.as_of_date
            -
            make_interval(
                months => greatest(
                    p_months,
                    1
                )
            )

        and to_date(
            cs.sold_date_ky::text,
            'YYYYMMDD'
        ) <=
            d.as_of_date
),

/* ============================================================
   COUNT SALES INSIDE EACH COMMUNITY FOOTPRINT
   ============================================================ */

community_sales as
(
    select
        c.entity_ky,

        coalesce(
            c.display_name,
            e.entity_identifier_cd
        ) as display_name,

        count(
            r.clsd_sale_ky
        )::bigint as sales_count

    from community_geometry c

    join geo.entity e
      on e.entity_ky =
         c.entity_ky

    left join recent_sales r
      on
        c.geometry &&
        r.point_geometry

        and ST_Covers(
            c.geometry,
            r.point_geometry
        )

    where
        c.geometry is not null
        and not ST_IsEmpty(
            c.geometry
        )

    group by
        c.entity_ky,
        c.display_name,
        e.entity_identifier_cd
)

select
    cs.entity_ky,
    cs.display_name,
    cs.sales_count

from community_sales cs

where
    cs.sales_count > 0

order by
    cs.sales_count desc,
    cs.display_name

limit greatest(
    p_limit,
    1
);

$function$;