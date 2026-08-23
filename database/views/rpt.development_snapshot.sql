-- 2026-08-22 - New version adding med $/ft and $/M for the atals developement stats

create or replace view rpt.development_snapshot as

with latest_snap_date as
(
    select
        max(
            invntry_snap.invntry_snap_date_ky
        ) as invntry_snap_date_ky

    from dw.invntry_snap
),

snapshot_date as
(
    select
        c.clndr_ky as invntry_snap_date_ky,
        c.full_dt as snapshot_date

    from dw.clndr c

    join latest_snap_date d
      on c.clndr_ky =
         d.invntry_snap_date_ky
),

market_segments as
(
    select
        x.market_segment,
        x.pre_cnstrctn_fl

    from
    (
        values
            (
                'all'::text,
                null::boolean
            ),
            (
                'pre_construction'::text,
                true
            ),
            (
                'resale'::text,
                false
            )
    )
    x(
        market_segment,
        pre_cnstrctn_fl
    )
),

property_type_segments as
(
    select
        x.property_type_segment,
        x.prprty_type

    from
    (
        values
            (
                'all'::text,
                null::text
            ),
            (
                'condos'::text,
                'Condos'::text
            ),
            (
                'houses'::text,
                'Houses'::text
            )
    )
    x(
        property_type_segment,
        prprty_type
    )
),

property_counts as
(
    select
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds,

        count(*) as property_count,

        count(*) filter (
            where p.prprty_type = 'Condos'
        ) as condo_property_count,

        count(*) filter (
            where p.prprty_type = 'Houses'
        ) as house_property_count

    from dw.prprty p

    where
        p.zone_ds is not null
        and p.area_ds is not null
        and p.cmnty_ds is not null
        and p.dvlpmnt_ds is not null
        and trim(
            both from p.dvlpmnt_ds
        ) <> ''

    group by
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds
),

/* ============================================================
   CURRENT INVENTORY
   ============================================================ */

