-- ============================================================================
-- CLOSED SALES AGENT DETAIL
-- ============================================================================
-- Returns the individual closed transactions that make up an agent's totals.
--
-- The agent and agency must match the listing side, selling side, or both.
-- The same market filters used by closed_sales_by_agent() are supported.
-- ============================================================================

create or replace function public.closed_sales_agent_detail(
    p_agent_nm text,
    p_agency_nm text,

    p_start_date date default null::date,
    p_end_date date default null::date,

    p_zone_nm text default null::text,
    p_area_nm text default null::text,
    p_community_nm text default null::text,
    p_development_nm text default null::text,

    p_property_type_cd text default null::text,
    p_market_type_nm text default null::text
)
returns table (
    clsd_sale_ky bigint,
    lstng_nb text,

    sold_dt date,

    zone_nm text,
    area_nm text,
    community_nm text,
    development_nm text,

    prprty_type_cd text,
    market_type_nm text,

    sold_price_usd numeric,
    dom_nb numeric,

    sold_to_list_pc numeric,
    sold_vs_list_pc numeric,

    participation_nm text,

    listing_agent_nm text,
    listing_agency_nm text,

    selling_agent_nm text,
    selling_agency_nm text
)
language sql
stable
security definer
set search_path to 'public', 'internal', 'pg_temp'
as $function$

with filtered_sales as (
    select
        d.clsd_sale_ky,
        d.lstng_nb,
        d.sold_dt,

        d.zone_nm,
        d.area_nm,
        d.community_nm,
        d.development_nm,

        d.prprty_type_cd,
        d.market_type_nm,

        d.sold_price_usd,
        d.dom_nb,

        d.sold_to_list_pc,
        d.sold_vs_list_pc,

        nullif(trim(d.listing_agent_nm), '') as listing_agent_nm,
        nullif(trim(d.listing_agency_nm), '') as listing_agency_nm,

        nullif(trim(d.selling_agent_nm), '') as selling_agent_nm,
        nullif(trim(d.selling_agency_nm), '') as selling_agency_nm

    from internal.closed_sales_detail d

    where
        (
            p_start_date is null
            or d.sold_dt >= p_start_date
        )
        and (
            p_end_date is null
            or d.sold_dt <= p_end_date
        )
        and (
            p_zone_nm is null
            or d.zone_nm = p_zone_nm
        )
        and (
            p_area_nm is null
            or d.area_nm = p_area_nm
        )
        and (
            p_community_nm is null
            or d.community_nm = p_community_nm
        )
        and (
            p_development_nm is null
            or d.development_nm = p_development_nm
        )
        and (
            p_property_type_cd is null
            or d.prprty_type_cd = p_property_type_cd
        )
        and (
            p_market_type_nm is null
            or d.market_type_nm = p_market_type_nm
        )
),

agent_matches as (
    select
        f.*,

        (
            upper(trim(f.listing_agent_nm))
                = upper(trim(p_agent_nm))
            and upper(trim(coalesce(f.listing_agency_nm, '')))
                = upper(trim(coalesce(p_agency_nm, '')))
        ) as listing_agent_match_fl,

        (
            upper(trim(f.selling_agent_nm))
                = upper(trim(p_agent_nm))
            and upper(trim(coalesce(f.selling_agency_nm, '')))
                = upper(trim(coalesce(p_agency_nm, '')))
        ) as selling_agent_match_fl

    from filtered_sales f
)

select
    a.clsd_sale_ky,
    a.lstng_nb,

    a.sold_dt,

    a.zone_nm,
    a.area_nm,
    a.community_nm,
    a.development_nm,

    a.prprty_type_cd,
    a.market_type_nm,

    round(a.sold_price_usd, 2) as sold_price_usd,
    a.dom_nb,

    round(a.sold_to_list_pc, 4) as sold_to_list_pc,
    round(a.sold_vs_list_pc, 2) as sold_vs_list_pc,

    case
        when
            a.listing_agent_match_fl
            and a.selling_agent_match_fl
        then 'Both Sides'

        when a.listing_agent_match_fl
        then 'Listing Side'

        when a.selling_agent_match_fl
        then 'Selling Side'
    end as participation_nm,

    a.listing_agent_nm,
    a.listing_agency_nm,

    a.selling_agent_nm,
    a.selling_agency_nm

from agent_matches a

where
    a.listing_agent_match_fl
    or a.selling_agent_match_fl

order by
    a.sold_dt desc nulls last,
    a.sold_price_usd desc nulls last,
    a.lstng_nb;

$function$;