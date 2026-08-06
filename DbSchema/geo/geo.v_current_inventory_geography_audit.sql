create or replace view geo.v_current_inventory_geography_audit as

with latest_active_snapshot as
(
    select max(invntry_snap_date_ky) as invntry_snap_date_ky
    from public.active_listing
),

latest_pending_snapshot as
(
    select max(invntry_snap_date_ky) as invntry_snap_date_ky
    from public.pending_listing
),

current_inventory as
(
    select
        'ACTIVE'::text as listing_status_cd,

        a.invntry_snap_ky,
        a.invntry_snap_date_ky,
        a.snapshot_date,
        a.data_current_as_of,

        a.lstng_ky,
        a.prprty_ky,
        a.mls,

        a.address,
        a.development_name,
        a.prprty_type,
        a.prprty_type_cd,
        a.market_type,

        a.beds,
        a.baths,
        a.sqft,
        a.sqm,

        a.current_price,
        a.dom,

        a.zone_name as listing_mls_zone_nm,
        a.area_name as listing_mls_area_nm,
        a.community_name as listing_mls_community_nm,

        a.lat_nb as listing_lat_nb,
        a.long_nb as listing_long_nb

    from public.active_listing a

    join latest_active_snapshot las
        on las.invntry_snap_date_ky = a.invntry_snap_date_ky

    union all

    select
        'PENDING'::text as listing_status_cd,

        p.invntry_snap_ky,
        p.invntry_snap_date_ky,
        p.snapshot_date,
        p.data_current_as_of,

        p.lstng_ky,
        p.prprty_ky,
        p.mls,

        p.address,
        p.development_name,
        p.prprty_type,
        p.prprty_type_cd,
        p.market_type,

        p.beds,
        p.baths,
        p.sqft,
        p.sqm,

        p.current_price,
        p.dom,

        p.zone_name as listing_mls_zone_nm,
        p.area_name as listing_mls_area_nm,
        p.community_name as listing_mls_community_nm,

        p.lat_nb as listing_lat_nb,
        p.long_nb as listing_long_nb

    from public.pending_listing p

    join latest_pending_snapshot lps
        on lps.invntry_snap_date_ky = p.invntry_snap_date_ky
)

select
    ci.listing_status_cd,

    ci.invntry_snap_ky,
    ci.invntry_snap_date_ky,
    ci.snapshot_date,
    ci.data_current_as_of,

    ci.lstng_ky,
    ci.prprty_ky,
    ci.mls,

    ci.address,
    ci.development_name,
    ci.prprty_type,
    ci.prprty_type_cd,
    ci.market_type,

    ci.beds,
    ci.baths,
    ci.sqft,
    ci.sqm,

    ci.current_price,
    ci.dom,

    ci.listing_mls_zone_nm,
    ci.listing_mls_area_nm,
    ci.listing_mls_community_nm,

    ci.listing_lat_nb,
    ci.listing_long_nb,

    audit.mls_zone_nm as property_mls_zone_nm,
    audit.mls_area_nm as property_mls_area_nm,
    audit.mls_community_nm as property_mls_community_nm,

    audit.boundary_ky,
    audit.spv_entity_ky,
    audit.spv_entity_identifier_cd,
    audit.spv_community_nm,

    audit.approved_boundary_count,
    audit.mls_community_matches_spv,
    audit.approved_boundary_matches_js,

    audit.has_valid_coordinates,
    audit.audit_status_cd,

    case
        when audit.audit_status_cd in
        (
            'NO_APPROVED_BOUNDARY',
            'MULTIPLE_APPROVED_BOUNDARIES',
            'MISSING_COORDINATES'
        )
            then 'HIGH'

        when audit.audit_status_cd = 'MISMATCH'
            then 'REVIEW'

        when audit.audit_status_cd = 'MATCH'
            then 'OK'

        else 'UNKNOWN'
    end as audit_priority_cd

from current_inventory ci

left join geo.v_property_geography_audit audit
    on audit.prprty_ky = ci.prprty_ky;