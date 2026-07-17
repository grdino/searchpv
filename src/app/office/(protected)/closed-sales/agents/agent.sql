-- ============================================================================
-- 1. CLOSED SALES BY AGENT
-- ============================================================================
-- Returns one ranking row per agent + agency combination.
--
-- Primary listing and selling agents are included.
-- Co-agents are not included in this initial version.
-- ============================================================================

create or replace function public.closed_sales_by_agent(
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
    agent_nm text,
    agency_nm text,

    closed_transactions bigint,
    transaction_volume_usd numeric,

    listing_sides bigint,
    listing_volume_usd numeric,

    selling_sides bigint,
    selling_volume_usd numeric,

    both_sides bigint,

    total_sides bigint,
    total_side_volume_usd numeric,

    side_capture_pc numeric,
    both_sides_pc numeric,

    average_sold_price_usd numeric,
    median_sold_price_usd numeric,

    average_dom numeric,
    median_dom numeric,

    average_sold_to_list_pc numeric,
    median_sold_to_list_pc numeric,

    average_sold_vs_list_pc numeric,
    median_sold_vs_list_pc numeric
)
language sql
stable
security definer
set search_path to 'public', 'internal', 'pg_temp'
as $function$

with filtered_sales as (
    select
        d.clsd_sale_ky,
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

-- Create one participation row for each listing side
-- and one participation row for each selling side.
agent_side_rows as (
    select
        f.clsd_sale_ky,
        f.sold_price_usd,
        f.dom_nb,
        f.sold_to_list_pc,
        f.sold_vs_list_pc,

        f.listing_agent_nm as agent_nm,
        f.listing_agency_nm as agency_nm,

        true as listing_side_fl,
        false as selling_side_fl

    from filtered_sales f

    where f.listing_agent_nm is not null

    union all

    select
        f.clsd_sale_ky,
        f.sold_price_usd,
        f.dom_nb,
        f.sold_to_list_pc,
        f.sold_vs_list_pc,

        f.selling_agent_nm as agent_nm,
        f.selling_agency_nm as agency_nm,

        false as listing_side_fl,
        true as selling_side_fl

    from filtered_sales f

    where f.selling_agent_nm is not null
),

-- Collapse an agent's listing and selling participation on the same
-- transaction into one transaction-level row.
--
-- Agency is included in the grouping so production at different
-- brokerages is not combined.
agent_transactions as (
    select
        r.clsd_sale_ky,
        r.agent_nm,
        r.agency_nm,

        max(r.sold_price_usd) as sold_price_usd,
        max(r.dom_nb) as dom_nb,
        max(r.sold_to_list_pc) as sold_to_list_pc,
        max(r.sold_vs_list_pc) as sold_vs_list_pc,

        bool_or(r.listing_side_fl) as listing_side_fl,
        bool_or(r.selling_side_fl) as selling_side_fl

    from agent_side_rows r

    group by
        r.clsd_sale_ky,
        r.agent_nm,
        r.agency_nm
),

agent_summary as (
    select
        a.agent_nm,
        a.agency_nm,

        count(*)::bigint as closed_transactions,

        sum(a.sold_price_usd) as transaction_volume_usd,

        count(*) filter (
            where a.listing_side_fl
        )::bigint as listing_sides,

        sum(a.sold_price_usd) filter (
            where a.listing_side_fl
        ) as listing_volume_usd,

        count(*) filter (
            where a.selling_side_fl
        )::bigint as selling_sides,

        sum(a.sold_price_usd) filter (
            where a.selling_side_fl
        ) as selling_volume_usd,

        count(*) filter (
            where
                a.listing_side_fl
                and a.selling_side_fl
        )::bigint as both_sides,

        (
            count(*) filter (where a.listing_side_fl)
            +
            count(*) filter (where a.selling_side_fl)
        )::bigint as total_sides,

        (
            coalesce(
                sum(a.sold_price_usd) filter (
                    where a.listing_side_fl
                ),
                0
            )
            +
            coalesce(
                sum(a.sold_price_usd) filter (
                    where a.selling_side_fl
                ),
                0
            )
        ) as total_side_volume_usd,

        avg(a.sold_price_usd) as average_sold_price_usd,

        percentile_cont(0.5)
            within group (
                order by a.sold_price_usd
            ) as median_sold_price_usd,

        avg(a.dom_nb) as average_dom,

        percentile_cont(0.5)
            within group (
                order by a.dom_nb
            ) as median_dom,

        avg(a.sold_to_list_pc) as average_sold_to_list_pc,

        percentile_cont(0.5)
            within group (
                order by a.sold_to_list_pc
            ) as median_sold_to_list_pc,

        avg(a.sold_vs_list_pc) as average_sold_vs_list_pc,

        percentile_cont(0.5)
            within group (
                order by a.sold_vs_list_pc
            ) as median_sold_vs_list_pc

    from agent_transactions a

    group by
        a.agent_nm,
        a.agency_nm
)

select
    s.agent_nm,
    s.agency_nm,

    s.closed_transactions,
    round(coalesce(s.transaction_volume_usd, 0), 2),

    s.listing_sides,
    round(coalesce(s.listing_volume_usd, 0), 2),

    s.selling_sides,
    round(coalesce(s.selling_volume_usd, 0), 2),

    s.both_sides,

    s.total_sides,
    round(coalesce(s.total_side_volume_usd, 0), 2),

    case
        when s.closed_transactions = 0 then null
        else round(
            (
                s.total_sides::numeric
                /
                (s.closed_transactions::numeric * 2)
            ) * 100,
            2
        )
    end as side_capture_pc,

    case
        when s.closed_transactions = 0 then null
        else round(
            (
                s.both_sides::numeric
                /
                s.closed_transactions::numeric
            ) * 100,
            2
        )
    end as both_sides_pc,

    round(s.average_sold_price_usd, 2),
    round(s.median_sold_price_usd::numeric, 2),

    round(s.average_dom, 1),
    round(s.median_dom::numeric, 1),

    round(s.average_sold_to_list_pc, 2),
    round(s.median_sold_to_list_pc::numeric, 2),

    round(s.average_sold_vs_list_pc, 2),
    round(s.median_sold_vs_list_pc::numeric, 2)

from agent_summary s

order by
    s.total_side_volume_usd desc,
    s.closed_transactions desc,
    s.agent_nm,
    s.agency_nm;

$function$;


-- ============================================================================
-- 2. CLOSED SALES AGENT REPORT SUMMARY
-- ============================================================================
-- Returns the overall KPI totals for the selected market filters.
--
-- Like the agency summary function, transactions are counted once in the
-- overall transaction metrics.
--
-- "Both sides" means the same agent, at the same agency, appears as both
-- the primary listing agent and primary selling agent.
-- ============================================================================

create or replace function public.closed_sales_agent_report_summary(
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
    closed_transactions bigint,
    transaction_volume_usd numeric,

    listing_sides bigint,
    listing_volume_usd numeric,

    selling_sides bigint,
    selling_volume_usd numeric,

    both_sides bigint,

    total_sides bigint,
    total_side_volume_usd numeric,

    side_capture_pc numeric,
    both_sides_pc numeric,

    average_sold_price_usd numeric,
    median_sold_price_usd numeric,

    average_dom numeric,
    median_dom numeric,

    average_sold_to_list_pc numeric,
    median_sold_to_list_pc numeric,

    average_sold_vs_list_pc numeric,
    median_sold_vs_list_pc numeric
)
language sql
stable
security definer
set search_path to 'public', 'internal', 'pg_temp'
as $function$

with filtered_sales as (
    select
        d.clsd_sale_ky,
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

summary as (
    select
        count(*)::bigint as closed_transactions,

        sum(sold_price_usd) as transaction_volume_usd,

        count(*) filter (
            where listing_agent_nm is not null
        )::bigint as listing_sides,

        sum(sold_price_usd) filter (
            where listing_agent_nm is not null
        ) as listing_volume_usd,

        count(*) filter (
            where selling_agent_nm is not null
        )::bigint as selling_sides,

        sum(sold_price_usd) filter (
            where selling_agent_nm is not null
        ) as selling_volume_usd,

        count(*) filter (
            where
                listing_agent_nm is not null
                and selling_agent_nm is not null

                and upper(listing_agent_nm)
                    = upper(selling_agent_nm)

                and upper(coalesce(listing_agency_nm, ''))
                    = upper(coalesce(selling_agency_nm, ''))
        )::bigint as both_sides,

        avg(sold_price_usd) as average_sold_price_usd,

        percentile_cont(0.5)
            within group (
                order by sold_price_usd
            ) as median_sold_price_usd,

        avg(dom_nb) as average_dom,

        percentile_cont(0.5)
            within group (
                order by dom_nb
            ) as median_dom,

        avg(sold_to_list_pc) as average_sold_to_list_pc,

        percentile_cont(0.5)
            within group (
                order by sold_to_list_pc
            ) as median_sold_to_list_pc,

        avg(sold_vs_list_pc) as average_sold_vs_list_pc,

        percentile_cont(0.5)
            within group (
                order by sold_vs_list_pc
            ) as median_sold_vs_list_pc

    from filtered_sales
)

select
    s.closed_transactions,

    round(
        coalesce(s.transaction_volume_usd, 0),
        2
    ),

    s.listing_sides,

    round(
        coalesce(s.listing_volume_usd, 0),
        2
    ),

    s.selling_sides,

    round(
        coalesce(s.selling_volume_usd, 0),
        2
    ),

    s.both_sides,

    (
        s.listing_sides
        +
        s.selling_sides
    )::bigint as total_sides,

    round(
        coalesce(s.listing_volume_usd, 0)
        +
        coalesce(s.selling_volume_usd, 0),
        2
    ) as total_side_volume_usd,

    case
        when s.closed_transactions = 0 then null
        else round(
            (
                (
                    s.listing_sides
                    +
                    s.selling_sides
                )::numeric
                /
                (
                    s.closed_transactions::numeric
                    * 2
                )
            ) * 100,
            2
        )
    end as side_capture_pc,

    case
        when s.closed_transactions = 0 then null
        else round(
            (
                s.both_sides::numeric
                /
                s.closed_transactions::numeric
            ) * 100,
            2
        )
    end as both_sides_pc,

    round(s.average_sold_price_usd, 2),
    round(s.median_sold_price_usd::numeric, 2),

    round(s.average_dom, 1),
    round(s.median_dom::numeric, 1),

    round(s.average_sold_to_list_pc, 2),
    round(s.median_sold_to_list_pc::numeric, 2),

    round(s.average_sold_vs_list_pc, 2),
    round(s.median_sold_vs_list_pc::numeric, 2)

from summary s;

$function$;