create or replace view public.current_search_listing as

with current_listing as (

    select
        'active'::text as listing_status,
        al.invntry_snap_ky,
        al.invntry_snap_date_ky,
        al.lstng_ky,
        al.prprty_ky,
        al.zone_name,
        al.area_name,
        al.community_name,
        al.development_name,
        al.prprty_type,
        al.prprty_type_cd,
        al.market_type,
        al.market_segment,
        al.mls,
        al.address,
        al.development,
        al.beds,
        al.baths,
        al.sqft,
        al.sqm,
        al.lot_sqft,
        al.lot_sqm,
        al.original_price,
        al.current_price,
        al.price_per_sqft,
        al.price_per_sqm,
        al.dom,
        al.snapshot_date,
        al.data_current_as_of

    from public.active_listing al

    union all

    select
        'pending'::text as listing_status,
        pl.invntry_snap_ky,
        pl.invntry_snap_date_ky,
        pl.lstng_ky,
        pl.prprty_ky,
        pl.zone_name,
        pl.area_name,
        pl.community_name,
        pl.development_name,
        pl.prprty_type,
        pl.prprty_type_cd,
        pl.market_type,
        pl.market_segment,
        pl.mls,
        pl.address,
        pl.development,
        pl.beds,
        pl.baths,
        pl.sqft,
        pl.sqm,
        pl.lot_sqft,
        pl.lot_sqm,
        pl.original_price,
        pl.current_price,
        pl.price_per_sqft,
        pl.price_per_sqm,
        pl.dom,
        pl.snapshot_date,
        pl.data_current_as_of

    from public.pending_listing pl
)

select
    cl.listing_status,

    cl.invntry_snap_ky,
    cl.invntry_snap_date_ky,
    cl.lstng_ky,
    cl.prprty_ky,

    cl.zone_name,
    cl.area_name,
    cl.community_name,
    cl.development_name,

    cl.prprty_type,
    cl.prprty_type_cd,

    case
        when lower(trim(cl.prprty_type_cd)) = 'condos'
            then 'condos'
        when lower(trim(cl.prprty_type_cd)) = 'houses'
            then 'houses'
        else 'unknown'
    end as property_type_segment,

    cl.market_type,
    cl.market_segment,

    cl.mls,
    cl.address,
    cl.development,

    cl.beds,
    cl.baths,

    cl.sqft,
    cl.sqm,
    cl.lot_sqft,
    cl.lot_sqm,

    cl.original_price,
    cl.current_price,
    cl.price_per_sqft,
    cl.price_per_sqm,
    cl.dom,

    attr.furnished_cd,

    attr.pet_friendly_fl,
    attr.preconstruction_fl,

    attr.beachfront_fl,
    attr.oceanfront_fl,
    attr.waterfront_fl,

    (
        attr.beachfront_fl is true
        or attr.oceanfront_fl is true
        or attr.waterfront_fl is true
    ) as waterfront_beachfront_fl,

    attr.beach_access_fl,
    attr.ocean_view_fl,

    attr.pool_fl,
    attr.private_pool_fl,
    attr.common_pool_fl,
    attr.infinity_pool_fl,

    attr.parking_fl,
    attr.parking_type_cd,
    attr.parking_space_nb,

    attr.hoa_monthly_mxn_amt,
    attr.hoa_monthly_usd_amt,

    attr.source_batch_number_tx as attribute_source_batch,
    attr.derived_dt as attribute_derived_dt,
    attr.update_dt as attribute_update_dt,

    cl.snapshot_date,
    cl.data_current_as_of

from current_listing cl

join dw.lstng_search_attribute attr
    on attr.lstng_ky = cl.lstng_ky;