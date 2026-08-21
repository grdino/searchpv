create or replace view public.geography_unmapped_boundary_audit as

with observations as (

    /*
     * Current Active / Pending observations
     */
    select
        l.lstng_ky,
        p.prprty_ky,
        p.zone_ds,
        p.area_ds,
        p.cmnty_ds,

        st_setsrid(
            st_makepoint(
                p.long_nb::double precision,
                p.lat_nb::double precision
            ),
            4326
        ) as property_point

    from dw.lstng l

    join dw.prprty p
      on p.prprty_ky = l.prprty_ky

    where
        upper(trim(l.stts_cd)) in (
            'ACTIVE',
            'A',
            'PENDING',
            'P'
        )

        and p.long_nb is not null
        and p.lat_nb is not null

        and p.cmnty_ds is not null
        and trim(p.cmnty_ds) <> ''

    union all

    /*
     * Recent Closed observations
     */
    select
        cs.lstng_ky,
        cs.prprty_ky,
        cs.zone_nm as zone_ds,
        cs.area_nm as area_ds,
        cs.community_nm as cmnty_ds,

        st_setsrid(
            st_makepoint(
                cs.long_nb::double precision,
                cs.lat_nb::double precision
            ),
            4326
        ) as property_point

    from internal.closed_sales_detail cs

    where
        cs.sold_dt >= current_date - interval '3 years'

        and cs.long_nb is not null
        and cs.lat_nb is not null

        and cs.community_nm is not null
        and trim(cs.community_nm) <> ''
),

unmapped_boundaries as (

    /*
     * Government polygons with NO current MLS-community
     * footprint relationship.
     */
    select
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.municipality_nm,
        b.district_nm,
        b.geometry

    from geo.boundary b

    where
        upper(trim(b.boundary_type_cd)) in (
            'COLONIA',
            'FRACCIONAMIENTO',
            'ZONA HOTELERA',
            'COMUNIDAD RESIDENCIAL'
        )

        and not exists (
            select 1
            from geo.entity_boundary eb
            join geo.entity e
              on e.entity_ky = eb.entity_ky
            where
                eb.boundary_ky = b.boundary_ky
                and e.entity_type_cd = 'CM'
        )
),

boundary_hits as (

    select
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.municipality_nm,
        b.district_nm,

        o.zone_ds,
        o.area_ds,
        o.cmnty_ds,

        count(*) as observation_ct

    from unmapped_boundaries b

    left join observations o
      on b.geometry && o.property_point
     and st_covers(
            b.geometry,
            o.property_point
         )

    group by
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.municipality_nm,
        b.district_nm,

        o.zone_ds,
        o.area_ds,
        o.cmnty_ds
),

boundary_totals as (

    select
        boundary_ky,

        sum(observation_ct) as total_observation_ct,

        count(*) filter (
            where cmnty_ds is not null
        ) as candidate_community_ct

    from boundary_hits

    group by boundary_ky
),

ranked as (

    select
        bh.*,

        bt.total_observation_ct,
        bt.candidate_community_ct,

        case
            when bh.cmnty_ds is null then null

            else round(
                bh.observation_ct::numeric
                /
                nullif(
                    bt.total_observation_ct,
                    0
                )::numeric
                * 100,
                2
            )
        end as observation_pc,

        row_number() over (
            partition by bh.boundary_ky

            order by
                bh.observation_ct desc,
                bh.cmnty_ds
        ) as candidate_rank_nb

    from boundary_hits bh

    join boundary_totals bt
      on bt.boundary_ky = bh.boundary_ky
)

select
    boundary_ky,
    boundary_nm,
    boundary_type_cd,
    municipality_nm,
    district_nm,

    zone_ds,
    area_ds,
    cmnty_ds,

    candidate_rank_nb,

    observation_ct,
    total_observation_ct,
    observation_pc,

    candidate_community_ct,

    case

        when total_observation_ct = 0
            then 'NO MLS OBSERVATIONS'

        when candidate_community_ct = 1
            then 'SINGLE COMMUNITY'

        when candidate_rank_nb = 1
             and observation_pc >= 90
            then 'STRONG PRIMARY COMMUNITY'

        when candidate_rank_nb = 1
             and observation_pc >= 70
            then 'LIKELY PRIMARY COMMUNITY'

        else 'MULTIPLE COMMUNITIES'

    end as audit_status

from ranked;

-- ********************************
-- Find candidates to Fix ---
-- ********************************
select *
from public.geography_unmapped_boundary_audit
where candidate_rank_nb = 1
order by
    case audit_status
        when 'SINGLE COMMUNITY' then 1
        when 'STRONG PRIMARY COMMUNITY' then 2
        when 'LIKELY PRIMARY COMMUNITY' then 3
        when 'MULTIPLE COMMUNITIES' then 4
        when 'NO MLS OBSERVATIONS' then 5
        else 6
    end,
    boundary_nm;


select *
from public.geography_unmapped_boundary_audit
order by
    boundary_nm,
    candidate_rank_nb;