CREATE OR REPLACE FUNCTION public.atlas_custom_market_snapshot(
    p_boundary_kys bigint[],
    p_property_type text,
    p_market_type text,
    p_bedroom text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'geo', 'dw', 'rpt'
AS $function$

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
   COMBINE SELECTED GOVERNMENT POLYGONS
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
   CURRENT REPORTING DATE
   ============================================================ */

as_of as
(
    select
        max(a.snapshot_date)::date as as_of_date

    from public.active_listing a
),

/* ============================================================
   ACTIVE LISTINGS
   ============================================================ */

active_rows as
(
    select
        a.lstng_ky,
        a.prprty_ky,
        a.mls,
        a.current_price,
        a.price_per_sqft,
        a.price_per_sqm,
        a.dom

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

            or (
                p_property_type = 'condo'
                and a.prprty_type = 'Condos'
            )

            or (
                p_property_type = 'house'
                and a.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or (
                p_market_type = 'resale'
                and a.market_segment = 'resale'
            )

            or (
                p_market_type = 'precon'
                and a.market_segment = 'pre_construction'
            )
        )

        and
        (
            p_bedroom = 'all'
            or a.bedroom_segment = p_bedroom
        )
),

/* ============================================================
   PENDING LISTINGS
   ============================================================ */

pending_rows as
(
    select
        p.lstng_ky,
        p.prprty_ky,
        p.mls

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

            or (
                p_property_type = 'condo'
                and p.prprty_type = 'Condos'
            )

            or (
                p_property_type = 'house'
                and p.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or (
                p_market_type = 'resale'
                and p.market_segment = 'resale'
            )

            or (
                p_market_type = 'precon'
                and p.market_segment = 'pre_construction'
            )
        )

        and
        (
            p_bedroom = 'all'
            or p.bedroom_segment = p_bedroom
        )
),

/* ============================================================
   CLOSED SALES — TRAILING 12 MONTHS
   ============================================================ */

closed_rows as
(
    select
        cs.clsd_sale_ky,
        cs.lstng_ky,
        cs.prprty_ky,
        l.lstng_nb as mls,

        cs.sold_prc_am,
        cs.sold_prc_ft2_am,
        cs.dom_nb

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

            or (
                p_property_type = 'condo'
                and p.prprty_type = 'Condos'
            )

            or (
                p_property_type = 'house'
                and p.prprty_type = 'Houses'
            )
        )

        and
        (
            p_market_type = 'all'

            or (
                p_market_type = 'resale'
                and coalesce(
                    cs.pre_cnstrctn_fl,
                    false
                ) = false
            )

            or (
                p_market_type = 'precon'
                and cs.pre_cnstrctn_fl = true
            )
        )

        and
        (
            p_bedroom = 'all'

            or (
                p_bedroom = '0br'
                and l.bdrm_nb = 0
            )

            or (
                p_bedroom = '1br'
                and l.bdrm_nb = 1
            )

            or (
                p_bedroom = '2br'
                and l.bdrm_nb = 2
            )

            or (
                p_bedroom = '3br_plus'
                and l.bdrm_nb >= 3
            )
        )
),

/* ============================================================
   ACTIVE SUMMARY
   ============================================================ */

active_summary as
(
    select
        count(*)::bigint as active_count,

        coalesce(
            jsonb_agg(
                mls
                order by mls
            )
            filter (
                where mls is not null
            ),
            '[]'::jsonb
        ) as active_mls,

        avg(current_price)
        filter (
            where current_price > 0
        ) as avg_list_price,

        percentile_cont(0.5)
        within group (
            order by current_price
        )
        filter (
            where current_price > 0
        ) as median_list_price,

        avg(price_per_sqft)
        filter (
            where price_per_sqft > 0
        ) as avg_list_price_ft2,

        percentile_cont(0.5)
        within group (
            order by price_per_sqft
        )
        filter (
            where price_per_sqft > 0
        ) as median_list_price_ft2,

        avg(price_per_sqm)
        filter (
            where price_per_sqm > 0
        ) as avg_list_price_m2,

        percentile_cont(0.5)
        within group (
            order by price_per_sqm
        )
        filter (
            where price_per_sqm > 0
        ) as median_list_price_m2,

        round(
            avg(dom)
            filter (
                where dom between 0 and 5000
            )
        )::bigint as current_avg_dom

    from active_rows
),

/* ============================================================
   PENDING SUMMARY
   ============================================================ */

