create or replace function public.atlas_drawn_market_snapshot(
    p_geometry jsonb,
    p_property_type text default 'all',
    p_market_type text default 'all'
)
returns jsonb
language sql
stable
security definer
set search_path = public, geo, dw, rpt
as $function$

with input_geometry as
(
    select
        ST_MakeValid(
            ST_SetSRID(
                ST_GeomFromGeoJSON(
                    p_geometry::text
                ),
                4326
            )
        ) as geometry
),

/* ============================================================
   Normalize to polygonal geometry.

   ST_MakeValid can theoretically return a GeometryCollection.
   Extract polygon components so downstream ST_Covers remains
   predictable.
   ============================================================ */

selected_geometry as
(
    select
        ST_Multi(
            ST_CollectionExtract(
                geometry,
                3
            )
        ) as geometry

    from input_geometry
),

/* ============================================================
   Determine the current reporting date.

   Active Listing remains our authoritative current inventory
   source, consistent with the existing Atlas snapshot functions.
   ============================================================ */

as_of as
(
    select
        max(a.snapshot_date)::date as as_of_date

    from public.active_listing a
),

/* ============================================================
   ACTIVE LISTINGS

   Pricing metrics intentionally use ACTIVE listings only.
   ============================================================ */

active_rows as
(
    select
        a.lstng_ky,
        a.prprty_ky,
        a.current_price,
        a.price_per_sqft,
        a.price_per_sqm

    from public.active_listing a

    cross join selected_geometry g

    where
        g.geometry is not null
        and not ST_IsEmpty(g.geometry)

        and a.long_nb is not null
        and a.lat_nb is not null

        and ST_Covers(
            g.geometry,
            ST_SetSRID(
                ST_MakePoint(
                    a.long_nb::double precision,
                    a.lat_nb::double precision
                ),
                4326
            )
        )

        and
        (
            p_property_type = 'all'

            or
            (
                p_property_type = 'condo'
                and a.prprty_type = 'Condos'
            )

            or
            (
                p_property_type = 'house'
                and a.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or
            (
                p_market_type = 'resale'
                and a.market_segment = 'resale'
            )

            or
            (
                p_market_type = 'precon'
                and a.market_segment = 'pre_construction'
            )
        )
),

/* ============================================================
   PENDING LISTINGS
   ============================================================ */

pending_rows as
(
    select
        p.lstng_ky,
        p.prprty_ky

    from public.pending_listing p

    cross join selected_geometry g

    where
        g.geometry is not null
        and not ST_IsEmpty(g.geometry)

        and p.long_nb is not null
        and p.lat_nb is not null

        and ST_Covers(
            g.geometry,
            ST_SetSRID(
                ST_MakePoint(
                    p.long_nb::double precision,
                    p.lat_nb::double precision
                ),
                4326
            )
        )

        and
        (
            p_property_type = 'all'

            or
            (
                p_property_type = 'condo'
                and p.prprty_type = 'Condos'
            )

            or
            (
                p_property_type = 'house'
                and p.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or
            (
                p_market_type = 'resale'
                and p.market_segment = 'resale'
            )

            or
            (
                p_market_type = 'precon'
                and p.market_segment = 'pre_construction'
            )
        )
),

/* ============================================================
   CLOSED SALES — trailing 12 months

   Coordinates come from dw.prprty, matching the existing
   government-boundary snapshot logic.
   ============================================================ */

closed_rows as
(
    select
        cs.clsd_sale_ky,
        cs.lstng_ky,
        cs.prprty_ky

    from dw.clsd_sale cs

    join dw.lstng l
      on l.lstng_ky = cs.lstng_ky

    join dw.prprty p
      on p.prprty_ky = cs.prprty_ky

    cross join selected_geometry g
    cross join as_of d

    where
        g.geometry is not null
        and not ST_IsEmpty(g.geometry)

        and d.as_of_date is not null

        and to_date(
            cs.sold_date_ky::text,
            'YYYYMMDD'
        ) > d.as_of_date - interval '1 year'

        and to_date(
            cs.sold_date_ky::text,
            'YYYYMMDD'
        ) <= d.as_of_date

        and p.long_nb is not null
        and p.lat_nb is not null

        and ST_Covers(
            g.geometry,
            ST_SetSRID(
                ST_MakePoint(
                    p.long_nb::double precision,
                    p.lat_nb::double precision
                ),
                4326
            )
        )

        and
        (
            p_property_type = 'all'

            or
            (
                p_property_type = 'condo'
                and p.prprty_type = 'Condos'
            )

            or
            (
                p_property_type = 'house'
                and p.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or
            (
                p_market_type = 'resale'
                and coalesce(
                    cs.pre_cnstrctn_fl,
                    false
                ) = false
            )

            or
            (
                p_market_type = 'precon'
                and cs.pre_cnstrctn_fl = true
            )
        )
),

/* ============================================================
   SUMMARIES
   ============================================================ */

active_summary as
(
    select
        count(*)::bigint as active_count,

        avg(
            current_price
        ) filter (
            where current_price > 0
        ) as avg_list_price,

        percentile_cont(0.5)
        within group (
            order by current_price
        ) filter (
            where current_price > 0
        ) as median_list_price,

        avg(
            price_per_sqft
        ) filter (
            where price_per_sqft > 0
        ) as avg_list_price_ft2,

        percentile_cont(0.5)
        within group (
            order by price_per_sqft
        ) filter (
            where price_per_sqft > 0
        ) as median_list_price_ft2,

        avg(
            price_per_sqm
        ) filter (
            where price_per_sqm > 0
        ) as avg_list_price_m2,

        percentile_cont(0.5)
        within group (
            order by price_per_sqm
        ) filter (
            where price_per_sqm > 0
        ) as median_list_price_m2

    from active_rows
),

pending_summary as
(
    select
        count(*)::bigint as pending_count

    from pending_rows
),

closed_summary as
(
    select
        count(*)::bigint as sales_12mo

    from closed_rows
),

geometry_summary as
(
    select
        ST_Area(
            geometry::geography
        ) as area_m2

    from selected_geometry
)

select jsonb_build_object(
    'geometryType',
        'drawn',

    'propertyType',
        p_property_type,

    'marketType',
        p_market_type,

    'snapshotDate',
        d.as_of_date,

    'areaM2',
        g.area_m2,

    'activeCount',
        a.active_count,

    'pendingCount',
        p.pending_count,

    'sales12Mo',
        c.sales_12mo,

    'avgListPrice',
        a.avg_list_price,

    'medianListPrice',
        a.median_list_price,

    'avgListPriceFt2',
        a.avg_list_price_ft2,

    'medianListPriceFt2',
        a.median_list_price_ft2,

    'avgListPriceM2',
        a.avg_list_price_m2,

    'medianListPriceM2',
        a.median_list_price_m2
)

from as_of d
cross join active_summary a
cross join pending_summary p
cross join closed_summary c
cross join geometry_summary g;

$function$;