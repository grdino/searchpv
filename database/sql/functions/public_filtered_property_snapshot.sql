drop function if exists public.filtered_property_snapshot(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    numeric,
    numeric
);


create or replace function public.filtered_property_snapshot(
    p_group_level text,

    p_market_segment text,
    p_property_type_segment text,

    p_zone_name text,
    p_area_name text,
    p_community_name text,
    p_development_name text,

    p_min_beds numeric,
    p_max_beds numeric,

    p_min_baths numeric,
    p_max_baths numeric,

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
returns table (
    group_level text,
    group_name text,

    zone_name text,
    zone_slug text,

    area_name text,
    area_slug text,

    community_name text,
    community_slug text,

    development_name text,
    development_slug text,

    active_count bigint,
    pending_count bigint,
    total_count bigint,

    average_list_price double precision,
    median_list_price double precision,

    average_list_price_per_sqft double precision,
    median_list_price_per_sqft double precision,

    average_list_price_per_sqm double precision,
    median_list_price_per_sqm double precision,

    median_active_dom double precision,

    active_listing_ids text,
    pending_listing_ids text,
    all_listing_ids text,

    snapshot_date date
)
language plpgsql
stable
security invoker
set search_path = public, dw
as $function$
begin
    if p_group_level not in (
        'summary',
        'area',
        'community',
        'development'
    ) then
        raise exception
            'Invalid p_group_level: %. Expected summary, area, community, or development.',
            p_group_level;
    end if;

    return query

    with filtered as (
        select *
        from public.search_properties(
            p_market_segment => p_market_segment,
            p_property_type_segment => p_property_type_segment,

            p_zone_name => p_zone_name,
            p_area_name => p_area_name,
            p_community_name => p_community_name,
            p_development_name => p_development_name,

            p_min_beds => p_min_beds,
            p_max_beds => p_max_beds,

            p_min_baths => p_min_baths,
            p_max_baths => p_max_baths,

            p_min_price => p_min_price,
            p_max_price => p_max_price,

            p_waterfront => p_waterfront,
            p_ocean_view => p_ocean_view,
            p_pet_friendly => p_pet_friendly,
            p_pool => p_pool,
            p_parking => p_parking,
            p_furnished => p_furnished,

            p_min_hoa_mxn => p_min_hoa_mxn,
            p_max_hoa_mxn => p_max_hoa_mxn
        )
    ),

    /*
      Summary mode needs one seed row when there are no matches so that
      it returns zero counts instead of returning no record.
    */
    normalized as (
        select
            f.listing_status,
            f.lstng_ky,
            f.mls,

            f.zone_name,
            f.area_name,
            f.community_name,
            f.development_name,

            f.current_price,
            f.price_per_sqft,
            f.price_per_sqm,
            f.dom,
            f.snapshot_date
        from filtered f

        union all

        select
            null::text,
            null::bigint,
            null::bigint,

            null::text,
            null::text,
            null::text,
            null::text,

            null::numeric,
            null::numeric,
            null::numeric,
            null::integer,
            null::date

        where p_group_level = 'summary'
          and not exists (
              select 1
              from filtered
          )
    ),

    /*
      Calculate the grouping columns once, before aggregation.
    */
    prepared as (
        select
            n.*,

            case
                when p_group_level = 'summary'
                    then null::text
                else n.zone_name
            end as grouped_zone_name,

            case
                when p_group_level = 'summary'
                    then null::text
                else n.area_name
            end as grouped_area_name,

            case
                when p_group_level in ('community', 'development')
                    then n.community_name
                else null::text
            end as grouped_community_name,

            case
                when p_group_level = 'development'
                    then n.development_name
                else null::text
            end as grouped_development_name,

            case
                when p_group_level = 'summary'
                    then 'Selected Market'
                when p_group_level = 'area'
                    then n.area_name
                when p_group_level = 'community'
                    then n.community_name
                when p_group_level = 'development'
                    then n.development_name
            end as grouped_name

        from normalized n
    ),

    grouped as (
        select
            p_group_level::text as group_level,
            p.grouped_name as group_name,

            p.grouped_zone_name as zone_name,
            p.grouped_area_name as area_name,
            p.grouped_community_name as community_name,
            p.grouped_development_name as development_name,

            count(*) filter (
                where p.listing_status = 'active'
                  and p.lstng_ky is not null
            )::bigint as active_count,

            count(*) filter (
                where p.listing_status = 'pending'
                  and p.lstng_ky is not null
            )::bigint as pending_count,

            count(*) filter (
                where p.lstng_ky is not null
            )::bigint as total_count,

            avg(p.current_price)
                filter (
                    where p.listing_status = 'active'
                      and p.current_price > 0
                )::double precision
                as average_list_price,

            percentile_cont(0.5)
                within group (
                    order by p.current_price
                )
                filter (
                    where p.listing_status = 'active'
                      and p.current_price > 0
                ) as median_list_price,

            avg(p.price_per_sqft)
                filter (
                    where p.listing_status = 'active'
                      and p.price_per_sqft > 0
                )::double precision
                as average_list_price_per_sqft,

            percentile_cont(0.5)
                within group (
                    order by p.price_per_sqft
                )
                filter (
                    where p.listing_status = 'active'
                      and p.price_per_sqft > 0
                ) as median_list_price_per_sqft,

            avg(p.price_per_sqm)
                filter (
                    where p.listing_status = 'active'
                      and p.price_per_sqm > 0
                )::double precision
                as average_list_price_per_sqm,

            percentile_cont(0.5)
                within group (
                    order by p.price_per_sqm
                )
                filter (
                    where p.listing_status = 'active'
                      and p.price_per_sqm > 0
                ) as median_list_price_per_sqm,

            percentile_cont(0.5)
                within group (
                    order by p.dom
                )
                filter (
                    where p.listing_status = 'active'
                      and p.dom is not null
                ) as median_active_dom,

            string_agg(
                p.mls::text,
                ','
                order by p.mls
            ) filter (
                where p.listing_status = 'active'
                  and p.mls is not null
            ) as active_listing_ids,

            string_agg(
                p.mls::text,
                ','
                order by p.mls
            ) filter (
                where p.listing_status = 'pending'
                  and p.mls is not null
            ) as pending_listing_ids,

            string_agg(
                p.mls::text,
                ','
                order by p.mls
            ) filter (
                where p.mls is not null
            ) as all_listing_ids,

            max(p.snapshot_date) as snapshot_date

        from prepared p

        group by
            p.grouped_name,
            p.grouped_zone_name,
            p.grouped_area_name,
            p.grouped_community_name,
            p.grouped_development_name
    ),

    area_geography as (
        select distinct
            cs.zone_name,
            cs.zone_slug,
            cs.area_name,
            cs.area_slug
        from public.community_snapshot cs
        where cs.zone_name is not null
          and cs.area_name is not null
    ),

    community_geography as (
        select distinct
            cs.zone_name,
            cs.zone_slug,
            cs.area_name,
            cs.area_slug,
            cs.community_name,
            cs.community_slug
        from public.community_snapshot cs
        where cs.zone_name is not null
          and cs.area_name is not null
          and cs.community_name is not null
    ),

    development_geography as (
        select distinct
            ds.zone_name,
            ds.zone_slug,
            ds.area_name,
            ds.area_slug,
            ds.community_name,
            ds.community_slug,
            ds.development_name,
            ds.development_slug
        from public.development_snapshot ds
        where ds.zone_name is not null
          and ds.area_name is not null
          and ds.community_name is not null
          and ds.development_name is not null
    )

    select
        g.group_level,
        g.group_name,

        g.zone_name,

        case
            when p_group_level = 'area'
                then ag.zone_slug
            when p_group_level = 'community'
                then cg.zone_slug
            when p_group_level = 'development'
                then dg.zone_slug
            else null::text
        end as zone_slug,

        g.area_name,

        case
            when p_group_level = 'area'
                then ag.area_slug
            when p_group_level = 'community'
                then cg.area_slug
            when p_group_level = 'development'
                then dg.area_slug
            else null::text
        end as area_slug,

        g.community_name,

        case
            when p_group_level = 'community'
                then cg.community_slug
            when p_group_level = 'development'
                then dg.community_slug
            else null::text
        end as community_slug,

        g.development_name,

        case
            when p_group_level = 'development'
                then dg.development_slug
            else null::text
        end as development_slug,

        g.active_count,
        g.pending_count,
        g.total_count,

        g.average_list_price,
        g.median_list_price,

        g.average_list_price_per_sqft,
        g.median_list_price_per_sqft,

        g.average_list_price_per_sqm,
        g.median_list_price_per_sqm,

        g.median_active_dom,

        g.active_listing_ids,
        g.pending_listing_ids,
        g.all_listing_ids,

        g.snapshot_date

    from grouped g

    left join area_geography ag
        on p_group_level = 'area'
       and ag.zone_name = g.zone_name
       and ag.area_name = g.area_name

    left join community_geography cg
        on p_group_level = 'community'
       and cg.zone_name = g.zone_name
       and cg.area_name = g.area_name
       and cg.community_name = g.community_name

    left join development_geography dg
        on p_group_level = 'development'
       and dg.zone_name = g.zone_name
       and dg.area_name = g.area_name
       and dg.community_name = g.community_name
       and dg.development_name = g.development_name

    order by
        g.active_count desc,
        g.pending_count desc,
        g.group_name;

end;
$function$; 

grant execute on function public.filtered_property_snapshot(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    numeric,
    numeric
)
to anon, authenticated, service_role;