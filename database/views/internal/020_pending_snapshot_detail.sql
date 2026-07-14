-- ============================================================================
-- File: 020_pending_snapshot_detail.sql
-- View: internal.pending_snapshot_detail
-- Grain: One row per pending listing in the latest inventory snapshot.
--
-- Sources:
--   dw.invntry_snap
--   dw.lstng
--   dw.prprty
--   dw.clndr
--
-- Notes:
--   * Pending reporting is snapshot-based only.
--   * Selling-side fields are unavailable before closing and are not included.
--   * dw.prc_hstry and dw.stts_chg are intentionally not used.
--   * The status filter accepts PENDING and P. Remove P if it is not a valid code.
-- ============================================================================

create or replace view internal.pending_snapshot_detail as
with latest_snapshot_date as (
    select max(i.invntry_snap_date_ky) as invntry_snap_date_ky
    from dw.invntry_snap i
),
latest_listing_rows as (
    select
        i.*,
        row_number() over (
            partition by i.lstng_ky
            order by
                i.run_ts desc nulls last,
                i.load_ts desc nulls last,
                i.invntry_snap_ky desc
        ) as listing_row_nb
    from dw.invntry_snap i
    join latest_snapshot_date d
      on d.invntry_snap_date_ky = i.invntry_snap_date_ky
)
select
    -- Snapshot and listing keys
    i.invntry_snap_ky,
    i.invntry_snap_date_ky,
    c.full_dt                         as snapshot_dt,
    i.lstng_ky,
    i.prprty_ky,
    l.lstng_nb,
    i.stts_cd,

    -- Geographic hierarchy
    p.zone_ds                         as zone_nm,
    p.area_ds                         as area_nm,
    p.cmnty_ds                        as community_nm,
    p.dvlpmnt_ds                      as development_nm,
    p.bldng_ds                        as building_nm,

    -- Property identity and location
    p.prprty_fngrprnt_id,
    p.tax_id,
    p.adrs_ds                         as property_address_ds,
    p.unit_id,
    p.prprty_type                     as property_type_ds,
    p.lat_nb,
    p.long_nb,

    -- Listing address and property characteristics
    l.adrs_strt_nm,
    l.adrs_city_nm,
    l.adrs_st_nm,
    l.adrs_zip_cd,
    l.adrs_lngtd_nb,
    l.adrs_lttd_nb,
    l.prprty_type_cd,
    l.bdrm_nb,
    l.full_bthrm_nb,
    l.half_bthrm_nb,
    l.m2_lot_nb,
    l.ft2_lot_nb,
    l.m2_cnstrctn_nb,
    l.ft2_cnstrctn_nb,
    l.year_blt_dt,
    l.flr_nb,
    l.prmy_view_nm,
    l.scndry_view_nm,

    -- Listing-side agency and agents
    nullif(trim(l.lstng_agncy_ds), '') as listing_agency_nm,
    nullif(trim(l.lstng_agnt_nm), '')  as listing_agent_nm,
    nullif(trim(l.lstng_co_agnt_nm), '') as listing_co_agent_nm,

    -- Snapshot measures
    i.orgnl_list_prc_am               as original_list_price_usd,
    i.snap_list_prc_am                as current_list_price_usd,
    i.prc_m2_qt                       as current_price_per_m2_usd,
    i.prc_ft2_qt                      as current_price_per_ft2_usd,
    i.dom_qt                          as current_dom_nb,

    case
        when i.orgnl_list_prc_am is null
          or i.snap_list_prc_am is null
            then null
        else i.snap_list_prc_am - i.orgnl_list_prc_am
    end                                as price_change_from_original_usd,

    case
        when i.orgnl_list_prc_am is null
          or i.orgnl_list_prc_am = 0
          or i.snap_list_prc_am is null
            then null
        else round(
            ((i.snap_list_prc_am - i.orgnl_list_prc_am)
                / i.orgnl_list_prc_am) * 100,
            4
        )
    end                                as price_change_from_original_pc,

    -- Market classification
    i.pre_cnstrctn_fl,
    case
        when i.pre_cnstrctn_fl then 'PRE-CONSTRUCTION'
        else 'RESALE'
    end                                as market_type_nm,

    -- Load metadata
    i.extrct_rnge_id,
    i.btch_id,
    i.run_ts,
    i.load_ts

from latest_listing_rows i
join dw.lstng l
  on l.lstng_ky = i.lstng_ky
join dw.prprty p
  on p.prprty_ky = i.prprty_ky
join dw.clndr c
  on c.clndr_ky = i.invntry_snap_date_ky
where i.listing_row_nb = 1
  and upper(trim(i.stts_cd)) = 'P';

comment on view internal.pending_snapshot_detail is
    'One row per pending listing from the latest inventory snapshot; no pending-event date is implied.';