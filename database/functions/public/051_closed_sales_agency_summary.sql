create or replace function public.closed_sales_agency_report_summary(
    p_start_date date default null,
    p_end_date date default null,
    p_zone_nm text default null,
    p_area_nm text default null,
    p_community_nm text default null,
    p_development_nm text default null,
    p_property_type_cd text default null,
    p_market_type_nm text default null
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
set search_path = public, internal, pg_temp
as $function$
with filtered_sales as (
    select
        d.clsd_sale_ky,
        d.sold_price_usd,
        d.dom_nb,
        d.sold_to_list_pc,
        d.sold_vs_list_pc,
        nullif(trim(d.listing_agency_nm), '') as listing_agency_nm,
        nullif(trim(d.selling_agency_nm), '') as selling_agency_nm
    from internal.closed_sales_detail d
    where
        (p_start_date is null or d.sold_dt >= p_start_date)
        and (p_end_date is null or d.sold_dt <= p_end_date)
        and (p_zone_nm is null or d.zone_nm = p_zone_nm)
        and (p_area_nm is null or d.area_nm = p_area_nm)
        and (p_community_nm is null or d.community_nm = p_community_nm)
        and (p_development_nm is null or d.development_nm = p_development_nm)
        and (p_property_type_cd is null or d.prprty_type_cd = p_property_type_cd)
        and (p_market_type_nm is null or d.market_type_nm = p_market_type_nm)
),
summary as (
    select
        count(*)::bigint as closed_transactions,
        sum(sold_price_usd) as transaction_volume_usd,
        count(*) filter (where listing_agency_nm is not null)::bigint as listing_sides,
        sum(sold_price_usd) filter (where listing_agency_nm is not null) as listing_volume_usd,
        count(*) filter (where selling_agency_nm is not null)::bigint as selling_sides,
        sum(sold_price_usd) filter (where selling_agency_nm is not null) as selling_volume_usd,
        count(*) filter (
            where listing_agency_nm is not null
              and selling_agency_nm is not null
              and upper(listing_agency_nm) = upper(selling_agency_nm)
        )::bigint as both_sides,
        avg(sold_price_usd) as average_sold_price_usd,
        percentile_cont(0.5) within group (order by sold_price_usd) as median_sold_price_usd,
        avg(dom_nb) as average_dom,
        percentile_cont(0.5) within group (order by dom_nb) as median_dom,
        avg(sold_to_list_pc) as average_sold_to_list_pc,
        percentile_cont(0.5) within group (order by sold_to_list_pc) as median_sold_to_list_pc,
        avg(sold_vs_list_pc) as average_sold_vs_list_pc,
        percentile_cont(0.5) within group (order by sold_vs_list_pc) as median_sold_vs_list_pc
    from filtered_sales
)
select
    s.closed_transactions,
    round(coalesce(s.transaction_volume_usd, 0), 2),
    s.listing_sides,
    round(coalesce(s.listing_volume_usd, 0), 2),
    s.selling_sides,
    round(coalesce(s.selling_volume_usd, 0), 2),
    s.both_sides,
    (s.listing_sides + s.selling_sides)::bigint,
    round(coalesce(s.listing_volume_usd, 0) + coalesce(s.selling_volume_usd, 0), 2),
    case
        when s.closed_transactions = 0 then null
        else round(((s.listing_sides + s.selling_sides)::numeric / (s.closed_transactions::numeric * 2)) * 100, 2)
    end,
    case
        when s.closed_transactions = 0 then null
        else round((s.both_sides::numeric / s.closed_transactions::numeric) * 100, 2)
    end,
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

grant execute on function public.closed_sales_agency_report_summary(
    date, date, text, text, text, text, text, text
) to anon, authenticated;