current_inventory as
(
    select
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds,

        sd.snapshot_date,

        ms.market_segment,

        pts.property_type_segment,

        count(*) filter (
            where lower(i.stts_cd) = 'a'
        ) as active_count,

        count(*) filter (
            where lower(i.stts_cd) = 'p'
        ) as pending_count,

        count(*) filter (
            where lower(i.stts_cd) = 'a'
              and l.bdrm_nb = 0
        ) as active_0br,

        count(*) filter (
            where lower(i.stts_cd) = 'a'
              and l.bdrm_nb = 1
        ) as active_1br,

        count(*) filter (
            where lower(i.stts_cd) = 'a'
              and l.bdrm_nb = 2
        ) as active_2br,

        count(*) filter (
            where lower(i.stts_cd) = 'a'
              and l.bdrm_nb >= 3
        ) as active_3br_plus,

        count(*) filter (
            where lower(i.stts_cd) = 'p'
              and l.bdrm_nb = 0
        ) as pending_0br,

        count(*) filter (
            where lower(i.stts_cd) = 'p'
              and l.bdrm_nb = 1
        ) as pending_1br,

        count(*) filter (
            where lower(i.stts_cd) = 'p'
              and l.bdrm_nb = 2
        ) as pending_2br,

        count(*) filter (
            where lower(i.stts_cd) = 'p'
              and l.bdrm_nb >= 3
        ) as pending_3br_plus,

        round(
            avg(
                i.snap_list_prc_am
            )
            filter (
                where lower(i.stts_cd) = 'a'
            )
        ) as avg_list_price,

        percentile_cont(0.5)
        within group (
            order by
                i.snap_list_prc_am::double precision
        )
        filter (
            where lower(i.stts_cd) = 'a'
        ) as median_list_price,

        /*
         * Active average $ / ft².
         *
         * Exclude zero / invalid values so Avg and Median
         * use the same valid population.
         */
        round(
            avg(
                i.prc_ft2_qt
            )
            filter (
                where lower(i.stts_cd) = 'a'
                  and i.prc_ft2_qt > 0
            )
        ) as avg_list_price_ft2,

        /*
         * NEW:
         * Active median $ / ft².
         */
        percentile_cont(0.5)
        within group (
            order by
                i.prc_ft2_qt::double precision
        )
        filter (
            where lower(i.stts_cd) = 'a'
              and i.prc_ft2_qt > 0
        ) as median_list_price_ft2,

        /*
         * Active average $ / m².
         */
        round(
            avg(
                i.prc_ft2_qt *
                10.7639
            )
            filter (
                where lower(i.stts_cd) = 'a'
                  and i.prc_ft2_qt > 0
            )
        ) as avg_list_price_m2,

        /*
         * NEW:
         * Active median $ / m².
         */
        percentile_cont(0.5)
        within group (
            order by
                (
                    i.prc_ft2_qt *
                    10.7639
                )::double precision
        )
        filter (
            where lower(i.stts_cd) = 'a'
              and i.prc_ft2_qt > 0
        ) as median_list_price_m2,

        round(
            avg(
                i.dom_qt
            )
            filter (
                where lower(i.stts_cd) = 'a'
                  and i.dom_qt >= 0
                  and i.dom_qt <= 5000
            )
        ) as current_avg_dom

    from dw.invntry_snap i

    join snapshot_date sd
      on i.invntry_snap_date_ky =
         sd.invntry_snap_date_ky

    join dw.prprty p
      on i.prprty_ky =
         p.prprty_ky

    join dw.lstng l
      on i.lstng_ky =
         l.lstng_ky

    join market_segments ms
      on
        ms.pre_cnstrctn_fl is null
        or coalesce(
            i.pre_cnstrctn_fl,
            false
        ) =
        ms.pre_cnstrctn_fl

    join property_type_segments pts
      on
        pts.prprty_type is null
        or p.prprty_type =
           pts.prprty_type

    where
        p.zone_ds is not null
        and p.area_ds is not null
        and p.cmnty_ds is not null
        and p.dvlpmnt_ds is not null
        and trim(
            both from p.dvlpmnt_ds
        ) <> ''

    group by
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds,
        sd.snapshot_date,
        ms.market_segment,
        pts.property_type_segment
),

/* ============================================================
   CLOSED SALES — TRAILING 12 MONTHS
   ============================================================ */

