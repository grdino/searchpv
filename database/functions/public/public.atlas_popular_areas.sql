-- This is used to present the top 3 areas base on the last 6 months of sales (resale only)
-- based on area footprints.

create or replace function public.atlas_popular_areas(
    p_months integer default 6,
    p_limit integer default 3
)
returns table
(
    footprint_key text,
    display_name text,
    boundary_kys bigint[],
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
   CANONICAL MLS COMMUNITY NAMES
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
   BUILD EACH MLS COMMUNITY'S SAVED ATLAS FOOTPRINT

   Important:

   The footprint identity is the complete SORTED set of
   boundary keys, not the MLS entity itself.

   Examples:

   Amapas
       -> [470,471,472]

   Marina Vallarta
   Isla Iguana
   Plaza Iguana
   Puerto Iguana
       -> [349]

   Oceanside
   Canal
   Paradise Village
       -> [626]
   ============================================================ */

entity_footprints as
(
    select
        e.entity_ky,

        n.display_name as entity_name,

        array_agg(
            eb.boundary_ky
            order by eb.boundary_ky
        ) as boundary_kys,

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
   COLLAPSE MLS ENTITIES THAT SHARE THE SAME FOOTPRINT
   ============================================================ */

unique_footprints as
(
    select distinct on (
        ef.boundary_kys
    )
        ef.boundary_kys,

        array_to_string(
            ef.boundary_kys,
            ','
        ) as footprint_key,

        ef.geometry::geometry as geometry

    from entity_footprints ef

    order by
        ef.boundary_kys,
        ef.entity_ky
),

/* ============================================================
   FOOTPRINT NAME

   Naming rule:

   1 boundary:
       Use the government boundary name.

       This produces:
           626 -> Nuevo Nayarit
           349 -> Marina Vallarta

   Multiple boundaries:
       Prefer a canonical MLS community name associated with
       exactly that complete footprint.

       This produces:
           [470,471,472] -> Amapas
   ============================================================ */

footprint_names as
(
    select
        uf.footprint_key,
        uf.boundary_kys,
        uf.geometry,

        case

            /*
             * Single government boundary:
             * use the boundary's own geographic name.
             */
            when cardinality(
                uf.boundary_kys
            ) = 1
            then
                (
                    select
                        b.boundary_nm

                    from geo.boundary b

                    where
                        b.boundary_ky =
                        uf.boundary_kys[1]
                )

            /*
             * Multi-boundary footprint:
             * use a canonical community name attached to
             * this exact footprint.
             */
            else
                (
                    select
                        min(
                            ef.entity_name
                        )

                    from entity_footprints ef

                    where
                        ef.boundary_kys =
                        uf.boundary_kys
                )

        end as display_name

    from unique_footprints uf
),

/* ============================================================
   RECENT RESALE RESIDENTIAL SALES

   Popular Areas definition:

   - Condos + Houses
   - Resale only
   - All price ranges
   - Trailing p_months
   - Spatial location, not MLS community label
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

        /*
         * Residential only.
         */
        and p.prprty_type in (
            'Condos',
            'Houses'
        )

        /*
         * Resale only.
         *
         * Prevent one large pre-construction project from
         * disproportionately driving the homepage ranking.
         */
        and coalesce(
            cs.pre_cnstrctn_fl,
            false
        ) = false

        and p.long_nb is not null
        and p.lat_nb is not null

        /*
         * Rolling trailing period.
         */
        and to_date(
            cs.sold_date_ky::text,
            'YYYYMMDD'
        ) >
            d.as_of_date
            -
            make_interval(
                months =>
                    greatest(
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
   COUNT SALES INSIDE EACH UNIQUE ATLAS FOOTPRINT
   ============================================================ */

footprint_sales as
(
    select
        f.footprint_key,
        f.display_name,
        f.boundary_kys,

        count(
            r.clsd_sale_ky
        )::bigint as sales_count

    from footprint_names f

    left join recent_sales r
      on
        f.geometry &&
        r.point_geometry

        and ST_Covers(
            f.geometry,
            r.point_geometry
        )

    where
        f.geometry is not null

        and not ST_IsEmpty(
            f.geometry
        )

    group by
        f.footprint_key,
        f.display_name,
        f.boundary_kys
)

select
    fs.footprint_key,
    fs.display_name,
    fs.boundary_kys,
    fs.sales_count

from footprint_sales fs

where
    fs.sales_count > 0

order by
    fs.sales_count desc,
    fs.display_name

limit greatest(
    p_limit,
    1
);

$function$;