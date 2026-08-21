create or replace function public.geography_entity_boundary_map(
    p_entity_ky bigint
)
returns jsonb
language sql
stable
security definer
set search_path to 'public', 'geo', 'dw', 'internal'
as $function$

with community_entity as
(
    select
        cm.entity_ky,

        cm_name.entity_variant_nm as community_nm,

        ar.entity_ky as area_entity_ky,
        ar_name.entity_variant_nm as area_nm,

        zn.entity_ky as zone_entity_ky,
        zn_name.entity_variant_nm as zone_nm

    from geo.entity cm

    join geo.entity_variant cm_name
      on cm_name.entity_ky = cm.entity_ky
     and cm_name.variant_type_cd = 'CA'

    join geo.entity_relationship cm_rel
      on cm_rel.child_entity_ky = cm.entity_ky
     and cm_rel.relationship_type_cd = 'CB'

    join geo.entity ar
      on ar.entity_ky = cm_rel.parent_entity_ky
     and ar.entity_type_cd = 'AR'

    join geo.entity_variant ar_name
      on ar_name.entity_ky = ar.entity_ky
     and ar_name.variant_type_cd = 'CA'

    join geo.entity_relationship ar_rel
      on ar_rel.child_entity_ky = ar.entity_ky
     and ar_rel.relationship_type_cd = 'CB'

    join geo.entity zn
      on zn.entity_ky = ar_rel.parent_entity_ky
     and zn.entity_type_cd = 'ZN'

    join geo.entity_variant zn_name
      on zn_name.entity_ky = zn.entity_ky
     and zn_name.variant_type_cd = 'CA'

    where cm.entity_ky = p_entity_ky
      and cm.entity_type_cd = 'CM'

    limit 1
),

observations as
(
    /* Current Active + Pending */

    select
        l.lstng_ky,
        p.prprty_ky,

        'CURRENT'::text as observation_source,

        p.long_nb,
        p.lat_nb

    from community_entity ce

    join dw.prprty p
      on upper(trim(p.zone_ds))
       = upper(trim(ce.zone_nm))

     and upper(trim(p.area_ds))
       = upper(trim(ce.area_nm))

     and upper(trim(p.cmnty_ds))
       = upper(trim(ce.community_nm))

    join dw.lstng l
      on l.prprty_ky = p.prprty_ky

    where upper(trim(l.stts_cd)) in
    (
        'ACTIVE',
        'A',
        'PENDING',
        'P'
    )

      and p.long_nb is not null
      and p.lat_nb is not null


    union all


    /* Closed Sales - last 3 years */

    select
        cs.lstng_ky,
        cs.prprty_ky,

        'CLOSED'::text as observation_source,

        cs.long_nb,
        cs.lat_nb

    from community_entity ce

    join internal.closed_sales_detail cs

      on upper(trim(cs.zone_nm))
       = upper(trim(ce.zone_nm))

     and upper(trim(cs.area_nm))
       = upper(trim(ce.area_nm))

     and upper(trim(cs.community_nm))
       = upper(trim(ce.community_nm))

    where cs.sold_dt >= current_date - interval '3 years'

      and cs.long_nb is not null
      and cs.lat_nb is not null
),

candidate_boundaries as
(
    select
        r.entity_ky,

        r.boundary_rank_nb,

        r.boundary_ky,
        r.boundary_nm,
        r.boundary_type_cd,

        r.listing_ct,
        r.total_listing_ct,

        r.listing_pc,
        r.cumulative_listing_pc,

        r.selected_fl,

        b.geometry

    from geo.v_entity_boundary_review r

    join geo.boundary b
      on b.boundary_ky = r.boundary_ky

    where r.entity_ky = p_entity_ky
),

saved_boundaries as
(
    select
        eb.boundary_ky
    from geo.entity_boundary eb
    where eb.entity_ky = p_entity_ky
),

/* ============================================================
   Geographic extent of the MLS observations.

   Expand the observation envelope slightly so nearby government
   polygons are available for manual map selection.
   ============================================================ */

observation_extent as
(
    select
        ST_Expand(
            ST_Envelope(
                ST_Collect(
                    ST_SetSRID(
                        ST_MakePoint(
                            o.long_nb,
                            o.lat_nb
                        ),
                        4326
                    )
                )
            ),
            0.015
        ) as geometry

    from observations o
),

/* ============================================================
   All government boundaries near the MLS observations.

   These are NOT automatically candidates. They are supplied
   only so the maintenance UI can display and manually select
   additional government polygons.
   ============================================================ */

nearby_boundaries as
(
    select
        b.boundary_ky,
        b.boundary_nm,
        b.boundary_type_cd,
        b.geometry

    from geo.boundary b

    cross join observation_extent oe

    where oe.geometry is not null

      and ST_Intersects(
          b.geometry,
          oe.geometry
      )
)

select jsonb_build_object
(
    'entity',

    (
        select jsonb_build_object
        (
            'entityKy',
            ce.entity_ky,

            'zoneName',
            ce.zone_nm,

            'areaName',
            ce.area_nm,

            'communityName',
            ce.community_nm
        )

        from community_entity ce
    ),

    'boundaries',

    coalesce
    (
        (
            select jsonb_agg
            (
                jsonb_build_object
                (
                    'boundaryKy',
                    cb.boundary_ky,

                    'boundaryName',
                    cb.boundary_nm,

                    'boundaryType',
                    cb.boundary_type_cd,

                    'rank',
                    cb.boundary_rank_nb,

                    'listingCount',
                    cb.listing_ct,

                    'totalListingCount',
                    cb.total_listing_ct,

                    'listingPercent',
                    cb.listing_pc,

                    'cumulativeListingPercent',
                    cb.cumulative_listing_pc,

                    'selected',
                    exists
                    (
                        select 1
                        from saved_boundaries sb
                        where sb.boundary_ky = cb.boundary_ky
                    ),

                    'geometry',
                    ST_AsGeoJSON(cb.geometry)::jsonb
                )

                order by cb.boundary_rank_nb
            )

            from candidate_boundaries cb
        ),

        '[]'::jsonb
    ),

    'nearbyBoundaries',

    coalesce
    (
        (
            select jsonb_agg
            (
                jsonb_build_object
                (
                    'boundaryKy',
                    nb.boundary_ky,

                    'boundaryName',
                    nb.boundary_nm,

                    'boundaryType',
                    nb.boundary_type_cd,

                    'selected',
                    exists
                    (
                        select 1
                        from saved_boundaries sb
                        where sb.boundary_ky = nb.boundary_ky
                    ),

                    'geometry',
                    ST_AsGeoJSON(nb.geometry)::jsonb
                )

                order by
                    nb.boundary_nm,
                    nb.boundary_ky
            )

            from nearby_boundaries nb
        ),

        '[]'::jsonb
    ),

    'propertyPoints',

    coalesce
    (
        (
            select jsonb_agg
            (
                jsonb_build_object
                (
                    'listingKy',
                    o.lstng_ky,

                    'propertyKy',
                    o.prprty_ky,

                    'source',
                    o.observation_source,

                    'longitude',
                    o.long_nb,

                    'latitude',
                    o.lat_nb
                )

                order by
                    o.observation_source,
                    o.lstng_ky
            )

            from observations o
        ),

        '[]'::jsonb
    )
);

$function$;