pending_summary as
(
    select
        count(*)::bigint as pending_count,

        coalesce(
            jsonb_agg(
                mls
                order by mls
            )
            filter (
                where mls is not null
            ),
            '[]'::jsonb
        ) as pending_mls

    from pending_rows
),

/* ============================================================
   CLOSED SUMMARY
   ============================================================ */

closed_summary as
(
    select
        count(*)::bigint as sales_12mo,

        coalesce(
            jsonb_agg(
                mls
                order by mls
            )
            filter (
                where mls is not null
            ),
            '[]'::jsonb
        ) as closed_mls,

        round(
            avg(sold_prc_am)
            filter (
                where sold_prc_am > 0
            )
        ) as avg_sold_price,

        percentile_cont(0.5)
        within group (
            order by sold_prc_am
        )
        filter (
            where sold_prc_am > 0
        ) as median_sold_price,

        round(
            avg(sold_prc_ft2_am)
            filter (
                where sold_prc_ft2_am > 0
            ),
            2
        ) as avg_sold_price_ft2,

        round(
            (
                percentile_cont(0.5)
                within group (
                    order by sold_prc_ft2_am
                )
                filter (
                    where sold_prc_ft2_am > 0
                )
            )::numeric,
            2
        ) as median_sold_price_ft2,

        round(
            avg(
                sold_prc_ft2_am * 10.7639
            )
            filter (
                where sold_prc_ft2_am > 0
            ),
            2
        ) as avg_sold_price_m2,

        round(
            (
                percentile_cont(0.5)
                within group (
                    order by
                        sold_prc_ft2_am * 10.7639
                )
                filter (
                    where sold_prc_ft2_am > 0
                )
            )::numeric,
            2
        ) as median_sold_price_m2,

        round(
            avg(dom_nb)
            filter (
                where dom_nb between 0 and 5000
            )
        )::bigint as sold_avg_dom_12mo

    from closed_rows
),

/* ============================================================
   RESPONSE
   ============================================================ */

final_values as
(
    select
        g.boundary_count,
        g.boundary_kys,

        d.as_of_date,

        a.active_count,
        a.active_mls,
        a.avg_list_price,
        a.median_list_price,
        a.avg_list_price_ft2,
        a.median_list_price_ft2,
        a.avg_list_price_m2,
        a.median_list_price_m2,
        a.current_avg_dom,

        p.pending_count,
        p.pending_mls,

        c.sales_12mo,
        c.closed_mls,
        c.avg_sold_price,
        c.median_sold_price,
        c.avg_sold_price_ft2,
        c.median_sold_price_ft2,
        c.avg_sold_price_m2,
        c.median_sold_price_m2,
        c.sold_avg_dom_12mo,

        case
            when c.sales_12mo > 0
            then
                round(
                    (
                        a.active_count::numeric
                        /
                        (c.sales_12mo::numeric / 12.0)
                    ),
                    1
                )
            else null
        end as months_inventory

    from custom_geometry g
    cross join as_of d
    cross join active_summary a
    cross join pending_summary p
    cross join closed_summary c
)

select jsonb_build_object(
    'boundaryCount',
        f.boundary_count,

    'boundaryKys',
        f.boundary_kys,

    'propertyType',
        p_property_type,

    'marketType',
        p_market_type,

    'bedroom',
        p_bedroom,

    'snapshotDate',
        f.as_of_date,

    'activeCount',
        f.active_count,

    'activeMls',
        f.active_mls,

    'pendingCount',
        f.pending_count,

    'pendingMls',
        f.pending_mls,

    'sales12Mo',
        f.sales_12mo,

    'closedMls',
        f.closed_mls,

    'avgListPrice',
        f.avg_list_price,

    'medianListPrice',
        f.median_list_price,

    'avgListPriceFt2',
        f.avg_list_price_ft2,

    'medianListPriceFt2',
        f.median_list_price_ft2,

    'avgListPriceM2',
        f.avg_list_price_m2,

    'medianListPriceM2',
        f.median_list_price_m2,

    'currentAvgDom',
        f.current_avg_dom,

    'avgSoldPrice',
        f.avg_sold_price,

    'medianSoldPrice',
        f.median_sold_price,

    'avgSoldPriceFt2',
        f.avg_sold_price_ft2,

    'medianSoldPriceFt2',
        f.median_sold_price_ft2,

    'avgSoldPriceM2',
        f.avg_sold_price_m2,

    'medianSoldPriceM2',
        f.median_sold_price_m2,

    'soldAvgDom12Mo',
        f.sold_avg_dom_12mo,

    'monthsInventory',
        f.months_inventory
)

from final_values f;

$function$;