sales_12mo as
(
    select
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds,

        sd.snapshot_date,

        ms.market_segment,

        pts.property_type_segment,

        (
            sd.snapshot_date -
            interval '1 year'
        )::date as sales_period_start,

        sd.snapshot_date as sales_period_end,

        count(*) as sales_12mo,

        count(*) filter (
            where l.bdrm_nb = 0
        ) as sales_0br_12mo,

        count(*) filter (
            where l.bdrm_nb = 1
        ) as sales_1br_12mo,

        count(*) filter (
            where l.bdrm_nb = 2
        ) as sales_2br_12mo,

        count(*) filter (
            where l.bdrm_nb >= 3
        ) as sales_3br_plus_12mo,

        round(
            avg(
                cs.sold_prc_am
            )
        ) as avg_sold_price,

        round(
            avg(
                cs.sold_prc_am
            )
            filter (
                where l.bdrm_nb = 0
            )
        ) as avg_sold_price_0br,

        round(
            avg(
                cs.sold_prc_am
            )
            filter (
                where l.bdrm_nb = 1
            )
        ) as avg_sold_price_1br,

        round(
            avg(
                cs.sold_prc_am
            )
            filter (
                where l.bdrm_nb = 2
            )
        ) as avg_sold_price_2br,

        round(
            avg(
                cs.sold_prc_am
            )
            filter (
                where l.bdrm_nb >= 3
            )
        ) as avg_sold_price_3br_plus,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_am::double precision
        ) as median_sold_price,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_am::double precision
        )
        filter (
            where l.bdrm_nb = 0
        ) as median_sold_price_0br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_am::double precision
        )
        filter (
            where l.bdrm_nb = 1
        ) as median_sold_price_1br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_am::double precision
        )
        filter (
            where l.bdrm_nb = 2
        ) as median_sold_price_2br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_am::double precision
        )
        filter (
            where l.bdrm_nb >= 3
        ) as median_sold_price_3br_plus,

        round(
            avg(
                cs.sold_prc_ft2_am
            )
        ) as avg_sold_price_ft2,

        round(
            avg(
                cs.sold_prc_ft2_am
            )
            filter (
                where l.bdrm_nb = 0
            )
        ) as avg_sold_price_ft2_0br,

        round(
            avg(
                cs.sold_prc_ft2_am
            )
            filter (
                where l.bdrm_nb = 1
            )
        ) as avg_sold_price_ft2_1br,

        round(
            avg(
                cs.sold_prc_ft2_am
            )
            filter (
                where l.bdrm_nb = 2
            )
        ) as avg_sold_price_ft2_2br,

        round(
            avg(
                cs.sold_prc_ft2_am
            )
            filter (
                where l.bdrm_nb >= 3
            )
        ) as avg_sold_price_ft2_3br_plus,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_ft2_am::double precision
        ) as median_sold_price_ft2,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_ft2_am::double precision
        )
        filter (
            where l.bdrm_nb = 0
        ) as median_sold_price_ft2_0br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_ft2_am::double precision
        )
        filter (
            where l.bdrm_nb = 1
        ) as median_sold_price_ft2_1br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_ft2_am::double precision
        )
        filter (
            where l.bdrm_nb = 2
        ) as median_sold_price_ft2_2br,

        percentile_cont(0.5)
        within group (
            order by
                cs.sold_prc_ft2_am::double precision
        )
        filter (
            where l.bdrm_nb >= 3
        ) as median_sold_price_ft2_3br_plus,

        round(
            avg(
                cs.sold_prc_ft2_am *
                10.7639
            )
        ) as avg_sold_price_m2,

        round(
            avg(
                cs.sold_prc_ft2_am *
                10.7639
            )
            filter (
                where l.bdrm_nb = 0
            )
        ) as avg_sold_price_m2_0br,

        round(
            avg(
                cs.sold_prc_ft2_am *
                10.7639
            )
            filter (
                where l.bdrm_nb = 1
            )
        ) as avg_sold_price_m2_1br,

        round(
            avg(
                cs.sold_prc_ft2_am *
                10.7639
            )
            filter (
                where l.bdrm_nb = 2
            )
        ) as avg_sold_price_m2_2br,

        round(
            avg(
                cs.sold_prc_ft2_am *
                10.7639
            )
            filter (
                where l.bdrm_nb >= 3
            )
        ) as avg_sold_price_m2_3br_plus,

        percentile_cont(0.5)
        within group (
            order by
                (
                    cs.sold_prc_ft2_am *
                    10.7639
                )::double precision
        ) as median_sold_price_m2,

        percentile_cont(0.5)
        within group (
            order by
                (
                    cs.sold_prc_ft2_am *
                    10.7639
                )::double precision
        )
        filter (
            where l.bdrm_nb = 0
        ) as median_sold_price_m2_0br,

        percentile_cont(0.5)
        within group (
            order by
                (
                    cs.sold_prc_ft2_am *
                    10.7639
                )::double precision
        )
        filter (
            where l.bdrm_nb = 1
        ) as median_sold_price_m2_1br,

        percentile_cont(0.5)
        within group (
            order by
                (
                    cs.sold_prc_ft2_am *
                    10.7639
                )::double precision
        )
        filter (
            where l.bdrm_nb = 2
        ) as median_sold_price_m2_2br,

        percentile_cont(0.5)
        within group (
            order by
                (
                    cs.sold_prc_ft2_am *
                    10.7639
                )::double precision
        )
        filter (
            where l.bdrm_nb >= 3
        ) as median_sold_price_m2_3br_plus,

        round(
            avg(
                cs.dom_nb
            )
            filter (
                where cs.dom_nb >= 0
                  and cs.dom_nb <= 5000
            )
        ) as sold_avg_dom_12mo

    from snapshot_date sd

    join dw.clsd_sale cs
      on true

    join dw.prprty p
      on cs.prprty_ky =
         p.prprty_ky

    join dw.lstng l
      on cs.lstng_ky =
         l.lstng_ky

    join dw.clndr c
      on cs.sold_date_ky =
         c.clndr_ky

    join market_segments ms
      on
        ms.pre_cnstrctn_fl is null
        or coalesce(
            cs.pre_cnstrctn_fl,
            false
        ) =
        ms.pre_cnstrctn_fl

    join property_type_segments pts
      on
        pts.prprty_type is null
        or p.prprty_type =
           pts.prprty_type

    where
        c.full_dt >=
            (
                sd.snapshot_date -
                interval '1 year'
            )

        and c.full_dt <=
            sd.snapshot_date

        and p.zone_ds is not null
        and p.area_ds is not null
        and p.cmnty_ds is not null
        and p.dvlpmnt_ds is not null

        and trim(
            both from p.dvlpmnt_ds
        ) <> ''

    group by
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,
        p.dvlpmnt_ds,
        sd.snapshot_date,
        ms.market_segment,
        pts.property_type_segment
)

