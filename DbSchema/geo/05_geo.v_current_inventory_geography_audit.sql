    create or replace view geo.v_current_inventory_geography_audit as

    with current_inventory as
    (
        select
            'ACTIVE'::text as listing_status_cd,
            a.lstng_ky,
            a.prprty_ky,
            a.mls,
            a.address
        from public.active_listing a

        union all

        select
            'PENDING'::text as listing_status_cd,
            p.lstng_ky,
            p.prprty_ky,
            p.mls,
            p.address
        from public.pending_listing p
    )

    select
        ci.listing_status_cd,
        ci.lstng_ky,
        ci.mls,
        ci.address,

        a.prprty_ky,
        a.adrs_ds,
        a.lat_nb,
        a.long_nb,

        a.mls_zone_nm,
        a.mls_area_nm,
        a.mls_community_nm,

        a.boundary_ky,
        a.spv_entity_ky,
        a.spv_community_nm,

        a.approved_boundary_count,
        a.approved_boundary_matches_js,
        a.audit_status_cd

    from current_inventory ci

    join geo.v_property_geography_audit a
        on a.prprty_ky = ci.prprty_ky;