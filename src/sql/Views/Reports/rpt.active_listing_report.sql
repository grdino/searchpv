create schema if not exists rpt;

drop view if exists rpt.active_listing;

create view rpt.active_listing as

with latest_snapshot as (
    select max(invntry_snap_date_ky) as invntry_snap_date_ky
    from dw.invntry_snap
),

price_changes as (
    select
        lstng_ky,
        count(*) as price_changes
    from dw.prc_hstry
    group by lstng_ky
)

select

    ------------------------------------------------------------------
    -- Keys
    ------------------------------------------------------------------
    s.invntry_snap_ky,
    s.invntry_snap_date_ky,
    l.lstng_ky,
    p.prprty_ky,

    ------------------------------------------------------------------
    -- Geographic Filters
    ------------------------------------------------------------------
    p.zone_ds        as zone_name,
    p.area_ds        as area_name,
    p.cmnty_ds       as community_name,
    p.dvlpmnt_ds     as development_name,

    ------------------------------------------------------------------
    -- Property Classification
    ------------------------------------------------------------------
    p.prprty_type,
    l.prprty_type_cd,

    case
        when s.pre_cnstrctn_fl then 'Pre-Construction'
        else 'Resale'
    end as market_type,

    ------------------------------------------------------------------
    -- Report Columns
    ------------------------------------------------------------------
    l.lstng_nb                    as mls,

    p.adrs_ds                     as address,

    p.dvlpmnt_ds                  as development,

    l.bdrm_nb                     as beds,

    (
        coalesce(l.full_bthrm_nb,0)
        +
        coalesce(l.half_bthrm_nb,0) * 0.5
    )                             as baths,

    l.ft2_cnstrctn_nb             as sqft,
    l.m2_cnstrctn_nb              as sqm,

    l.ft2_lot_nb                  as lot_sqft,
    l.m2_lot_nb                   as lot_sqm,

    s.orgnl_list_prc_am           as original_price,

    s.snap_list_prc_am            as current_price,

    coalesce(pc.price_changes,0)  as price_changes,

    case
        when s.orgnl_list_prc_am is not null
         and s.snap_list_prc_am is not null
        then s.orgnl_list_prc_am - s.snap_list_prc_am
        else null
    end                           as total_reduction,

    case
        when s.orgnl_list_prc_am > 0
        then round(
            (
                (s.orgnl_list_prc_am - s.snap_list_prc_am)
                / s.orgnl_list_prc_am
            ) * 100,
            2
        )
        else null
    end                           as reduction_percent,

    s.prc_ft2_qt                  as price_per_sqft,
    s.prc_m2_qt                   as price_per_sqm,

    s.dom_qt                      as dom,

    ------------------------------------------------------------------
    -- Listing Information
    ------------------------------------------------------------------
    l.lstng_agncy_ds,

    l.lstng_agnt_nm,

    l.lstng_co_agnt_nm,

    l.year_blt_dt,

    l.flr_nb,

    l.prmy_view_nm,

    l.scndry_view_nm,

    ------------------------------------------------------------------
    -- Mapping
    ------------------------------------------------------------------
    p.lat_nb,

    p.long_nb,

    ------------------------------------------------------------------
    -- Future Use
    ------------------------------------------------------------------
    p.bldng_ds,

    p.unit_id,

    p.tax_id,

    p.prprty_fngrprnt_id,

    p.load_dt

from dw.invntry_snap s

join latest_snapshot ls
  on s.invntry_snap_date_ky = ls.invntry_snap_date_ky

join dw.lstng l
  on s.lstng_ky = l.lstng_ky

join dw.prprty p
  on s.prprty_ky = p.prprty_ky

left join price_changes pc
  on s.lstng_ky = pc.lstng_ky

where s.stts_cd = 'A';


drop view if exists public.active_listing;

create or replace view public.active_listing as
select *
from rpt.active_listing;