/* ============================================================
   FINAL DEVELOPMENT SNAPSHOT
   ============================================================ */

select
    coalesce(
        ci.zone_ds,
        s.zone_ds
    ) as zone_name,

    coalesce(
        ci.area_ds,
        s.area_ds
    ) as area_name,

    coalesce(
        ci.cmnty_ds,
        s.cmnty_ds
    ) as community_name,

    coalesce(
        ci.dvlpmnt_ds,
        s.dvlpmnt_ds
    ) as development_name,

    coalesce(
        ci.snapshot_date,
        s.snapshot_date
    ) as snapshot_date,

    coalesce(
        ci.market_segment,
        s.market_segment
    ) as market_segment,

    coalesce(
        ci.property_type_segment,
        s.property_type_segment
    ) as property_type_segment,

    coalesce(
        s.sales_period_start,
        (
            coalesce(
                ci.snapshot_date,
                s.snapshot_date
            ) -
            interval '1 year'
        )::date
    ) as sales_period_start,

    coalesce(
        s.sales_period_end,
        coalesce(
            ci.snapshot_date,
            s.snapshot_date
        )
    ) as sales_period_end,

    coalesce(
        pc.property_count,
        0
    ) as property_count,

    coalesce(
        pc.condo_property_count,
        0
    ) as condo_property_count,

    coalesce(
        pc.house_property_count,
        0
    ) as house_property_count,

    coalesce(
        ci.active_count,
        0
    ) as active_count,

    coalesce(
        ci.pending_count,
        0
    ) as pending_count,

    coalesce(
        ci.active_0br,
        0
    ) as active_0br,

    coalesce(
        ci.active_1br,
        0
    ) as active_1br,

    coalesce(
        ci.active_2br,
        0
    ) as active_2br,

    coalesce(
        ci.active_3br_plus,
        0
    ) as active_3br_plus,

    coalesce(
        ci.pending_0br,
        0
    ) as pending_0br,

    coalesce(
        ci.pending_1br,
        0
    ) as pending_1br,

    coalesce(
        ci.pending_2br,
        0
    ) as pending_2br,

    coalesce(
        ci.pending_3br_plus,
        0
    ) as pending_3br_plus,

    ci.avg_list_price,

    ci.median_list_price,

    ci.avg_list_price_ft2,

    ci.avg_list_price_m2,

    ci.current_avg_dom,

    coalesce(
        s.sales_12mo,
        0
    ) as sales_12mo,

    coalesce(
        s.sales_0br_12mo,
        0
    ) as sales_0br_12mo,

    coalesce(
        s.sales_1br_12mo,
        0
    ) as sales_1br_12mo,

    coalesce(
        s.sales_2br_12mo,
        0
    ) as sales_2br_12mo,

    coalesce(
        s.sales_3br_plus_12mo,
        0
    ) as sales_3br_plus_12mo,

    s.avg_sold_price,

    s.avg_sold_price_0br,
    s.avg_sold_price_1br,
    s.avg_sold_price_2br,
    s.avg_sold_price_3br_plus,

    s.median_sold_price,

    s.median_sold_price_0br,
    s.median_sold_price_1br,
    s.median_sold_price_2br,
    s.median_sold_price_3br_plus,

    s.avg_sold_price_ft2,

    s.avg_sold_price_ft2_0br,
    s.avg_sold_price_ft2_1br,
    s.avg_sold_price_ft2_2br,
    s.avg_sold_price_ft2_3br_plus,

    s.median_sold_price_ft2,

    s.median_sold_price_ft2_0br,
    s.median_sold_price_ft2_1br,
    s.median_sold_price_ft2_2br,
    s.median_sold_price_ft2_3br_plus,

    s.avg_sold_price_m2,

    s.avg_sold_price_m2_0br,
    s.avg_sold_price_m2_1br,
    s.avg_sold_price_m2_2br,
    s.avg_sold_price_m2_3br_plus,

    s.median_sold_price_m2,

    s.median_sold_price_m2_0br,
    s.median_sold_price_m2_1br,
    s.median_sold_price_m2_2br,
    s.median_sold_price_m2_3br_plus,

    s.sold_avg_dom_12mo,

    case
        when coalesce(
            s.sales_12mo,
            0
        ) = 0
        then null::numeric

        else round(
            coalesce(
                ci.active_count,
                0
            )::numeric
            /
            (
                s.sales_12mo::numeric /
                12::numeric
            ),
            1
        )
    end as months_inventory,

    case
        when coalesce(
            s.sales_0br_12mo,
            0
        ) = 0
        then null::numeric

        else round(
            coalesce(
                ci.active_0br,
                0
            )::numeric
            /
            (
                s.sales_0br_12mo::numeric /
                12::numeric
            ),
            1
        )
    end as months_inventory_0br,

    case
        when coalesce(
            s.sales_1br_12mo,
            0
        ) = 0
        then null::numeric

        else round(
            coalesce(
                ci.active_1br,
                0
            )::numeric
            /
            (
                s.sales_1br_12mo::numeric /
                12::numeric
            ),
            1
        )
    end as months_inventory_1br,

    case
        when coalesce(
            s.sales_2br_12mo,
            0
        ) = 0
        then null::numeric

        else round(
            coalesce(
                ci.active_2br,
                0
            )::numeric
            /
            (
                s.sales_2br_12mo::numeric /
                12::numeric
            ),
            1
        )
    end as months_inventory_2br,

    case
        when coalesce(
            s.sales_3br_plus_12mo,
            0
        ) = 0
        then null::numeric

        else round(
            coalesce(
                ci.active_3br_plus,
                0
            )::numeric
            /
            (
                s.sales_3br_plus_12mo::numeric /
                12::numeric
            ),
            1
        )
    end as months_inventory_3br_plus,

    lower(
        regexp_replace(
            regexp_replace(
                translate(
                    coalesce(
                        ci.zone_ds,
                        s.zone_ds
                    ),
                    'áéíóúÁÉÍÓÚñÑ',
                    'aeiouAEIOUnN'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            ),
            '(^-|-$)',
            '',
            'g'
        )
    ) as zone_slug,

    lower(
        regexp_replace(
            regexp_replace(
                translate(
                    coalesce(
                        ci.area_ds,
                        s.area_ds
                    ),
                    'áéíóúÁÉÍÓÚñÑ',
                    'aeiouAEIOUnN'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            ),
            '(^-|-$)',
            '',
            'g'
        )
    ) as area_slug,

    lower(
        regexp_replace(
            regexp_replace(
                translate(
                    coalesce(
                        ci.cmnty_ds,
                        s.cmnty_ds
                    ),
                    'áéíóúÁÉÍÓÚñÑ',
                    'aeiouAEIOUnN'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            ),
            '(^-|-$)',
            '',
            'g'
        )
    ) as community_slug,

    lower(
        regexp_replace(
            regexp_replace(
                translate(
                    coalesce(
                        ci.dvlpmnt_ds,
                        s.dvlpmnt_ds
                    ),
                    'áéíóúÁÉÍÓÚñÑ',
                    'aeiouAEIOUnN'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            ),
            '(^-|-$)',
            '',
            'g'
        )
    ) as development_slug,

    /*
     * ========================================================
     * NEW COLUMNS
     *
     * Appended instead of inserted into the existing output
     * order to preserve dependent objects safely.
     * ========================================================
     */

    ci.median_list_price_ft2,

    ci.median_list_price_m2

from current_inventory ci

full join sales_12mo s
  on ci.zone_ds =
     s.zone_ds

 and ci.area_ds =
     s.area_ds

 and ci.cmnty_ds =
     s.cmnty_ds

 and ci.dvlpmnt_ds =
     s.dvlpmnt_ds

 and ci.market_segment =
     s.market_segment

 and ci.property_type_segment =
     s.property_type_segment

left join property_counts pc
  on pc.zone_ds =
     coalesce(
         ci.zone_ds,
         s.zone_ds
     )

 and pc.area_ds =
     coalesce(
         ci.area_ds,
         s.area_ds
     )

 and pc.cmnty_ds =
     coalesce(
         ci.cmnty_ds,
         s.cmnty_ds
     )

 and pc.dvlpmnt_ds =
     coalesce(
         ci.dvlpmnt_ds,
         s.dvlpmnt_ds
     )

where
    coalesce(
        ci.active_count,
        0
    ) > 0

    or coalesce(
        ci.pending_count,
        0
    ) > 0

    or coalesce(
        s.sales_12mo,
        0
    ) > 0
;


/* ============================================================
   PUBLIC DEVELOPMENT SNAPSHOT

   Preserve every existing public column in its current order.
   Append the two new fields at the end.
   ============================================================ */

create or replace view public.development_snapshot as

select
    zone_name,
    area_name,
    community_name,
    development_name,
    snapshot_date,
    market_segment,
    property_type_segment,
    sales_period_start,
    sales_period_end,
    property_count,
    condo_property_count,
    house_property_count,
    active_count,
    pending_count,
    active_0br,
    active_1br,
    active_2br,
    active_3br_plus,
    pending_0br,
    pending_1br,
    pending_2br,
    pending_3br_plus,
    avg_list_price,
    median_list_price,
    avg_list_price_ft2,
    avg_list_price_m2,
    current_avg_dom,
    sales_12mo,
    sales_0br_12mo,
    sales_1br_12mo,
    sales_2br_12mo,
    sales_3br_plus_12mo,
    avg_sold_price,
    avg_sold_price_0br,
    avg_sold_price_1br,
    avg_sold_price_2br,
    avg_sold_price_3br_plus,
    median_sold_price,
    median_sold_price_0br,
    median_sold_price_1br,
    median_sold_price_2br,
    median_sold_price_3br_plus,
    avg_sold_price_ft2,
    avg_sold_price_ft2_0br,
    avg_sold_price_ft2_1br,
    avg_sold_price_ft2_2br,
    avg_sold_price_ft2_3br_plus,
    median_sold_price_ft2,
    median_sold_price_ft2_0br,
    median_sold_price_ft2_1br,
    median_sold_price_ft2_2br,
    median_sold_price_ft2_3br_plus,
    avg_sold_price_m2,
    avg_sold_price_m2_0br,
    avg_sold_price_m2_1br,
    avg_sold_price_m2_2br,
    avg_sold_price_m2_3br_plus,
    median_sold_price_m2,
    median_sold_price_m2_0br,
    median_sold_price_m2_1br,
    median_sold_price_m2_2br,
    median_sold_price_m2_3br_plus,
    sold_avg_dom_12mo,
    months_inventory,
    months_inventory_0br,
    months_inventory_1br,
    months_inventory_2br,
    months_inventory_3br_plus,
    zone_slug,
    area_slug,
    community_slug,
    development_slug,

    /*
     * New appended fields.
     */
    median_list_price_ft2,
    median_list_price_m2

from rpt.development_snapshot
;