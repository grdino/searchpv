-- ============================================================================
-- File: 040_pending_agent_participation.sql
-- View: internal.pending_agent_participation
-- Grain: One row per current pending listing per listing-side agent.
--
-- A pending listing can generate up to two rows:
--   LISTING / PRIMARY
--   LISTING / CO-AGENT
--
-- Selling agents are unavailable until closing.
-- A co-listing agent inherits the listing agency, and agency_inferred_fl is true.
-- ============================================================================

create or replace view internal.pending_agent_participation as
with agent_counts as (
    select
        d.invntry_snap_ky,
        (
            case when d.listing_agent_nm is not null then 1 else 0 end
          + case when d.listing_co_agent_nm is not null then 1 else 0 end
        ) as listing_agent_count
    from internal.pending_snapshot_detail d
)
select
    -- Snapshot and listing identity
    d.invntry_snap_ky,
    d.invntry_snap_date_ky,
    d.snapshot_dt,
    d.lstng_ky,
    d.prprty_ky,
    d.lstng_nb,
    d.stts_cd,

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
    'LISTING'::text                   as transaction_side_cd,
    a.agent_role_cd,
    a.agency_nm,
    a.agent_nm,
    a.agency_inferred_fl,
    1::numeric                        as participation_count,
    1::numeric / nullif(cnt.listing_agent_count, 0)
                                      as allocated_side_credit,

    -- Pending measures
    d.original_list_price_usd,
    d.current_list_price_usd,
    d.current_list_price_usd          as participating_volume_usd,
    d.current_list_price_usd
        / nullif(cnt.listing_agent_count, 0)
                                      as allocated_volume_usd,
    d.current_price_per_m2_usd,
    d.current_price_per_ft2_usd,
    d.current_dom_nb,
    d.price_change_from_original_usd,
    d.price_change_from_original_pc

from internal.pending_snapshot_detail d
join agent_counts cnt
  on cnt.invntry_snap_ky = d.invntry_snap_ky
cross join lateral (
    values
        (
            'PRIMARY'::text,
            d.listing_agency_nm,
            d.listing_agent_nm,
            false
        ),
        (
            'CO-AGENT'::text,
            d.listing_agency_nm,
            d.listing_co_agent_nm,
            true
        )
) as a (
    agent_role_cd,
    agency_nm,
    agent_nm,
    agency_inferred_fl
)
where a.agent_nm is not null;

comment on view internal.pending_agent_participation is
    'One row per current pending listing per listing-side primary or co-agent.';