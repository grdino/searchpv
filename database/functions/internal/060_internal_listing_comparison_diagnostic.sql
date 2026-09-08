/*
  SearchPV Comparable Selection Diagnostic v1

  Purpose
  -------
  Read-only listing comparison RPC for one MLS subject.

  Example:
    select *
    from public.internal_listing_comparison_diagnostic(44568, 5);

  The installed function only reads comparison data; it does not mutate it.

  Important design rules
  ----------------------
  - Price is reported but NEVER used to select or score a comparable.
  - Resale and pre-construction are not mixed.
  - Condos and houses are not mixed.
  - Missing attributes are unknown, not false.
  - Closed candidates use 12 months normally and may expand to 18 months.
  - Floor is intentionally excluded.
  - The Xalli override is temporary diagnostic configuration, not the final
    canonical geography design.
*/

create or replace function public.internal_listing_comparison_diagnostic(
  p_mls bigint,
  p_candidate_limit integer default 5
)
returns table (
  subject_mls bigint,
  comparison_section text,
  diagnostic_rank bigint,
  comp_mls bigint,
  comp_status text,
  similarity_score numeric,
  match_quality text,
  primary_geography_reason text,
  comp_development_name text,
  comp_community_name text,
  comp_area_name text,
  distance_m numeric,
  geography_points integer,
  size_points integer,
  bedroom_points integer,
  bathroom_points integer,
  feature_points integer,
  recency_points integer,
  subject_beds numeric,
  comp_beds numeric,
  subject_baths numeric,
  comp_baths numeric,
  size_difference_pct numeric,
  subject_price numeric,
  comp_price numeric,
  subject_price_per_sqm numeric,
  comp_price_per_sqm numeric,
  comp_dom integer,
  sold_date date,
  sold_to_final_list_pct numeric,
  limitation_codes text[],
  snapshot_date date,
  data_current_as_of text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
with
config as (
  select
    current_date::date as as_of_date,
    3::integer as target_comp_count,
    5::integer as expanded_comp_count,
    0.40::numeric as maximum_size_difference_ratio,
    1.00::numeric as maximum_bath_difference,
    5000::numeric as maximum_distance_m,
    18::integer as maximum_closed_months
),

/* Temporary equivalence rules used only to validate the Xalli case. */
development_group_override as (
  select *
  from (
    values
      ('puerto vallarta', 'south shore', 'sierra del mar', 'xalli',
       'pv__south_shore__xalli'),
      ('puerto vallarta', 'south shore', 'sierra del mar', 'xalli los arcos',
       'pv__south_shore__xalli'),
      ('puerto vallarta', 'south shore', 'mismaloya', 'xalli',
       'pv__south_shore__xalli'),
      ('puerto vallarta', 'south shore', 'mismaloya', 'xalli los arcos',
       'pv__south_shore__xalli')
  ) as v(zone_name, area_name, community_name, development_name,
         comparison_group_key)
),

current_inventory_raw as (
  select
    c.listing_status,
    c.lstng_ky,
    c.prprty_ky,
    c.mls,
    c.address,
    c.zone_name,
    c.area_name,
    c.community_name,
    c.development_name,
    c.prprty_type,
    c.prprty_type_cd,
    c.property_type_segment,
    c.market_segment,
    c.market_type,
    c.beds,
    l.full_bthrm_nb,
    l.half_bthrm_nb,
    case
      when l.half_bthrm_nb between 0 and 3.5
        then l.full_bthrm_nb + l.half_bthrm_nb
      else l.full_bthrm_nb
    end as bath_equivalent_nb,
    (l.half_bthrm_nb > 3.5) as bathroom_data_warning_fl,
    c.sqm,
    c.lot_sqm,
    c.original_price,
    c.current_price,
    c.price_per_sqm,
    c.dom,
    p.lat_nb,
    p.long_nb,
    c.furnished_cd,
    c.preconstruction_fl,
    case
      when c.beachfront_fl is true
        or c.oceanfront_fl is true
        or c.waterfront_fl is true
        then true
      when c.beachfront_fl is false
        and c.oceanfront_fl is false
        and c.waterfront_fl is false
        then false
      else null
    end as waterfront_beachfront_fl,
    c.ocean_view_fl,
    c.pool_fl,
    c.parking_fl,
    c.hoa_monthly_mxn_amt,
    c.hoa_monthly_usd_amt,
    c.snapshot_date,
    c.data_current_as_of,
    case
      when dgo.comparison_group_key is not null
        then dgo.comparison_group_key
      when nullif(trim(c.development_name), '') is not null
        then concat_ws('__',
          lower(trim(c.zone_name)),
          lower(trim(c.area_name)),
          lower(trim(c.community_name)),
          lower(trim(c.development_name))
        )
      else null
    end as comparison_group_key
  from public.current_search_listing c
  join dw.lstng l
    on l.lstng_ky = c.lstng_ky
  join dw.prprty p
    on p.prprty_ky = c.prprty_ky
  left join development_group_override dgo
    on lower(trim(c.zone_name)) = dgo.zone_name
   and lower(trim(c.area_name)) = dgo.area_name
   and lower(trim(c.community_name)) = dgo.community_name
   and lower(trim(c.development_name)) = dgo.development_name
  where c.current_price > 0
    and c.sqm > 0
    and p.lat_nb between -90 and 90
    and p.long_nb between -180 and 180
),

/* Prevent the same physical property from appearing more than once. */
current_inventory as (
  select *
  from (
    select
      cir.*,
      row_number() over (
        partition by cir.prprty_ky
        order by
          case cir.listing_status when 'active' then 1 else 2 end,
          cir.lstng_ky desc
      ) as property_listing_rank
    from current_inventory_raw cir
  ) ranked
  where property_listing_rank = 1
),

subjects as (
  select *
  from current_inventory
  where mls = p_mls
),

closed_inventory_raw as (
  select
    cl.clsd_sale_ky,
    cl.lstng_ky,
    cl.prprty_ky,
    cl.mls,
    cl.address,
    cl.zone_name,
    cl.area_name,
    cl.community_name,
    cl.development_name,
    cl.prprty_type,
    cl.prprty_type_cd,
    cl.property_type_segment,
    cl.market_segment,
    cl.beds,
    l.full_bthrm_nb,
    l.half_bthrm_nb,
    case
      when l.half_bthrm_nb between 0 and 3.5
        then l.full_bthrm_nb + l.half_bthrm_nb
      else l.full_bthrm_nb
    end as bath_equivalent_nb,
    (l.half_bthrm_nb > 3.5) as bathroom_data_warning_fl,
    cl.sqm,
    null::numeric as lot_sqm,
    cl.original_list_price,
    cl.final_list_price,
    cl.sold_price,
    cl.sold_price_per_sqm,
    cl.sold_to_final_list_pct,
    cl.days_on_market,
    cl.sold_date,
    p.lat_nb,
    p.long_nb,
    attr.furnished_cd,
    (cl.pre_construction is true) as preconstruction_fl,
    case
      when attr.beachfront_fl is true
        or attr.oceanfront_fl is true
        or attr.waterfront_fl is true
        then true
      when attr.beachfront_fl is false
        and attr.oceanfront_fl is false
        and attr.waterfront_fl is false
        then false
      else null
    end as waterfront_beachfront_fl,
    attr.ocean_view_fl,
    attr.pool_fl,
    attr.parking_fl,
    attr.hoa_monthly_mxn_amt,
    attr.hoa_monthly_usd_amt,
    (attr.lstng_ky is not null) as attribute_record_available_fl,
    cl.data_current_as_of,
    case
      when dgo.comparison_group_key is not null
        then dgo.comparison_group_key
      when nullif(trim(cl.development_name), '') is not null
        then concat_ws('__',
          lower(trim(cl.zone_name)),
          lower(trim(cl.area_name)),
          lower(trim(cl.community_name)),
          lower(trim(cl.development_name))
        )
      else null
    end as comparison_group_key
  from public.closed_listing cl
  join dw.lstng l
    on l.lstng_ky = cl.lstng_ky
  join dw.prprty p
    on p.prprty_ky = cl.prprty_ky
  left join dw.lstng_search_attribute attr
    on attr.lstng_ky = cl.lstng_ky
  left join development_group_override dgo
    on lower(trim(cl.zone_name)) = dgo.zone_name
   and lower(trim(cl.area_name)) = dgo.area_name
   and lower(trim(cl.community_name)) = dgo.community_name
   and lower(trim(cl.development_name)) = dgo.development_name
  cross join config cfg
  where cl.sold_date >= cfg.as_of_date - make_interval(months => cfg.maximum_closed_months)
    and cl.sold_price > 0
    and cl.sqm > 0
    and p.lat_nb between -90 and 90
    and p.long_nb between -180 and 180
),

/* Keep only the most recent closed transaction for a physical property. */
closed_inventory as (
  select *
  from (
    select
      cir.*,
      row_number() over (
        partition by cir.prprty_ky
        order by cir.sold_date desc, cir.clsd_sale_ky desc
      ) as property_sale_rank
    from closed_inventory_raw cir
  ) ranked
  where property_sale_rank = 1
),

current_candidate_measure as (
  select
    s.mls as subject_mls,
    s.prprty_ky as subject_prprty_ky,
    s.development_name as subject_development_name,
    s.community_name as subject_community_name,
    s.area_name as subject_area_name,
    s.current_price as subject_price,
    s.price_per_sqm as subject_price_per_sqm,
    s.sqm as subject_sqm,
    s.beds as subject_beds,
    s.bath_equivalent_nb as subject_baths,
    s.bathroom_data_warning_fl as subject_bathroom_warning,
    c.mls as comp_mls,
    c.prprty_ky as comp_prprty_ky,
    c.listing_status as comp_status,
    c.development_name as comp_development_name,
    c.community_name as comp_community_name,
    c.area_name as comp_area_name,
    c.current_price as comp_price,
    c.price_per_sqm as comp_price_per_sqm,
    c.sqm as comp_sqm,
    c.beds as comp_beds,
    c.bath_equivalent_nb as comp_baths,
    c.dom as comp_dom,
    c.bathroom_data_warning_fl as comp_bathroom_warning,
    abs(c.sqm - s.sqm) / nullif(s.sqm, 0) as size_difference_ratio,
    c.beds - s.beds as bedroom_difference,
    abs(c.bath_equivalent_nb - s.bath_equivalent_nb) as bath_difference,
    2 * 6371000 * asin(
      least(1::numeric, sqrt(
        power(sin(radians((c.lat_nb - s.lat_nb)::double precision) / 2), 2)
        + cos(radians(s.lat_nb::double precision))
        * cos(radians(c.lat_nb::double precision))
        * power(sin(radians((c.long_nb - s.long_nb)::double precision) / 2), 2)
      ))
    ) as distance_m,
    (c.comparison_group_key = s.comparison_group_key) as same_comparison_group,
    (
      lower(trim(c.development_name)) = lower(trim(s.development_name))
      and lower(trim(c.community_name)) = lower(trim(s.community_name))
    ) as same_raw_development,
    (lower(trim(c.community_name)) = lower(trim(s.community_name))) as same_community,
    (lower(trim(c.area_name)) = lower(trim(s.area_name))) as same_area,
    s.furnished_cd as subject_furnished,
    c.furnished_cd as comp_furnished,
    s.waterfront_beachfront_fl as subject_waterfront,
    c.waterfront_beachfront_fl as comp_waterfront,
    s.ocean_view_fl as subject_ocean_view,
    c.ocean_view_fl as comp_ocean_view,
    s.pool_fl as subject_pool,
    c.pool_fl as comp_pool,
    s.parking_fl as subject_parking,
    c.parking_fl as comp_parking,
    s.snapshot_date,
    s.data_current_as_of
  from subjects s
  join current_inventory c
    on c.property_type_segment = s.property_type_segment
   and c.market_segment = s.market_segment
   and c.prprty_ky <> s.prprty_ky
  cross join config cfg
  where abs(c.beds - s.beds) <= 1
    and abs(c.sqm - s.sqm) / nullif(s.sqm, 0)
        <= cfg.maximum_size_difference_ratio
    and (
      s.bathroom_data_warning_fl
      or c.bathroom_data_warning_fl
      or abs(c.bath_equivalent_nb - s.bath_equivalent_nb)
          <= cfg.maximum_bath_difference
    )
    and (
      lower(trim(c.area_name)) = lower(trim(s.area_name))
      or 2 * 6371000 * asin(
        least(1::numeric, sqrt(
          power(sin(radians((c.lat_nb - s.lat_nb)::double precision) / 2), 2)
          + cos(radians(s.lat_nb::double precision))
          * cos(radians(c.lat_nb::double precision))
          * power(sin(radians((c.long_nb - s.long_nb)::double precision) / 2), 2)
        ))
      ) <= cfg.maximum_distance_m
    )
),

current_scored as (
  select
    m.*,
    case
      when same_comparison_group and distance_m <= 750 then 40
      when same_raw_development and distance_m <= 750 then 35
      when distance_m <= 250 then 28
      when same_community and distance_m <= 1000 then 25
      when distance_m <= 1000 then 20
      when same_community then 18
      when distance_m <= 3000 then 14
      when same_area then 8
      else 4
    end as geography_points,
    case
      when size_difference_ratio <= 0.10 then 25
      when size_difference_ratio <= 0.20 then 20
      when size_difference_ratio <= 0.30 then 12
      else 5
    end as size_points,
    case when bedroom_difference = 0 then 15 else 5 end as bedroom_points,
    case
      when subject_bathroom_warning or comp_bathroom_warning then 0
      when bath_difference <= 0.5 then 10
      when bath_difference <= 1.0 then 5
      else 0
    end as bathroom_points,
    case
      when subject_bathroom_warning or comp_bathroom_warning then 0
      else 10
    end as bathroom_available_points,
    (
      case when subject_furnished is not null and comp_furnished is not null then 2 else 0 end
      + case when subject_waterfront is not null and comp_waterfront is not null then 2 else 0 end
      + case when subject_ocean_view is not null and comp_ocean_view is not null then 2 else 0 end
      + case when subject_pool is not null and comp_pool is not null then 2 else 0 end
      + case when subject_parking is not null and comp_parking is not null then 2 else 0 end
    ) as feature_available_points,
    (
      case when subject_furnished is not null and comp_furnished is not null
                 and subject_furnished = comp_furnished then 2 else 0 end
      + case when subject_waterfront is not null and comp_waterfront is not null
                 and subject_waterfront = comp_waterfront then 2 else 0 end
      + case when subject_ocean_view is not null and comp_ocean_view is not null
                 and subject_ocean_view = comp_ocean_view then 2 else 0 end
      + case when subject_pool is not null and comp_pool is not null
                 and subject_pool = comp_pool then 2 else 0 end
      + case when subject_parking is not null and comp_parking is not null
                 and subject_parking = comp_parking then 2 else 0 end
    ) as feature_points
  from current_candidate_measure m
),

current_ranked as (
  select
    scored.*,
    round(
      100.0 * (
        geography_points + size_points + bedroom_points
        + bathroom_points + feature_points
      ) / nullif(
        40 + 25 + 15 + bathroom_available_points + feature_available_points,
        0
      ),
      1
    ) as similarity_score,
    row_number() over (
      partition by subject_mls
      order by
        /* Use +/- 1 bedroom only to fill a shortage of exact-bedroom comps. */
        case when bedroom_difference = 0 then 0 else 1 end,
        100.0 * (
          geography_points + size_points + bedroom_points
          + bathroom_points + feature_points
        ) / nullif(
          40 + 25 + 15 + bathroom_available_points + feature_available_points,
          0
        ) desc,
        distance_m,
        comp_mls
    ) as diagnostic_rank
  from current_scored scored
),

closed_candidate_measure as (
  select
    s.mls as subject_mls,
    s.prprty_ky as subject_prprty_ky,
    s.development_name as subject_development_name,
    s.community_name as subject_community_name,
    s.area_name as subject_area_name,
    s.current_price as subject_price,
    s.price_per_sqm as subject_price_per_sqm,
    s.sqm as subject_sqm,
    s.beds as subject_beds,
    s.bath_equivalent_nb as subject_baths,
    s.bathroom_data_warning_fl as subject_bathroom_warning,
    c.mls as comp_mls,
    c.prprty_ky as comp_prprty_ky,
    'closed'::text as comp_status,
    c.development_name as comp_development_name,
    c.community_name as comp_community_name,
    c.area_name as comp_area_name,
    c.sold_price as comp_price,
    c.sold_price_per_sqm as comp_price_per_sqm,
    c.sqm as comp_sqm,
    c.beds as comp_beds,
    c.bath_equivalent_nb as comp_baths,
    c.days_on_market as comp_dom,
    c.bathroom_data_warning_fl as comp_bathroom_warning,
    c.sold_date,
    c.sold_to_final_list_pct,
    abs(c.sqm - s.sqm) / nullif(s.sqm, 0) as size_difference_ratio,
    c.beds - s.beds as bedroom_difference,
    abs(c.bath_equivalent_nb - s.bath_equivalent_nb) as bath_difference,
    2 * 6371000 * asin(
      least(1::numeric, sqrt(
        power(sin(radians((c.lat_nb - s.lat_nb)::double precision) / 2), 2)
        + cos(radians(s.lat_nb::double precision))
        * cos(radians(c.lat_nb::double precision))
        * power(sin(radians((c.long_nb - s.long_nb)::double precision) / 2), 2)
      ))
    ) as distance_m,
    (c.comparison_group_key = s.comparison_group_key) as same_comparison_group,
    (
      lower(trim(c.development_name)) = lower(trim(s.development_name))
      and lower(trim(c.community_name)) = lower(trim(s.community_name))
    ) as same_raw_development,
    (lower(trim(c.community_name)) = lower(trim(s.community_name))) as same_community,
    (lower(trim(c.area_name)) = lower(trim(s.area_name))) as same_area,
    s.furnished_cd as subject_furnished,
    c.furnished_cd as comp_furnished,
    s.waterfront_beachfront_fl as subject_waterfront,
    c.waterfront_beachfront_fl as comp_waterfront,
    s.ocean_view_fl as subject_ocean_view,
    c.ocean_view_fl as comp_ocean_view,
    s.pool_fl as subject_pool,
    c.pool_fl as comp_pool,
    s.parking_fl as subject_parking,
    c.parking_fl as comp_parking,
    c.attribute_record_available_fl,
    s.snapshot_date,
    s.data_current_as_of
  from subjects s
  join closed_inventory c
    on c.property_type_segment = s.property_type_segment
   and c.market_segment = s.market_segment
   and c.prprty_ky <> s.prprty_ky
  cross join config cfg
  where abs(c.beds - s.beds) <= 1
    and abs(c.sqm - s.sqm) / nullif(s.sqm, 0)
        <= cfg.maximum_size_difference_ratio
    and (
      s.bathroom_data_warning_fl
      or c.bathroom_data_warning_fl
      or abs(c.bath_equivalent_nb - s.bath_equivalent_nb)
          <= cfg.maximum_bath_difference
    )
    and (
      lower(trim(c.area_name)) = lower(trim(s.area_name))
      or 2 * 6371000 * asin(
        least(1::numeric, sqrt(
          power(sin(radians((c.lat_nb - s.lat_nb)::double precision) / 2), 2)
          + cos(radians(s.lat_nb::double precision))
          * cos(radians(c.lat_nb::double precision))
          * power(sin(radians((c.long_nb - s.long_nb)::double precision) / 2), 2)
        ))
      ) <= cfg.maximum_distance_m
    )
),

closed_scored as (
  select
    m.*,
    case
      when same_comparison_group and distance_m <= 750 then 35
      when same_raw_development and distance_m <= 750 then 31
      when distance_m <= 250 then 25
      when same_community and distance_m <= 1000 then 22
      when distance_m <= 1000 then 18
      when same_community then 15
      when distance_m <= 3000 then 12
      when same_area then 7
      else 3
    end as geography_points,
    case
      when size_difference_ratio <= 0.10 then 25
      when size_difference_ratio <= 0.20 then 20
      when size_difference_ratio <= 0.30 then 12
      else 5
    end as size_points,
    case when bedroom_difference = 0 then 15 else 5 end as bedroom_points,
    case
      when subject_bathroom_warning or comp_bathroom_warning then 0
      when bath_difference <= 0.5 then 10
      when bath_difference <= 1.0 then 5
      else 0
    end as bathroom_points,
    case
      when subject_bathroom_warning or comp_bathroom_warning then 0
      else 10
    end as bathroom_available_points,
    (
      case
        when sold_date >= (select as_of_date - interval '6 months' from config) then 5
        when sold_date >= (select as_of_date - interval '12 months' from config) then 3
        else 1
      end
    ) as recency_points,
    (
      case when subject_furnished is not null and comp_furnished is not null then 2 else 0 end
      + case when subject_waterfront is not null and comp_waterfront is not null then 2 else 0 end
      + case when subject_ocean_view is not null and comp_ocean_view is not null then 2 else 0 end
      + case when subject_pool is not null and comp_pool is not null then 2 else 0 end
      + case when subject_parking is not null and comp_parking is not null then 2 else 0 end
    ) as feature_available_points,
    (
      case when subject_furnished is not null and comp_furnished is not null
                 and subject_furnished = comp_furnished then 2 else 0 end
      + case when subject_waterfront is not null and comp_waterfront is not null
                 and subject_waterfront = comp_waterfront then 2 else 0 end
      + case when subject_ocean_view is not null and comp_ocean_view is not null
                 and subject_ocean_view = comp_ocean_view then 2 else 0 end
      + case when subject_pool is not null and comp_pool is not null
                 and subject_pool = comp_pool then 2 else 0 end
      + case when subject_parking is not null and comp_parking is not null
                 and subject_parking = comp_parking then 2 else 0 end
    ) as feature_points
  from closed_candidate_measure m
),

closed_with_score as (
  select
    scored.*,
    round(
      100.0 * (
        geography_points + size_points + bedroom_points
        + bathroom_points + feature_points + recency_points
      ) / nullif(
        35 + 25 + 15 + bathroom_available_points
        + feature_available_points + 5,
        0
      ),
      1
    ) as similarity_score
  from closed_scored scored
),

closed_with_context as (
  select
    cws.*,
    count(*) filter (
      where bedroom_difference = 0
        and sold_date >= (select as_of_date - interval '12 months' from config)
        and similarity_score >= 75
    ) over (partition by subject_mls) as credible_exact_12mo_count
  from closed_with_score cws
),

closed_ranked as (
  select
    scored.*,
    row_number() over (
      partition by subject_mls
      order by
        /* Exact bedrooms precede relaxed-bedroom candidates. */
        case when bedroom_difference = 0 then 0 else 1 end,
        /*
          Enforce the normal 12-month pool only when it already contains at
          least three good, exact-bedroom choices. Otherwise allow a stronger
          13-18-month sale to compete on similarity.
        */
        case
          when credible_exact_12mo_count >= 3
            and sold_date < (select as_of_date - interval '12 months' from config)
            then 1
          else 0
        end,
        similarity_score desc,
        sold_date desc,
        distance_m,
        comp_mls
    ) as diagnostic_rank
  from closed_with_context scored
),

diagnostic_output as (
  select
    subject_mls,
    'current_competition'::text as comparison_section,
    diagnostic_rank,
    comp_mls,
    comp_status,
    round(similarity_score, 1) as similarity_score,
    case
      when similarity_score >= 90 then 'strong'
      when similarity_score >= 75 then 'good'
      when similarity_score >= 60 then 'broader'
      else 'omit'
    end as match_quality,
    case
      when same_comparison_group and distance_m <= 750 then 'same comparison development'
      when same_raw_development and distance_m <= 750 then 'same MLS development'
      when same_raw_development and distance_m > 750
        then 'matching development name with conflicting location'
      when distance_m <= 250 then 'very nearby within 250 m'
      when same_community and distance_m <= 1000 then 'same MLS community within 1 km'
      when distance_m <= 1000 then 'nearby within 1 km'
      when same_community then 'same MLS community'
      when distance_m <= 3000 then 'nearby within 3 km'
      when same_area then 'same MLS area'
      else 'broader nearby geography'
    end as primary_geography_reason,
    comp_development_name,
    comp_community_name,
    comp_area_name,
    round(distance_m::numeric) as distance_m,
    geography_points,
    size_points,
    bedroom_points,
    bathroom_points,
    feature_points,
    null::integer as recency_points,
    subject_beds,
    comp_beds,
    subject_baths,
    comp_baths,
    round(((comp_sqm - subject_sqm) / nullif(subject_sqm, 0) * 100)::numeric, 1)
      as size_difference_pct,
    subject_price,
    comp_price,
    subject_price_per_sqm,
    comp_price_per_sqm,
    comp_dom,
    null::date as sold_date,
    null::numeric as sold_to_final_list_pct,
    array_remove(array[
      case when bedroom_difference <> 0 then 'BEDROOM_COUNT_RELAXED' end,
      case when size_difference_ratio > 0.20 then 'SIZE_BAND_RELAXED' end,
      case when same_comparison_group is not true then 'NOT_SAME_COMPARISON_DEVELOPMENT' end,
      case when same_raw_development and distance_m > 750
        then 'SAME_DEVELOPMENT_LOCATION_CONFLICT' end,
      case when not same_community then 'GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY' end,
      case when subject_bathroom_warning or comp_bathroom_warning
        then 'BATHROOM_DATA_INCONSISTENT' end,
      case when subject_ocean_view is null or comp_ocean_view is null
        then 'OCEAN_VIEW_UNKNOWN' end,
      case when comp_status = 'pending' then 'PENDING_CONTRACT_PRICE_UNAVAILABLE' end
    ], null) as limitation_codes,
    snapshot_date,
    data_current_as_of::text
  from current_ranked

  union all

  select
    subject_mls,
    'recent_sales'::text,
    diagnostic_rank,
    comp_mls,
    comp_status,
    round(similarity_score, 1),
    case
      when similarity_score >= 90 then 'strong'
      when similarity_score >= 75 then 'good'
      when similarity_score >= 60 then 'broader'
      else 'omit'
    end,
    case
      when same_comparison_group and distance_m <= 750 then 'same comparison development'
      when same_raw_development and distance_m <= 750 then 'same MLS development'
      when same_raw_development and distance_m > 750
        then 'matching development name with conflicting location'
      when distance_m <= 250 then 'very nearby within 250 m'
      when same_community and distance_m <= 1000 then 'same MLS community within 1 km'
      when distance_m <= 1000 then 'nearby within 1 km'
      when same_community then 'same MLS community'
      when distance_m <= 3000 then 'nearby within 3 km'
      when same_area then 'same MLS area'
      else 'broader nearby geography'
    end,
    comp_development_name,
    comp_community_name,
    comp_area_name,
    round(distance_m::numeric),
    geography_points,
    size_points,
    bedroom_points,
    bathroom_points,
    feature_points,
    recency_points,
    subject_beds,
    comp_beds,
    subject_baths,
    comp_baths,
    round(((comp_sqm - subject_sqm) / nullif(subject_sqm, 0) * 100)::numeric, 1),
    subject_price,
    comp_price,
    subject_price_per_sqm,
    comp_price_per_sqm,
    comp_dom,
    sold_date,
    sold_to_final_list_pct,
    array_remove(array[
      case when bedroom_difference <> 0 then 'BEDROOM_COUNT_RELAXED' end,
      case when size_difference_ratio > 0.20 then 'SIZE_BAND_RELAXED' end,
      case when same_comparison_group is not true then 'NOT_SAME_COMPARISON_DEVELOPMENT' end,
      case when same_raw_development and distance_m > 750
        then 'SAME_DEVELOPMENT_LOCATION_CONFLICT' end,
      case when not same_community then 'GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY' end,
      case when subject_bathroom_warning or comp_bathroom_warning
        then 'BATHROOM_DATA_INCONSISTENT' end,
      case when not attribute_record_available_fl then 'CLOSED_ATTRIBUTES_UNAVAILABLE' end,
      case when subject_ocean_view is null or comp_ocean_view is null
        then 'OCEAN_VIEW_UNKNOWN' end,
      case when sold_date < (select as_of_date - interval '12 months' from config)
        then 'CLOSED_PERIOD_EXPANDED_TO_18_MONTHS' end
    ], null),
    snapshot_date,
    data_current_as_of::text
  from closed_ranked
)

/*
  Return the first 10 candidates per subject/section for tuning. The eventual
  public product will normally show 3 and optionally expand to 5.
*/
select *
from diagnostic_output
where diagnostic_rank <= greatest(1, least(coalesce(p_candidate_limit, 5), 10))
order by subject_mls, comparison_section, diagnostic_rank
$function$;

revoke all on function public.internal_listing_comparison_diagnostic(bigint, integer)
  from public;

grant execute on function public.internal_listing_comparison_diagnostic(bigint, integer)
  to authenticated;

grant execute on function public.internal_listing_comparison_diagnostic(bigint, integer)
  to anon;
