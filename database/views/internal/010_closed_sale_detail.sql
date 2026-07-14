-- ============================================================================
-- File: 010_closed_sales_detail.sql
-- View: internal.closed_sales_detail
-- Grain: One row per closed listing.
--
-- Sources:
--   dw.clsd_sale
--   dw.lstng
--   dw.prprty
--   dw.clndr
--
-- Notes:
--   * All monetary values are USD.
--   * DOM applies to the specific listing number.
--   * Selling-agent fields are sourced from the buyer-agent columns in dw.lstng.
--   * dw.prc_hstry and dw.stts_chg are intentionally not used.
-- ============================================================================

create or replace view internal.closed_sales_detail as
select
    -- Keys and listing identity
    cs.clsd_sale_ky,
    cs.lstng_ky,
    cs.prprty_ky,
    l.lstng_nb,

    -- Closed date and calendar attributes
    cs.sold_date_ky,
    c.full_dt                         as sold_dt,
    c.year_nb                         as sold_year_nb,
    c.quarter_nb                      as sold_quarter_nb,
    c.month_nb                        as sold_month_nb,
    c.month_nm                        as sold_month_nm,
    c.month_abbr_nm                   as sold_month_abbr_nm,
    trim(c.year_month_id)             as sold_year_month_id,
    c.month_start_dt                  as sold_month_start_dt,
    c.month_end_dt                    as sold_month_end_dt,
    c.quarter_start_dt                as sold_quarter_start_dt,
    c.quarter_end_dt                  as sold_quarter_end_dt,
    c.year_start_dt                   as sold_year_start_dt,
    c.year_end_dt                     as sold_year_end_dt,

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

    -- Listing side
    nullif(trim(l.lstng_agncy_ds), '') as listing_agency_nm,
    nullif(trim(l.lstng_agnt_nm), '')  as listing_agent_nm,
    nullif(trim(l.lstng_co_agnt_nm), '') as listing_co_agent_nm,

    -- Selling side
    nullif(trim(l.buyer_agncy_nm), '') as selling_agency_nm,
    nullif(trim(l.buyer_agnt_nm), '')  as selling_agent_nm,
    nullif(trim(l.buyer_co_agnt_nm), '') as selling_co_agent_nm,

    -- Closed-sale measures
    cs.orgnl_prc_am                    as original_price_usd,
    cs.list_prc_am                     as final_list_price_usd,
    cs.sold_prc_am                     as sold_price_usd,
    cs.sold_minus_list_am              as sold_minus_list_amount_usd,
    cs.sold_to_list_pc,

    case
        when cs.list_prc_am is null
          or cs.list_prc_am = 0
          or cs.sold_prc_am is null
            then null
        else round(
            ((cs.sold_prc_am - cs.list_prc_am) / cs.list_prc_am) * 100,
            4
        )
    end                                 as sold_vs_list_pc,

    case
        when cs.list_prc_am is null
          or cs.sold_prc_am is null
            then null
        when cs.sold_prc_am > cs.list_prc_am
            then 'ABOVE LIST'
        when cs.sold_prc_am < cs.list_prc_am
            then 'BELOW LIST'
        else 'AT LIST'
    end                                 as sold_vs_list_category,

    cs.sold_minus_orgnl_am             as sold_minus_original_amount_usd,
    cs.sold_to_orgnl_pc,

    case
        when cs.orgnl_prc_am is null
          or cs.orgnl_prc_am = 0
          or cs.sold_prc_am is null
            then null
        else round(
            ((cs.sold_prc_am - cs.orgnl_prc_am) / cs.orgnl_prc_am) * 100,
            4
        )
    end                                 as sold_vs_original_pc,

    cs.sold_prc_m2_am                  as sold_price_per_m2_usd,
    cs.sold_prc_ft2_am                 as sold_price_per_ft2_usd,
    cs.dom_nb,

    -- Market classification
    cs.pre_cnstrctn_fl,
    case
        when cs.pre_cnstrctn_fl then 'PRE-CONSTRUCTION'
        else 'RESALE'
    end                                 as market_type_nm,

    -- Load metadata
    cs.extrct_rnge_id,
    cs.btch_id,
    cs.run_ts

from dw.clsd_sale cs
join dw.lstng l
  on l.lstng_ky = cs.lstng_ky
join dw.prprty p
  on p.prprty_ky = cs.prprty_ky
join dw.clndr c
  on c.clndr_ky = cs.sold_date_ky;

comment on view internal.closed_sales_detail is
    'One row per closed listing with date, geography, property, agency, agent and sales measures.';