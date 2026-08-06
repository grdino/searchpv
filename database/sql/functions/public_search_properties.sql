create or replace function public.search_properties(
    p_market_segment text,
    p_property_type_segment text,

    p_zone_name text,
    p_area_name text,
    p_community_name text,
    p_development_name text,

    p_min_beds numeric,
    p_min_baths numeric,

    p_min_price numeric,
    p_max_price numeric,

    p_waterfront boolean,
    p_ocean_view boolean,
    p_pet_friendly boolean,
    p_pool boolean,
    p_parking boolean,
    p_furnished boolean,

    p_min_hoa_mxn numeric,
    p_max_hoa_mxn numeric
)
returns setof public.current_search_listing
language sql
stable
security invoker
set search_path = public, dw
as $function$

    select csl.*
    from public.current_search_listing csl
    where
        (
            p_market_segment is null
            or p_market_segment = 'all'
            or csl.market_segment = p_market_segment
        )

        and (
            p_property_type_segment is null
            or p_property_type_segment = 'all'
            or csl.property_type_segment = p_property_type_segment
        )

        and (
            p_zone_name is null
            or p_zone_name = ''
            or csl.zone_name = p_zone_name
        )

        and (
            p_area_name is null
            or p_area_name = ''
            or csl.area_name = p_area_name
        )

        and (
            p_community_name is null
            or p_community_name = ''
            or csl.community_name = p_community_name
        )

        and (
            p_development_name is null
            or p_development_name = ''
            or csl.development_name = p_development_name
        )

        and coalesce(csl.beds, 0) >= coalesce(p_min_beds, 0)

        and coalesce(csl.baths, 0) >= coalesce(p_min_baths, 0)

        and coalesce(csl.current_price, 0) >= coalesce(p_min_price, 0)

        and coalesce(csl.current_price, 0)
            <= coalesce(p_max_price, 50000000)

        and (
            coalesce(p_waterfront, false) = false
            or csl.waterfront_beachfront_fl is true
        )

        and (
            coalesce(p_ocean_view, false) = false
            or csl.ocean_view_fl is true
        )

        and (
            coalesce(p_pet_friendly, false) = false
            or csl.pet_friendly_fl is true
        )

        and (
            coalesce(p_pool, false) = false
            or csl.pool_fl is true
        )

        and (
            coalesce(p_parking, false) = false
            or csl.parking_fl is true
        )

        and (
            coalesce(p_furnished, false) = false
            or csl.furnished_cd = 'FURNISHED'
        )

        and (
            p_min_hoa_mxn is null
            or csl.hoa_monthly_mxn_amt >= p_min_hoa_mxn
        )

        and (
            p_max_hoa_mxn is null
            or csl.hoa_monthly_mxn_amt <= p_max_hoa_mxn
        );

$function$;