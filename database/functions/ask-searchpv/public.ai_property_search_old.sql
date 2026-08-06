CREATE OR REPLACE FUNCTION public.ai_property_search(p_statuses text[] DEFAULT ARRAY['active'::text], p_geography_entity_kys bigint[] DEFAULT NULL::bigint[], p_property_type_cds text[] DEFAULT NULL::text[], p_market_segments text[] DEFAULT NULL::text[], p_min_price numeric DEFAULT NULL::numeric, p_max_price numeric DEFAULT NULL::numeric, p_min_beds numeric DEFAULT NULL::numeric, p_max_beds numeric DEFAULT NULL::numeric, p_min_baths numeric DEFAULT NULL::numeric, p_max_baths numeric DEFAULT NULL::numeric, p_min_sqft numeric DEFAULT NULL::numeric, p_max_sqft numeric DEFAULT NULL::numeric, p_min_sqm numeric DEFAULT NULL::numeric, p_max_sqm numeric DEFAULT NULL::numeric, p_min_lot_sqft numeric DEFAULT NULL::numeric, p_max_lot_sqft numeric DEFAULT NULL::numeric, p_min_lot_sqm numeric DEFAULT NULL::numeric, p_max_lot_sqm numeric DEFAULT NULL::numeric, p_min_year_built integer DEFAULT NULL::integer, p_max_year_built integer DEFAULT NULL::integer, p_max_dom integer DEFAULT NULL::integer, p_primary_view text DEFAULT NULL::text, p_secondary_view text DEFAULT NULL::text, p_pre_construction boolean DEFAULT NULL::boolean, p_sold_date_from date DEFAULT NULL::date, p_sold_date_to date DEFAULT NULL::date, p_search_text text DEFAULT NULL::text, p_sort text DEFAULT 'relevance'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(status_cd text, lstng_ky bigint, prprty_ky bigint, mls bigint, address text, development_name text, zone_name text, area_name text, community_name text, property_type text, property_type_cd text, market_type text, market_segment text, pre_construction boolean, beds numeric, baths numeric, sqft numeric, sqm numeric, lot_sqft numeric, lot_sqm numeric, original_price numeric, list_price numeric, sold_price numeric, price_per_sqft numeric, price_per_sqm numeric, dom integer, year_built integer, primary_view text, secondary_view text, latitude numeric, longitude numeric, building_name text, unit_id text, snapshot_date date, sold_date date, data_current_as_of text, href text, total_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'geo', 'pg_temp'
AS $function$
WITH normalized_parameters AS
(
    SELECT
        CASE
            WHEN p_statuses IS NULL
              OR CARDINALITY(p_statuses) = 0
            THEN ARRAY['active']::text[]

            ELSE ARRAY
            (
                SELECT DISTINCT
                    LOWER(TRIM(status_value))

                FROM UNNEST(p_statuses) AS status_value

                WHERE NULLIF(TRIM(status_value), '') IS NOT NULL

                  AND LOWER(TRIM(status_value)) IN
                      (
                          'active',
                          'pending',
                          'closed'
                      )
            )
        END AS statuses,

        CASE
            WHEN p_limit IS NULL
            THEN 20

            ELSE LEAST
            (
                50,
                GREATEST(1, p_limit)
            )
        END AS result_limit,

        CASE
            WHEN p_offset IS NULL
            THEN 0

            ELSE GREATEST(0, p_offset)
        END AS result_offset,

        LOWER
        (
            COALESCE
            (
                NULLIF(TRIM(p_sort), ''),
                'relevance'
            )
        ) AS sort_cd,

        NULLIF
        (
            TRIM(p_search_text),
            ''
        ) AS search_text
),


/* ============================================================
   Resolve requested geo.entity keys to canonical names.

   Canonical English is preferred when available.
   ============================================================ */

requested_geographies AS
(
    SELECT
        e.entity_ky,
        e.entity_type_cd,

        COALESCE
        (
            canonical_variant.entity_name,
            e.entity_identifier_cd
        ) AS canonical_name

    FROM geo.entity AS e

    LEFT JOIN LATERAL
    (
        SELECT
            ev.entity_variant_nm AS entity_name

        FROM geo.entity_variant AS ev

        WHERE ev.entity_ky = e.entity_ky
          AND ev.variant_type_cd = 'CA'

        ORDER BY
            CASE
                WHEN ev.language_cd = 'EN' THEN 1
                WHEN ev.language_cd = 'ES' THEN 2
                ELSE 3
            END,

            ev.entity_variant_ky

        LIMIT 1
    ) AS canonical_variant
        ON TRUE

    WHERE p_geography_entity_kys IS NOT NULL
      AND CARDINALITY(p_geography_entity_kys) > 0
      AND e.entity_ky = ANY(p_geography_entity_kys)
),


/* ============================================================
   Normalize Active, Pending, and Closed into a common shape.
   ============================================================ */

unified_listings AS
(
    /* --------------------------------------------------------
       Active
       -------------------------------------------------------- */

    SELECT
        'active'::text                   AS status_cd,

        a.lstng_ky,
        a.prprty_ky,
        a.mls,

        a.address,
        a.development_name,
        a.zone_name,
        a.area_name,
        a.community_name,

        a.prprty_type                    AS property_type,
        a.prprty_type_cd                 AS property_type_cd,

        a.market_type,
        a.market_segment,

        (
            a.market_segment = 'pre_construction'
        )                               AS pre_construction,

        a.beds,
        a.baths,

        a.sqft,
        a.sqm,

        a.lot_sqft,
        a.lot_sqm,

        a.original_price,
        a.current_price                  AS list_price,
        NULL::numeric                    AS sold_price,

        a.price_per_sqft,
        a.price_per_sqm,

        a.dom,
        a.year_blt_dt                    AS year_built,

        a.prmy_view_nm                   AS primary_view,
        a.scndry_view_nm                 AS secondary_view,

        a.lat_nb                         AS latitude,
        a.long_nb                        AS longitude,

        a.bldng_ds                       AS building_name,
        a.unit_id,

        a.snapshot_date,
        NULL::date                       AS sold_date,

        a.data_current_as_of::text,

        NULL::text                       AS href,

        a.current_price                  AS effective_price

    FROM public.active_listing AS a

    CROSS JOIN normalized_parameters AS np

    WHERE 'active' = ANY(np.statuses)


    UNION ALL


    /* --------------------------------------------------------
       Pending
       -------------------------------------------------------- */

    SELECT
        'pending'::text                  AS status_cd,

        p.lstng_ky,
        p.prprty_ky,
        p.mls,

        p.address,
        p.development_name,
        p.zone_name,
        p.area_name,
        p.community_name,

        p.prprty_type                    AS property_type,
        p.prprty_type_cd                 AS property_type_cd,

        p.market_type,
        p.market_segment,

        (
            p.market_segment = 'pre_construction'
        )                               AS pre_construction,

        p.beds,
        p.baths,

        p.sqft,
        p.sqm,

        p.lot_sqft,
        p.lot_sqm,

        p.original_price,
        p.current_price                  AS list_price,
        NULL::numeric                    AS sold_price,

        p.price_per_sqft,
        p.price_per_sqm,

        p.dom,
        p.year_blt_dt                    AS year_built,

        p.prmy_view_nm                   AS primary_view,
        p.scndry_view_nm                 AS secondary_view,

        p.lat_nb                         AS latitude,
        p.long_nb                        AS longitude,

        p.bldng_ds                       AS building_name,
        p.unit_id,

        p.snapshot_date,
        NULL::date                       AS sold_date,

        p.data_current_as_of::text,

        NULL::text                       AS href,

        p.current_price                  AS effective_price

    FROM public.pending_listing AS p

    CROSS JOIN normalized_parameters AS np

    WHERE 'pending' = ANY(np.statuses)


    UNION ALL


    /* --------------------------------------------------------
       Closed

       Closed dates are restricted only when the caller supplies
       p_sold_date_from or p_sold_date_to.
       -------------------------------------------------------- */

    SELECT
        'closed'::text                   AS status_cd,

        c.lstng_ky,
        c.prprty_ky,
        c.mls,

        c.address,
        c.development_name,
        c.zone_name,
        c.area_name,
        c.community_name,

        c.prprty_type                    AS property_type,
        c.prprty_type_cd                 AS property_type_cd,

        CASE
            WHEN c.pre_construction
            THEN 'Pre-Construction'

            ELSE 'Resale'
        END                              AS market_type,

        c.market_segment,
        c.pre_construction,

        c.beds,
        c.baths,

        c.sqft,
        c.sqm,

        NULL::numeric                    AS lot_sqft,
        NULL::numeric                    AS lot_sqm,

        c.original_list_price            AS original_price,
        c.final_list_price               AS list_price,
        c.sold_price,

        c.sold_price_per_sqft            AS price_per_sqft,
        c.sold_price_per_sqm             AS price_per_sqm,

        c.days_on_market                 AS dom,
        NULL::integer                    AS year_built,

        NULL::text                       AS primary_view,
        NULL::text                       AS secondary_view,

        NULL::numeric                    AS latitude,
        NULL::numeric                    AS longitude,

        NULL::text                       AS building_name,
        NULL::text                       AS unit_id,

        c.market_snapshot_date           AS snapshot_date,
        c.sold_date,

        c.data_current_as_of::text,

        NULL::text                       AS href,

        c.sold_price                     AS effective_price

    FROM public.closed_listing AS c

    CROSS JOIN normalized_parameters AS np

    WHERE 'closed' = ANY(np.statuses)

      AND
      (
          p_sold_date_from IS NULL
          OR c.sold_date >= p_sold_date_from
      )

      AND
      (
          p_sold_date_to IS NULL
          OR c.sold_date <= p_sold_date_to
      )
),


/* ============================================================
   Apply deterministic filters.
   ============================================================ */

filtered_listings AS
(
    SELECT
        u.*

    FROM unified_listings AS u

    CROSS JOIN normalized_parameters AS np

    WHERE

        /* ----------------------------------------------------
           Geography

           Multiple geographies use OR logic.
           ---------------------------------------------------- */

        (
            p_geography_entity_kys IS NULL

            OR CARDINALITY(p_geography_entity_kys) = 0

            OR EXISTS
            (
                SELECT
                    1

                FROM requested_geographies AS rg

                WHERE
                    (
                        rg.entity_type_cd = 'ZN'

                        AND LOWER(TRIM(u.zone_name))
                            = LOWER(TRIM(rg.canonical_name))
                    )

                    OR
                    (
                        rg.entity_type_cd = 'AR'

                        AND LOWER(TRIM(u.area_name))
                            = LOWER(TRIM(rg.canonical_name))
                    )

                    OR
                    (
                        rg.entity_type_cd = 'CM'

                        AND LOWER(TRIM(u.community_name))
                            = LOWER(TRIM(rg.canonical_name))
                    )

                    OR
                    (
                        rg.entity_type_cd = 'DV'

                        AND LOWER(TRIM(u.development_name))
                            = LOWER(TRIM(rg.canonical_name))
                    )

                    OR
                    (
                        rg.entity_type_cd = 'BD'

                        AND LOWER(TRIM(u.building_name))
                            = LOWER(TRIM(rg.canonical_name))
                    )
            )
        )


        /* ----------------------------------------------------
           Free-text search

           Supports:
           - Exact MLS number
           - Partial address
           - Partial development name
           - Partial building name
           - Partial unit
           - Partial community
           - Partial area
           - Partial zone
           ---------------------------------------------------- */

        AND
        (
            np.search_text IS NULL

            OR u.mls::text = np.search_text

            OR COALESCE(u.address, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.development_name, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.building_name, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.unit_id, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.community_name, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.area_name, '')
                ILIKE '%' || np.search_text || '%'

            OR COALESCE(u.zone_name, '')
                ILIKE '%' || np.search_text || '%'
        )


        /* ----------------------------------------------------
           Property type
           ---------------------------------------------------- */

        AND
        (
            p_property_type_cds IS NULL

            OR CARDINALITY(p_property_type_cds) = 0

            OR EXISTS
            (
                SELECT
                    1

                FROM UNNEST(p_property_type_cds)
                    AS requested_property_type(property_type_cd)

                WHERE LOWER(TRIM(u.property_type_cd))
                    = LOWER
                    (
                        TRIM
                        (
                            requested_property_type.property_type_cd
                        )
                    )
            )
        )


        /* ----------------------------------------------------
           Market segment
           ---------------------------------------------------- */

        AND
        (
            p_market_segments IS NULL

            OR CARDINALITY(p_market_segments) = 0

            OR EXISTS
            (
                SELECT
                    1

                FROM UNNEST(p_market_segments)
                    AS requested_market_segment(market_segment)

                WHERE LOWER(TRIM(u.market_segment))
                    = LOWER
                    (
                        TRIM
                        (
                            requested_market_segment.market_segment
                        )
                    )
            )
        )


        AND
        (
            p_pre_construction IS NULL
            OR u.pre_construction = p_pre_construction
        )


        /* ----------------------------------------------------
           Price

           Active/Pending use current list price.
           Closed uses sold price.
           ---------------------------------------------------- */

        AND
        (
            p_min_price IS NULL
            OR u.effective_price >= p_min_price
        )

        AND
        (
            p_max_price IS NULL
            OR u.effective_price <= p_max_price
        )


        /* ----------------------------------------------------
           Bedrooms and bathrooms
           ---------------------------------------------------- */

        AND
        (
            p_min_beds IS NULL
            OR u.beds >= p_min_beds
        )

        AND
        (
            p_max_beds IS NULL
            OR u.beds <= p_max_beds
        )

        AND
        (
            p_min_baths IS NULL
            OR u.baths >= p_min_baths
        )

        AND
        (
            p_max_baths IS NULL
            OR u.baths <= p_max_baths
        )


        /* ----------------------------------------------------
           Interior size
           ---------------------------------------------------- */

        AND
        (
            p_min_sqft IS NULL
            OR u.sqft >= p_min_sqft
        )

        AND
        (
            p_max_sqft IS NULL
            OR u.sqft <= p_max_sqft
        )

        AND
        (
            p_min_sqm IS NULL
            OR u.sqm >= p_min_sqm
        )

        AND
        (
            p_max_sqm IS NULL
            OR u.sqm <= p_max_sqm
        )


        /* ----------------------------------------------------
           Lot size

           Closed rows do not currently expose lot size and
           therefore do not match lot-size filters.
           ---------------------------------------------------- */

        AND
        (
            p_min_lot_sqft IS NULL
            OR u.lot_sqft >= p_min_lot_sqft
        )

        AND
        (
            p_max_lot_sqft IS NULL
            OR u.lot_sqft <= p_max_lot_sqft
        )

        AND
        (
            p_min_lot_sqm IS NULL
            OR u.lot_sqm >= p_min_lot_sqm
        )

        AND
        (
            p_max_lot_sqm IS NULL
            OR u.lot_sqm <= p_max_lot_sqm
        )


        /* ----------------------------------------------------
           Year built

           Closed rows do not currently expose year built and
           therefore do not match year-built filters.
           ---------------------------------------------------- */

        AND
        (
            p_min_year_built IS NULL
            OR u.year_built >= p_min_year_built
        )

        AND
        (
            p_max_year_built IS NULL
            OR u.year_built <= p_max_year_built
        )


        /* ----------------------------------------------------
           Days on market
           ---------------------------------------------------- */

        AND
        (
            p_max_dom IS NULL
            OR u.dom <= p_max_dom
        )


        /* ----------------------------------------------------
           Views

           Contains matching supports values such as:
           "Sea View/Mar"
           ---------------------------------------------------- */

        AND
        (
            p_primary_view IS NULL

            OR LOWER(COALESCE(u.primary_view, ''))
                LIKE
                '%' || LOWER(TRIM(p_primary_view)) || '%'
        )

        AND
        (
            p_secondary_view IS NULL

            OR LOWER(COALESCE(u.secondary_view, ''))
                LIKE
                '%' || LOWER(TRIM(p_secondary_view)) || '%'
        )
),


counted_listings AS
(
    SELECT
        f.*,
        COUNT(*) OVER () AS total_count

    FROM filtered_listings AS f
)


SELECT
    c.status_cd,

    c.lstng_ky,
    c.prprty_ky,
    c.mls,

    c.address,
    c.development_name,
    c.zone_name,
    c.area_name,
    c.community_name,

    c.property_type,
    c.property_type_cd,

    c.market_type,
    c.market_segment,
    c.pre_construction,

    c.beds,
    c.baths,

    c.sqft,
    c.sqm,

    c.lot_sqft,
    c.lot_sqm,

    c.original_price,
    c.list_price,
    c.sold_price,

    c.price_per_sqft,
    c.price_per_sqm,

    c.dom,
    c.year_built,

    c.primary_view,
    c.secondary_view,

    c.latitude,
    c.longitude,

    c.building_name,
    c.unit_id,

    c.snapshot_date,
    c.sold_date,

    c.data_current_as_of,

    c.href,

    c.total_count

FROM counted_listings AS c

CROSS JOIN normalized_parameters AS np

ORDER BY

    /* --------------------------------------------------------
       Explicit sort options
       -------------------------------------------------------- */

    CASE
        WHEN np.sort_cd = 'price_asc'
        THEN c.effective_price
    END ASC NULLS LAST,

    CASE
        WHEN np.sort_cd = 'price_desc'
        THEN c.effective_price
    END DESC NULLS LAST,

    CASE
        WHEN np.sort_cd = 'dom_asc'
        THEN c.dom
    END ASC NULLS LAST,

    CASE
        WHEN np.sort_cd = 'dom_desc'
        THEN c.dom
    END DESC NULLS LAST,

    CASE
        WHEN np.sort_cd = 'sqft_desc'
        THEN c.sqft
    END DESC NULLS LAST,

    CASE
        WHEN np.sort_cd = 'newest'
        THEN COALESCE(c.sold_date, c.snapshot_date)
    END DESC NULLS LAST,


    /* --------------------------------------------------------
       Text-search relevance

       Applied when sort is relevance and search text exists.

       Rank:
       1. Exact MLS number
       2. Exact development name
       3. Exact building name
       4. Exact address
       5. Partial field match
       -------------------------------------------------------- */

    CASE
        WHEN np.sort_cd = 'relevance'
         AND np.search_text IS NOT NULL
        THEN
            CASE
                WHEN c.mls::text = np.search_text
                THEN 1

                WHEN LOWER(TRIM(COALESCE(c.development_name, '')))
                   = LOWER(np.search_text)
                THEN 2

                WHEN LOWER(TRIM(COALESCE(c.building_name, '')))
                   = LOWER(np.search_text)
                THEN 3

                WHEN LOWER(TRIM(COALESCE(c.address, '')))
                   = LOWER(np.search_text)
                THEN 4

                ELSE 5
            END
    END ASC NULLS LAST,


    /* --------------------------------------------------------
       Default status preference
       -------------------------------------------------------- */

    CASE c.status_cd
        WHEN 'active'  THEN 1
        WHEN 'pending' THEN 2
        WHEN 'closed'  THEN 3
        ELSE 4
    END,


    COALESCE
    (
        c.sold_date,
        c.snapshot_date
    ) DESC NULLS LAST,

    c.mls DESC

LIMIT
    (
        SELECT
            result_limit

        FROM normalized_parameters
    )

OFFSET
    (
        SELECT
            result_offset

        FROM normalized_parameters
    );
$function$
