-- SearchPV internal reporting security and RPC functions

create table if not exists internal.authorized_user (
    email_address text primary key,
    display_name text,
    active_fl boolean not null default true,
    created_ts timestamptz not null default now()
);

insert into internal.authorized_user (email_address, display_name)
values ('gerry@ronmorgan.net', 'Gerry Ray')
on conflict (email_address) do nothing;

revoke all on internal.authorized_user from anon, authenticated;

create or replace function internal.current_user_is_authorized()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
    select exists (
        select 1
        from internal.authorized_user u
        where lower(u.email_address) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and u.active_fl
    );
$$;

revoke all on function internal.current_user_is_authorized() from public;


create or replace function public.internal_report_access()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
    select internal.current_user_is_authorized();
$$;

grant execute on function public.internal_report_access() to authenticated;
revoke execute on function public.internal_report_access() from anon;

create or replace function public.internal_closed_sales_kpis(
    p_start_date date,
    p_end_date date,
    p_zone_nm text default null,
    p_area_nm text default null,
    p_community_nm text default null,
    p_development_nm text default null,
    p_property_type_ds text default null,
    p_market_type_nm text default null
)
returns table (
    closed_transactions bigint,
    transaction_volume_usd numeric,
    listing_sides bigint,
    selling_sides bigint,
    both_sides bigint,
    total_sides bigint,
    listing_volume_usd numeric,
    selling_volume_usd numeric,
    total_side_volume_usd numeric,
    side_capture_rate numeric,
    both_sides_rate numeric,
    average_sale_price_usd numeric,
    median_sale_price_usd numeric,
    average_dom numeric,
    median_dom numeric,
    average_sold_to_list_pc numeric,
    median_sold_to_list_pc numeric
)
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
with f as (
    select d.*
    from internal.closed_sales_detail d
    where internal.current_user_is_authorized()
      and d.sold_dt between p_start_date and p_end_date
      and (p_zone_nm is null or d.zone_nm = p_zone_nm)
      and (p_area_nm is null or d.area_nm = p_area_nm)
      and (p_community_nm is null or d.community_nm = p_community_nm)
      and (p_development_nm is null or d.development_nm = p_development_nm)
      and (p_property_type_ds is null or d.property_type_ds = p_property_type_ds)
      and (p_market_type_nm is null or d.market_type_nm = p_market_type_nm)
)
select
    count(*)::bigint,
    coalesce(sum(sold_price_usd), 0),
    count(*) filter (where listing_agency_nm is not null)::bigint,
    count(*) filter (where selling_agency_nm is not null)::bigint,
    count(*) filter (
        where listing_agency_nm is not null
          and selling_agency_nm is not null
          and lower(listing_agency_nm) = lower(selling_agency_nm)
    )::bigint,
    (count(*) filter (where listing_agency_nm is not null)
      + count(*) filter (where selling_agency_nm is not null))::bigint,
    coalesce(sum(sold_price_usd) filter (where listing_agency_nm is not null), 0),
    coalesce(sum(sold_price_usd) filter (where selling_agency_nm is not null), 0),
    coalesce(sum(sold_price_usd) filter (where listing_agency_nm is not null), 0)
      + coalesce(sum(sold_price_usd) filter (where selling_agency_nm is not null), 0),
    case when count(*) = 0 then 0 else round(
      ((count(*) filter (where listing_agency_nm is not null)
      + count(*) filter (where selling_agency_nm is not null))::numeric
      / (count(*) * 2)::numeric) * 100, 2) end,
    case when count(*) = 0 then 0 else round(
      (count(*) filter (
        where listing_agency_nm is not null
          and selling_agency_nm is not null
          and lower(listing_agency_nm) = lower(selling_agency_nm)
      )::numeric / count(*)::numeric) * 100, 2) end,
    avg(sold_price_usd),
    (percentile_cont(0.5) within group (order by sold_price_usd))::numeric,
    avg(dom_nb),
    (percentile_cont(0.5) within group (order by dom_nb))::numeric,
    avg(sold_to_list_pc),
    (percentile_cont(0.5) within group (order by sold_to_list_pc))::numeric
from f;
$$;

grant execute on function public.internal_closed_sales_kpis(date,date,text,text,text,text,text,text) to authenticated;
revoke execute on function public.internal_closed_sales_kpis(date,date,text,text,text,text,text,text) from anon;

