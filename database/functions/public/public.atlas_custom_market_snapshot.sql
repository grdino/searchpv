create or replace function public.atlas_custom_market_snapshot(
    p_boundary_kys bigint[],
    p_property_type text default 'all',
    p_market_type text default 'all'
)
returns jsonb
language sql
stable
security definer
set search_path = public, geo, dw, rpt
as $function$

with selected_boundaries as
(
    select
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.municipality_nm,
        b.geometry

    from geo.boundary b

    where b.boundary_ky = any(p_boundary_kys)
),

/* ============================================================
   Combine selected government polygons into one market geometry.
   ============================================================ */

custom_geometry as
(
    select
        count(*)::bigint as boundary_count,

        array_agg(
            boundary_ky
            order by boundary_ky
        ) as boundary_kys,

        ST_UnaryUnion(
            ST_Collect(geometry)
        ) as geometry

    from selected_boundaries
),

/* ============================================================
   Determine the current reporting date.

   Active Listing is the authoritative current inventory source.
   ============================================================ */

as_of as
(
    select
        max(a.snapshot_date)::date as as_of_date

    from public.active_listing a
),

/* ============================================================
   ACTIVE LISTINGS

   Pricing metrics intentionally come from ACTIVE listings only.
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

    cross join custom_geometry g

    where
        g.geometry is not null

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

    cross join custom_geometry g

    where
        g.geometry is not null

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

    cross join custom_geometry g
    cross join as_of d

    where
        g.geometry is not null

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
)

select jsonb_build_object(
    'boundaryCount',
        g.boundary_count,

    'boundaryKys',
        g.boundary_kys,

    'propertyType',
        p_property_type,

    'marketType',
        p_market_type,

    'snapshotDate',
        d.as_of_date,

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

from custom_geometry g
cross join as_of d
cross join active_summary a
cross join pending_summary p
cross join closed_summary c;

$function$;