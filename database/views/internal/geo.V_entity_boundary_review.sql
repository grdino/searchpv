DROP VIEW geo.v_entity_boundary_review;

  CREATE VIEW geo.v_entity_boundary_review AS

  WITH observations AS
  (
      /* =========================================================
        Current Active + Pending
        ========================================================= */

      SELECT
          l.lstng_ky,
          p.prprty_ky,
          p.zone_ds,
          p.area_ds,
          p.cmnty_ds,
          p.long_nb,
          p.lat_nb

      FROM dw.lstng l

      JOIN dw.prprty p
        ON p.prprty_ky = l.prprty_ky

      WHERE upper(trim(l.stts_cd)) IN
      (
          'ACTIVE',
          'A',
          'PENDING',
          'P'
      )

        AND p.zone_ds = 'Puerto Vallarta'

        AND p.cmnty_ds IS NOT NULL
        AND trim(p.cmnty_ds) <> ''

        AND p.long_nb IS NOT NULL
        AND p.lat_nb IS NOT NULL


      UNION ALL


      /* =========================================================
        Closed sales - last 3 years
        ========================================================= */

      SELECT
          cs.lstng_ky,
          cs.prprty_ky,
          cs.zone_nm      AS zone_ds,
          cs.area_nm      AS area_ds,
          cs.community_nm AS cmnty_ds,
          cs.long_nb,
          cs.lat_nb

      FROM internal.closed_sales_detail cs

      WHERE cs.sold_dt >= current_date - interval '3 years'

        AND cs.zone_nm = 'Puerto Vallarta'

        AND cs.community_nm IS NOT NULL
        AND trim(cs.community_nm) <> ''

        AND cs.long_nb IS NOT NULL
        AND cs.lat_nb IS NOT NULL
  ),

  community_points AS
  (
      SELECT
          o.*,

          ST_SetSRID
          (
              ST_MakePoint
              (
                  o.long_nb,
                  o.lat_nb
              ),
              4326
          ) AS property_point

      FROM observations o
  ),

  /* =============================================================
  Resolve CM -> AR -> ZN.
  ============================================================= */

  community_entities AS
  (
      SELECT
          cm.entity_ky,
          cm.entity_identifier_cd,

          cm_name.entity_variant_nm
              AS entity_community_nm,

          ar.entity_ky
              AS area_entity_ky,

          ar_name.entity_variant_nm
              AS entity_area_nm,

          zn.entity_ky
              AS zone_entity_ky,

          zn_name.entity_variant_nm
              AS entity_zone_nm

      FROM geo.entity cm

      JOIN geo.entity_variant cm_name
        ON cm_name.entity_ky = cm.entity_ky
      AND cm_name.variant_type_cd = 'CA'

      JOIN geo.entity_relationship cm_rel
        ON cm_rel.child_entity_ky = cm.entity_ky
      AND cm_rel.relationship_type_cd = 'CB'

      JOIN geo.entity ar
        ON ar.entity_ky = cm_rel.parent_entity_ky
      AND ar.entity_type_cd = 'AR'

      JOIN geo.entity_variant ar_name
        ON ar_name.entity_ky = ar.entity_ky
      AND ar_name.variant_type_cd = 'CA'

      JOIN geo.entity_relationship ar_rel
        ON ar_rel.child_entity_ky = ar.entity_ky
      AND ar_rel.relationship_type_cd = 'CB'

      JOIN geo.entity zn
        ON zn.entity_ky = ar_rel.parent_entity_ky
      AND zn.entity_type_cd = 'ZN'

      JOIN geo.entity_variant zn_name
        ON zn_name.entity_ky = zn.entity_ky
      AND zn_name.variant_type_cd = 'CA'

      WHERE cm.entity_type_cd = 'CM'
        AND zn_name.entity_variant_nm = 'Puerto Vallarta'
  ),

  /* =============================================================
  All useful names for each Community.

  CA = Canonical
  CO = Common
  AL = Alias
  ML = MLS
  ============================================================= */

  community_names AS
  (
      SELECT
          ce.entity_ky,

          geo.normalize_geography_name
          (
              ev.entity_variant_nm
          ) AS normalized_name_nm

      FROM community_entities ce

      JOIN geo.entity_variant ev
        ON ev.entity_ky = ce.entity_ky

      WHERE ev.variant_type_cd IN
      (
          'CA',
          'CO',
          'AL',
          'ML'
      )

        AND ev.entity_variant_nm IS NOT NULL
        AND trim(ev.entity_variant_nm) <> ''
  ),

  /* =============================================================
  Eligible territorial government boundaries.
  ============================================================= */

  territorial_boundaries AS
  (
      SELECT
          b.boundary_ky,
          b.boundary_nm,
          b.boundary_type_cd,
          b.geometry,

          geo.normalize_geography_name
          (
              b.boundary_nm
          ) AS normalized_boundary_nm

      FROM geo.boundary b

      WHERE upper(trim(b.boundary_type_cd)) IN
      (
          'COLONIA',
          'FRACCIONAMIENTO',
          'ZONA HOTELERA',
          'COMUNIDAD RESIDENCIAL'
      )
  ),

  entity_points AS
  (
      SELECT
          ce.entity_ky,
          ce.entity_identifier_cd,

          ce.entity_zone_nm,
          ce.entity_area_nm,
          ce.entity_community_nm,

          cp.lstng_ky,
          cp.prprty_ky,
          cp.property_point

      FROM community_points cp

      JOIN community_entities ce

        ON upper(trim(ce.entity_zone_nm))
        = upper(trim(cp.zone_ds))

      AND upper(trim(ce.entity_area_nm))
        = upper(trim(cp.area_ds))

      AND upper(trim(ce.entity_community_nm))
        = upper(trim(cp.cmnty_ds))
  ),

  entity_totals AS
  (
      SELECT
          ep.entity_ky,
          COUNT(*) AS total_listing_ct

      FROM entity_points ep

      GROUP BY ep.entity_ky
  ),

  /* =============================================================
  SOURCE 1:
  Spatial evidence.

  Which government boundaries actually contain MLS observations?
  ============================================================= */

  boundary_hits AS
  (
      SELECT
          ep.entity_ky,
          ep.lstng_ky,
          ep.prprty_ky,

          b.boundary_ky,
          b.boundary_nm,
          b.boundary_type_cd

      FROM entity_points ep

      JOIN territorial_boundaries b

        ON b.geometry && ep.property_point

      AND ST_Covers
      (
          b.geometry,
          ep.property_point
      )
  ),

  boundary_counts AS
  (
      SELECT
          bh.entity_ky,
          bh.boundary_ky,

          COUNT(*) AS listing_ct

      FROM boundary_hits bh

      GROUP BY
          bh.entity_ky,
          bh.boundary_ky
  ),

  /* =============================================================
  SOURCE 2:
  Name evidence.

  This deliberately allows:

      Adolfo Lopez Mateos
              ->
      Lopez Mateos

  even when zero MLS observations happen to fall in that polygon.

  The containment tests help with names where one contains an
  additional qualifier, while similarity handles spelling differences.
  ============================================================= */

  name_candidates AS
  (
      SELECT
          cn.entity_ky,
          b.boundary_ky,

          MAX
          (
              CASE
                  WHEN cn.normalized_name_nm =
                      b.normalized_boundary_nm
                      THEN 1.0

                  WHEN cn.normalized_name_nm LIKE
                      '%' || b.normalized_boundary_nm || '%'
                      THEN 0.95

                  WHEN b.normalized_boundary_nm LIKE
                      '%' || cn.normalized_name_nm || '%'
                      THEN 0.95

                  ELSE similarity
                  (
                      cn.normalized_name_nm,
                      b.normalized_boundary_nm
                  )
              END
          ) AS name_score_nb

      FROM community_names cn

      CROSS JOIN territorial_boundaries b

      WHERE
      (
          cn.normalized_name_nm =
              b.normalized_boundary_nm

          OR cn.normalized_name_nm LIKE
            '%' || b.normalized_boundary_nm || '%'

          OR b.normalized_boundary_nm LIKE
            '%' || cn.normalized_name_nm || '%'

          OR similarity
            (
                cn.normalized_name_nm,
                b.normalized_boundary_nm
            ) >= 0.55
      )

      GROUP BY
          cn.entity_ky,
          b.boundary_ky
  ),

  /* =============================================================
  Candidate universe.

  A boundary is included if it is:

  - spatially observed, OR
  - name matched, OR
  - already manually selected.
  ============================================================= */

  candidate_pairs AS
  (
      SELECT
          bc.entity_ky,
          bc.boundary_ky
      FROM boundary_counts bc

      UNION

      SELECT
          nc.entity_ky,
          nc.boundary_ky
      FROM name_candidates nc

      UNION

      SELECT
          eb.entity_ky,
          eb.boundary_ky
      FROM geo.entity_boundary eb

      JOIN community_entities ce
        ON ce.entity_ky = eb.entity_ky
  ),

  candidate_detail AS
  (
      SELECT
          cp.entity_ky,

          b.boundary_ky,
          b.boundary_nm,
          b.boundary_type_cd,

          COALESCE
          (
              bc.listing_ct,
              0
          ) AS listing_ct,

          COALESCE
          (
              et.total_listing_ct,
              0
          ) AS total_listing_ct,

          CASE
              WHEN COALESCE(et.total_listing_ct, 0) = 0
                  THEN 0::numeric

              ELSE ROUND
              (
                  COALESCE(bc.listing_ct, 0)::numeric
                  /
                  et.total_listing_ct::numeric
                  * 100,
                  2
              )
          END AS listing_pc,

          COALESCE
          (
              nc.name_score_nb,
              0
          ) AS name_score_nb

      FROM candidate_pairs cp

      JOIN territorial_boundaries b
        ON b.boundary_ky = cp.boundary_ky

      LEFT JOIN boundary_counts bc
        ON bc.entity_ky = cp.entity_ky
      AND bc.boundary_ky = cp.boundary_ky

      LEFT JOIN entity_totals et
        ON et.entity_ky = cp.entity_ky

      LEFT JOIN name_candidates nc
        ON nc.entity_ky = cp.entity_ky
      AND nc.boundary_ky = cp.boundary_ky
  ),

  /* =============================================================
  Rank.

  Spatial evidence remains important, but a strong name-only match
  will still appear prominently instead of disappearing completely.
  ============================================================= */

  ranked AS
  (
      SELECT
          cd.*,

          ROW_NUMBER() OVER
          (
              PARTITION BY cd.entity_ky

              ORDER BY
                  CASE
                      WHEN cd.listing_ct > 0
                          THEN 1
                      ELSE 2
                  END,

                  cd.listing_ct DESC,

                  cd.name_score_nb DESC,

                  cd.boundary_nm
          ) AS boundary_rank_nb,

          ROUND
          (
              SUM(cd.listing_pc) OVER
              (
                  PARTITION BY cd.entity_ky

                  ORDER BY
                      CASE
                          WHEN cd.listing_ct > 0
                              THEN 1
                          ELSE 2
                      END,

                      cd.listing_ct DESC,

                      cd.name_score_nb DESC,

                      cd.boundary_nm

                  ROWS BETWEEN
                      UNBOUNDED PRECEDING
                      AND CURRENT ROW
              ),
              2
          ) AS cumulative_listing_pc

      FROM candidate_detail cd
  )

  SELECT
      ce.entity_ky,
      ce.entity_identifier_cd,

      ce.entity_zone_nm
          AS zone_nm,

      ce.entity_area_nm
          AS area_nm,

      ce.entity_community_nm
          AS community_nm,

      r.boundary_rank_nb,

      r.boundary_ky,
      r.boundary_nm,
      r.boundary_type_cd,

      r.listing_ct,
      r.total_listing_ct,

      r.listing_pc,
      r.cumulative_listing_pc,

      eb.entity_boundary_ky IS NOT NULL
          AS selected_fl,
      
      r.name_score_nb,

      (r.listing_ct > 0)
          AS spatial_evidence_fl,

      (r.name_score_nb >= 0.90)
          AS name_evidence_fl,

      CASE
        WHEN r.listing_ct > 0
        AND r.name_score_nb >= 0.90
            THEN 'SPATIAL + NAME'

        WHEN r.listing_ct > 0
        AND r.name_score_nb > 0
            THEN 'SPATIAL + POSSIBLE NAME'

        WHEN r.listing_ct > 0
            THEN 'SPATIAL'

        WHEN r.name_score_nb >= 0.90
            THEN 'NAME'

        WHEN r.name_score_nb > 0
            THEN 'POSSIBLE NAME'

        ELSE 'OTHER'
    END AS evidence_cd

  FROM ranked r

  JOIN community_entities ce
    ON ce.entity_ky = r.entity_ky

  LEFT JOIN geo.entity_boundary eb
    ON eb.entity_ky = r.entity_ky
  AND eb.boundary_ky = r.boundary_ky;