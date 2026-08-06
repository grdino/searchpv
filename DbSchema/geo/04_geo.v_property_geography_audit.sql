create or replace view geo.v_property_geography_audit as

with approved_boundaries as
(
    select
        bem.boundary_entity_match_ky,
        bem.boundary_ky,
        bem.entity_ky as spv_entity_ky,
        bem.review_status_cd,
        bem.match_method_cd,
        bem.confidence_nb,
        bem.reviewed_by_tx,
        bem.reviewed_dt,

        b.boundary_nm,
        b.boundary_normalized_nm,
        b.municipality_nm,
        b.geometry,

        e.entity_identifier_cd as spv_entity_identifier_cd,
        e.entity_type_cd as spv_entity_type_cd,

        canonical_variant.entity_variant_nm as spv_community_nm

    from geo.boundary_entity_match bem

    join geo.boundary b
        on b.boundary_ky = bem.boundary_ky

    join geo.entity e
        on e.entity_ky = bem.entity_ky

    left join lateral
    (
        select
            ev.entity_variant_nm
        from geo.entity_variant ev
        where ev.entity_ky = bem.entity_ky
        order by
            case ev.variant_type_cd
                when 'CA' then 1
                when 'ML' then 2
                when 'CO' then 3
                else 4
            end,
            ev.entity_variant_nm
        limit 1
    ) canonical_variant
        on true

    where bem.review_status_cd in
    (
        'AUTO_APPROVE',
        'MANUAL_APPROVE'
    )
      and e.entity_type_cd = 'CM'
      and bem.entity_ky is not null
),

property_base as
(
    select
        p.prprty_ky,
        p.prprty_fngrprnt_id,

        p.zone_ds as mls_zone_nm,
        p.area_ds as mls_area_nm,
        p.cmnty_ds as mls_community_nm,
        p.dvlpmnt_ds as mls_development_nm,
        p.bldng_ds as mls_building_nm,

        p.tax_id,
        p.adrs_ds,
        p.unit_id,
        p.prprty_type,

        p.lat_nb,
        p.long_nb,

        case
            when p.lat_nb is null
              or p.long_nb is null
                then false

            when p.lat_nb::numeric not between -90 and 90
              or p.long_nb::numeric not between -180 and 180
                then false

            else true
        end as has_valid_coordinates,

        case
            when p.lat_nb is not null
             and p.long_nb is not null
             and p.lat_nb::numeric between -90 and 90
             and p.long_nb::numeric between -180 and 180
            then
                st_setsrid
                (
                    st_makepoint
                    (
                        p.long_nb::double precision,
                        p.lat_nb::double precision
                    ),
                    4326
                )
            else null
        end as property_geometry

    from dw.prprty p
),

spatial_hits as
(
    select
        p.prprty_ky,

        ab.boundary_ky,
        ab.boundary_nm,
        ab.boundary_normalized_nm,
        ab.municipality_nm,

        ab.spv_entity_ky,
        ab.spv_entity_identifier_cd,
        ab.spv_community_nm,

        ab.review_status_cd,
        ab.match_method_cd,
        ab.confidence_nb,
        ab.reviewed_by_tx,
        ab.reviewed_dt,

        exists
        (
            select 1
            from geo.entity_variant ev
            where ev.entity_ky = ab.spv_entity_ky
              and regexp_replace
                  (
                      upper(trim(ev.entity_variant_nm)),
                      '[^A-Z0-9ÁÉÍÓÚÜÑ]+',
                      '',
                      'g'
                  )
                  =
                  regexp_replace
                  (
                      upper(trim(p.mls_community_nm)),
                      '[^A-Z0-9ÁÉÍÓÚÜÑ]+',
                      '',
                      'g'
                  )
        ) as mls_community_matches_spv

    from property_base p

    join approved_boundaries ab
        on p.has_valid_coordinates
       and st_covers
           (
               ab.geometry,
               p.property_geometry
           )
),

property_match_summary as
(
    select
        p.prprty_ky,

        count(sh.boundary_ky) as approved_boundary_count,

        min(sh.boundary_ky)
            filter
            (
                where sh.boundary_ky is not null
            ) as single_boundary_ky,

        min(sh.spv_entity_ky)
            filter
            (
                where sh.spv_entity_ky is not null
            ) as single_spv_entity_ky,

        min(sh.spv_entity_identifier_cd)
            filter
            (
                where sh.spv_entity_identifier_cd is not null
            ) as single_spv_entity_identifier_cd,

        min(sh.spv_community_nm)
            filter
            (
                where sh.spv_community_nm is not null
            ) as single_spv_community_nm,

        bool_or(sh.mls_community_matches_spv)
            filter
            (
                where sh.boundary_ky is not null
            ) as mls_community_matches_spv,

        jsonb_agg
        (
            jsonb_build_object
            (
                'boundary_ky', sh.boundary_ky,
                'boundary_nm', sh.boundary_nm,
                'spv_entity_ky', sh.spv_entity_ky,
                'spv_entity_identifier_cd',
                    sh.spv_entity_identifier_cd,
                'spv_community_nm', sh.spv_community_nm,
                'review_status_cd', sh.review_status_cd,
                'match_method_cd', sh.match_method_cd,
                'confidence_nb', sh.confidence_nb
            )
            order by sh.boundary_ky
        )
        filter
        (
            where sh.boundary_ky is not null
        ) as approved_boundary_matches_js

    from property_base p

    left join spatial_hits sh
        on sh.prprty_ky = p.prprty_ky

    group by
        p.prprty_ky
)

select
    p.prprty_ky,
    p.prprty_fngrprnt_id,

    p.adrs_ds,
    p.unit_id,
    p.tax_id,
    p.prprty_type,

    p.lat_nb,
    p.long_nb,
    p.has_valid_coordinates,

    p.mls_zone_nm,
    p.mls_area_nm,
    p.mls_community_nm,
    p.mls_development_nm,
    p.mls_building_nm,

    s.approved_boundary_count,

    case
        when s.approved_boundary_count = 1
            then s.single_boundary_ky
        else null
    end as boundary_ky,

    case
        when s.approved_boundary_count = 1
            then s.single_spv_entity_ky
        else null
    end as spv_entity_ky,

    case
        when s.approved_boundary_count = 1
            then s.single_spv_entity_identifier_cd
        else null
    end as spv_entity_identifier_cd,

    case
        when s.approved_boundary_count = 1
            then s.single_spv_community_nm
        else null
    end as spv_community_nm,

    case
        when s.approved_boundary_count = 1
            then s.mls_community_matches_spv
        else null
    end as mls_community_matches_spv,

    s.approved_boundary_matches_js,

    case
        when not p.has_valid_coordinates
            then 'MISSING_COORDINATES'

        when s.approved_boundary_count = 0
            then 'NO_APPROVED_BOUNDARY'

        when s.approved_boundary_count > 1
            then 'MULTIPLE_APPROVED_BOUNDARIES'

        when s.mls_community_matches_spv is true
            then 'MATCH'

        else 'MISMATCH'
    end as audit_status_cd

from property_base p

join property_match_summary s
    on s.prprty_ky = p.prprty_ky;