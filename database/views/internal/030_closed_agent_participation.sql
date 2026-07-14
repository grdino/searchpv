-- ============================================================================
-- File: 030_closed_agent_participation.sql
-- View: internal.closed_agent_participation
-- Grain: One row per closed sale per participating agent role.
--
-- A closed sale can generate up to four rows:
--   LISTING / PRIMARY
--   LISTING / CO-AGENT
--   SELLING / PRIMARY
--   SELLING / CO-AGENT
--
-- Credit measures:
--   participation_count       = 1 for each participating agent
--   allocated_side_credit     = one side divided equally among agents on that side
--   participating_volume_usd  = full sale price for each participant
--   allocated_volume_usd      = sale price divided equally among agents on that side
--
-- Co-agent agency limitation:
--   Separate agencies are not stored for co-agents. A co-agent inherits the agency
--   stored for that transaction side, and agency_inferred_fl is set to true.
-- ============================================================================

create or replace view internal.closed_agent_participation as
with side_agent_counts as (
    select
        d.clsd_sale_ky,
        (
            case when d.listing_agent_nm is not null then 1 else 0 end
          + case when d.listing_co_agent_nm is not null then 1 else 0 end
        ) as listing_agent_count,
        (
            case when d.selling_agent_nm is not null then 1 else 0 end
          + case when d.selling_co_agent_nm is not null then 1 else 0 end
        ) as selling_agent_count
    from internal.closed_sales_detail d
)
select
    -- Closed-sale identity and date
    d.clsd_sale_ky,
    d.lstng_ky,
    d.prprty_ky,
    d.lstng_nb,
    d.sold_date_ky,
    d.sold_dt,
    d.sold_year_nb,
    d.sold_quarter_nb,
    d.sold_month_nb,
    d.sold_month_nm,
    d.sold_month_abbr_nm,
    d.sold_year_month_id,

    -- Geography and property
    d.zone_nm,
    d.area_nm,
    d.community_nm,
    d.development_nm,
    d.building_nm,
    d.property_address_ds,
    d.unit_id,
    d.property_type_ds,
    d.prprty_type_cd,
    d.bdrm_nb,
    d.full_bthrm_nb,
    d.half_bthrm_nb,
    d.m2_cnstrctn_nb,
    d.ft2_cnstrctn_nb,
    d.pre_cnstrctn_fl,
    d.market_type_nm,

    -- Agent participation
    a.transaction_side_cd,
    a.agent_role_cd,
    a.agency_nm,
    a.agent_nm,
    a.agency_inferred_fl,
    1::numeric                         as participation_count,

    case
        when a.transaction_side_cd = 'LISTING'
            then 1::numeric / nullif(cnt.listing_agent_count, 0)
        when a.transaction_side_cd = 'SELLING'
            then 1::numeric / nullif(cnt.selling_agent_count, 0)
        else null
    end                                as allocated_side_credit,

    -- Sales measures
    d.original_price_usd,
    d.final_list_price_usd,
    d.sold_price_usd,
    d.sold_price_usd                   as participating_volume_usd,

    case
        when a.transaction_side_cd = 'LISTING'
            then d.sold_price_usd / nullif(cnt.listing_agent_count, 0)
        when a.transaction_side_cd = 'SELLING'
            then d.sold_price_usd / nullif(cnt.selling_agent_count, 0)
        else null
    end                                as allocated_volume_usd,

    d.sold_minus_list_amount_usd,
    d.sold_to_list_pc,
    d.sold_vs_list_pc,
    d.sold_vs_list_category,
    d.sold_minus_original_amount_usd,
    d.sold_to_orgnl_pc,
    d.sold_vs_original_pc,
    d.sold_price_per_m2_usd,
    d.sold_price_per_ft2_usd,
    d.dom_nb

from internal.closed_sales_detail d
join side_agent_counts cnt
  on cnt.clsd_sale_ky = d.clsd_sale_ky
cross join lateral (
    values
        (
            'LISTING'::text,
            'PRIMARY'::text,
            d.listing_agency_nm,
            d.listing_agent_nm,
            false
        ),
        (
            'LISTING'::text,
            'CO-AGENT'::text,
            d.listing_agency_nm,
            d.listing_co_agent_nm,
            true
        ),
        (
            'SELLING'::text,
            'PRIMARY'::text,
            d.selling_agency_nm,
            d.selling_agent_nm,
            false
        ),
        (
            'SELLING'::text,
            'CO-AGENT'::text,
            d.selling_agency_nm,
            d.selling_co_agent_nm,
            true
        )
) as a (
    transaction_side_cd,
    agent_role_cd,
    agency_nm,
    agent_nm,
    agency_inferred_fl
)
where a.agent_nm is not null;

comment on view internal.closed_agent_participation is
    'One row per closed-sale agent participant, including primary and co-agents on listing and selling sides.';