create or replace function public.internal_closed_sales_filter_options(
    p_start_date date,
    p_end_date date,
    p_zone_nm text default null,
    p_area_nm text default null,
    p_community_nm text default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
with f as (
    select d.*
    from internal.closed_sales_detail d
    where internal.current_user_is_authorized()
      and d.sold_dt between p_start_date and p_end_date
),
zone_values as (
    select distinct zone_nm as value from f where zone_nm is not null
),
area_values as (
    select distinct area_nm as value from f
    where area_nm is not null and (p_zone_nm is null or zone_nm = p_zone_nm)
),
community_values as (
    select distinct community_nm as value from f
    where community_nm is not null
      and (p_zone_nm is null or zone_nm = p_zone_nm)
      and (p_area_nm is null or area_nm = p_area_nm)
),
development_values as (
    select distinct development_nm as value from f
    where development_nm is not null
      and (p_zone_nm is null or zone_nm = p_zone_nm)
      and (p_area_nm is null or area_nm = p_area_nm)
      and (p_community_nm is null or community_nm = p_community_nm)
),
property_values as (
    select distinct property_type_ds as value from f where property_type_ds is not null
),
market_values as (
    select distinct market_type_nm as value from f where market_type_nm is not null
)
select jsonb_build_object(
    'zones', coalesce((select jsonb_agg(value order by value) from zone_values), '[]'::jsonb),
    'areas', coalesce((select jsonb_agg(value order by value) from area_values), '[]'::jsonb),
    'communities', coalesce((select jsonb_agg(value order by value) from community_values), '[]'::jsonb),
    'developments', coalesce((select jsonb_agg(value order by value) from development_values), '[]'::jsonb),
    'propertyTypes', coalesce((select jsonb_agg(value order by value) from property_values), '[]'::jsonb),
    'marketTypes', coalesce((select jsonb_agg(value order by value) from market_values), '[]'::jsonb)
);
$$;

grant execute on function public.internal_closed_sales_filter_options(date,date,text,text,text) to authenticated;
revoke execute on function public.internal_closed_sales_filter_options(date,date,text,text,text) from anon;

create or replace function public.internal_closed_sales_by_agency(
    p_start_date date,
    p_end_date date,
    p_zone_nm text default null,
    p_area_nm text default null,
    p_community_nm text default null,
    p_development_nm text default null,
    p_property_type_ds text default null,
    p_market_type_nm text default null
)
returns table (
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
    side_capture_rate numeric,
    both_sides_rate numeric,
    average_sale_price_usd numeric,
    median_sale_price_usd numeric,
    average_dom numeric,
    median_dom numeric,
    average_sold_to_list_pc numeric,
    median_sold_to_list_pc numeric
)
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
with f as (
    select d.*
    from internal.closed_sales_detail d
    where internal.current_user_is_authorized()
      and d.sold_dt between p_start_date and p_end_date
      and (p_zone_nm is null or d.zone_nm = p_zone_nm)
      and (p_area_nm is null or d.area_nm = p_area_nm)
      and (p_community_nm is null or d.community_nm = p_community_nm)
      and (p_development_nm is null or d.development_nm = p_development_nm)
      and (p_property_type_ds is null or d.property_type_ds = p_property_type_ds)
      and (p_market_type_nm is null or d.market_type_nm = p_market_type_nm)
), agency_sales as (
    select
      x.agency_nm,
      f.clsd_sale_ky,
      max(f.sold_price_usd) as sold_price_usd,
      max(f.dom_nb) as dom_nb,
      max(f.sold_to_list_pc) as sold_to_list_pc,
      bool_or(x.side_cd = 'LISTING') as listing_fl,
      bool_or(x.side_cd = 'SELLING') as selling_fl
    from f
    cross join lateral (values
      (f.listing_agency_nm, 'LISTING'::text),
      (f.selling_agency_nm, 'SELLING'::text)
    ) x(agency_nm, side_cd)
    where x.agency_nm is not null
    group by x.agency_nm, f.clsd_sale_ky
)
select
    agency_nm,
    count(*)::bigint,
    sum(sold_price_usd),
    count(*) filter (where listing_fl)::bigint,
    sum(sold_price_usd) filter (where listing_fl),
    count(*) filter (where selling_fl)::bigint,
    sum(sold_price_usd) filter (where selling_fl),
    count(*) filter (where listing_fl and selling_fl)::bigint,
    (count(*) filter (where listing_fl) + count(*) filter (where selling_fl))::bigint,
    coalesce(sum(sold_price_usd) filter (where listing_fl),0)
      + coalesce(sum(sold_price_usd) filter (where selling_fl),0),
    round(((count(*) filter (where listing_fl) + count(*) filter (where selling_fl))::numeric
      / nullif((count(*) * 2)::numeric,0)) * 100, 2),
    round((count(*) filter (where listing_fl and selling_fl)::numeric
      / nullif(count(*)::numeric,0)) * 100, 2),
    avg(sold_price_usd),
    (percentile_cont(0.5) within group (order by sold_price_usd))::numeric,
    avg(dom_nb),
    (percentile_cont(0.5) within group (order by dom_nb))::numeric,
    avg(sold_to_list_pc),
    (percentile_cont(0.5) within group (order by sold_to_list_pc))::numeric
from agency_sales
group by agency_nm
order by total_side_volume_usd desc, agency_nm;
$$;

grant execute on function public.internal_closed_sales_by_agency(date,date,text,text,text,text,text,text) to authenticated;
revoke execute on function public.internal_closed_sales_by_agency(date,date,text,text,text,text,text,text) from anon;

create or replace function public.internal_closed_sales_by_agent(
    p_start_date date,
    p_end_date date,
    p_credit_method text default 'split',
    p_zone_nm text default null,
    p_area_nm text default null,
    p_community_nm text default null,
    p_development_nm text default null,
    p_property_type_ds text default null,
    p_market_type_nm text default null
)
returns table (
    agent_nm text,
    agency_nm text,
    closed_transactions bigint,
    transaction_volume_usd numeric,
    listing_sides numeric,
    listing_volume_usd numeric,
    selling_sides numeric,
    selling_volume_usd numeric,
    both_sides bigint,
    total_sides numeric,
    total_side_volume_usd numeric,
    side_capture_rate numeric,
    both_sides_rate numeric,
    average_sale_price_usd numeric,
    median_sale_price_usd numeric,
    average_dom numeric,
    median_dom numeric,
    average_sold_to_list_pc numeric,
    median_sold_to_list_pc numeric
)
language sql
stable
security definer
set search_path = pg_catalog, internal, auth
as $$
with p as (
    select x.*,
      case
        when lower(p_credit_method) = 'split' then x.allocated_side_credit
        else x.participation_count
      end as credit_side,
      case
        when lower(p_credit_method) = 'split' then x.allocated_volume_usd
        else x.participating_volume_usd
      end as credit_volume
    from internal.closed_agent_participation x
    where internal.current_user_is_authorized()
      and x.sold_dt between p_start_date and p_end_date
      and (p_zone_nm is null or x.zone_nm = p_zone_nm)
      and (p_area_nm is null or x.area_nm = p_area_nm)
      and (p_community_nm is null or x.community_nm = p_community_nm)
      and (p_development_nm is null or x.development_nm = p_development_nm)
      and (p_property_type_ds is null or x.property_type_ds = p_property_type_ds)
      and (p_market_type_nm is null or x.market_type_nm = p_market_type_nm)
      and (lower(p_credit_method) <> 'primary' or x.agent_role_cd = 'PRIMARY')
), agent_sales as (
    select
      agent_nm,
      agency_nm,
      clsd_sale_ky,
      max(sold_price_usd) as sold_price_usd,
      max(dom_nb) as dom_nb,
      max(sold_to_list_pc) as sold_to_list_pc,
      sum(credit_side) filter (where transaction_side_cd = 'LISTING') as listing_credit,
      sum(credit_volume) filter (where transaction_side_cd = 'LISTING') as listing_volume,
      sum(credit_side) filter (where transaction_side_cd = 'SELLING') as selling_credit,
      sum(credit_volume) filter (where transaction_side_cd = 'SELLING') as selling_volume,
      bool_or(transaction_side_cd = 'LISTING') as listing_fl,
      bool_or(transaction_side_cd = 'SELLING') as selling_fl
    from p
    group by agent_nm, agency_nm, clsd_sale_ky
)
select
    agent_nm,
    agency_nm,
    count(*)::bigint,
    sum(sold_price_usd),
    coalesce(sum(listing_credit),0),
    coalesce(sum(listing_volume),0),
    coalesce(sum(selling_credit),0),
    coalesce(sum(selling_volume),0),
    count(*) filter (where listing_fl and selling_fl)::bigint,
    coalesce(sum(listing_credit),0) + coalesce(sum(selling_credit),0),
    coalesce(sum(listing_volume),0) + coalesce(sum(selling_volume),0),
    round(((coalesce(sum(listing_credit),0) + coalesce(sum(selling_credit),0))
      / nullif((count(*) * 2)::numeric,0)) * 100, 2),
    round((count(*) filter (where listing_fl and selling_fl)::numeric
      / nullif(count(*)::numeric,0)) * 100, 2),
    avg(sold_price_usd),
    (percentile_cont(0.5) within group (order by sold_price_usd))::numeric,
    avg(dom_nb),
    (percentile_cont(0.5) within group (order by dom_nb))::numeric,
    avg(sold_to_list_pc),
    (percentile_cont(0.5) within group (order by sold_to_list_pc))::numeric
from agent_sales
group by agent_nm, agency_nm
order by total_side_volume_usd desc, agent_nm;
$$;

grant execute on function public.internal_closed_sales_by_agent(date,date,text,text,text,text,text,text,text) to authenticated;
revoke execute on function public.internal_closed_sales_by_agent(date,date,text,text,text,text,text,text,text) from anon;
