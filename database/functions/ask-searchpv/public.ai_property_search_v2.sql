BEGIN;

-- ============================================================
-- Ask SearchPV property search V2
--
-- Design:
--   * Preserves the original public.ai_property_search parameters.
--   * Plans only the requested status branches.
--   * Returns a compact, stable set of common columns.
--   * Preserves every source-view column in listing_data JSONB.
--   * Leaves the existing public.ai_property_search function untouched.
--
-- Sources:
--   public.active_listing
--   public.pending_listing
--   public.closed_listing
-- ============================================================


DROP FUNCTION IF EXISTS public.ai_property_search_v2
(
    text[],
    bigint[],
    text[],
    text[],
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    integer,
    integer,
    integer,
    text,
    text,
    boolean,
    date,
    date,
    text,
    text,
    integer,
    integer
);


CREATE FUNCTION public.ai_property_search_v2
(
    p_statuses                text[]   DEFAULT ARRAY['active']::text[],
    p_geography_entity_kys    bigint[] DEFAULT NULL,
    p_property_type_cds       text[]   DEFAULT NULL,
    p_market_segments         text[]   DEFAULT NULL,

    p_min_price               numeric  DEFAULT NULL,
    p_max_price               numeric  DEFAULT NULL,

    p_min_beds                numeric  DEFAULT NULL,
    p_max_beds                numeric  DEFAULT NULL,

    p_min_baths               numeric  DEFAULT NULL,
    p_max_baths               numeric  DEFAULT NULL,

    p_min_sqft                numeric  DEFAULT NULL,
    p_max_sqft                numeric  DEFAULT NULL,

    p_min_sqm                 numeric  DEFAULT NULL,
    p_max_sqm                 numeric  DEFAULT NULL,

    p_min_lot_sqft            numeric  DEFAULT NULL,
    p_max_lot_sqft            numeric  DEFAULT NULL,

    p_min_lot_sqm             numeric  DEFAULT NULL,
    p_max_lot_sqm             numeric  DEFAULT NULL,

    p_min_year_built          integer  DEFAULT NULL,
    p_max_year_built          integer  DEFAULT NULL,

    p_max_dom                 integer  DEFAULT NULL,

    p_primary_view            text     DEFAULT NULL,
    p_secondary_view          text     DEFAULT NULL,

    p_pre_construction        boolean  DEFAULT NULL,

    p_sold_date_from          date     DEFAULT NULL,
    p_sold_date_to            date     DEFAULT NULL,

    p_search_text             text     DEFAULT NULL,

    p_sort                    text     DEFAULT 'relevance',
    p_limit                   integer  DEFAULT 20,
    p_offset                  integer  DEFAULT 0
)
RETURNS TABLE
(
    status_cd             text,

    lstng_ky              bigint,
    prprty_ky             bigint,
    mls                   bigint,

    address               text,
    development_name      text,
    zone_name             text,
    area_name             text,
    community_name        text,

    property_type         text,
    property_type_cd      text,

    market_type           text,
    market_segment        text,
    pre_construction      boolean,

    beds                  numeric,
    baths                 numeric,

    sqft                  numeric,
    sqm                   numeric,

    lot_sqft              numeric,
    lot_sqm               numeric,

    original_price        numeric,
    list_price            numeric,
    sold_price            numeric,

    price_per_sqft        numeric,
    price_per_sqm         numeric,

    dom                   integer,
    year_built            integer,

    primary_view          text,
    secondary_view        text,

    latitude              numeric,
    longitude             numeric,

    building_name         text,
    unit_id               text,

    snapshot_date         date,
    sold_date             date,

    data_current_as_of    text,
    href                  text,

    listing_data          jsonb,
    total_count           bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, geo, pg_temp
AS
$function$
DECLARE
    v_statuses       text[];
    v_search_text    text;
    v_sort           text;
    v_limit          integer;
    v_offset         integer;

    v_branches       text[] := ARRAY[]::text[];
    v_unified_sql    text;
    v_sql            text;
BEGIN
    -- --------------------------------------------------------
    -- Normalize status, search, sort and pagination parameters.
    -- --------------------------------------------------------

    SELECT ARRAY
    (
        SELECT DISTINCT LOWER(TRIM(status_value))
        FROM UNNEST
        (
            COALESCE
            (
                p_statuses,
                ARRAY['active']::text[]
            )
        ) AS status_value
        WHERE NULLIF(TRIM(status_value), '') IS NOT NULL
          AND LOWER(TRIM(status_value)) IN
              (
                  'active',
                  'pending',
                  'closed'
              )
        ORDER BY 1
    )
    INTO v_statuses;

    IF v_statuses IS NULL OR CARDINALITY(v_statuses) = 0 THEN
        v_statuses := ARRAY['active']::text[];
    END IF;

    v_search_text := NULLIF(TRIM(p_search_text), '');

    v_sort :=
        CASE LOWER(COALESCE(NULLIF(TRIM(p_sort), ''), 'relevance'))
            WHEN 'relevance'    THEN 'relevance'
            WHEN 'price_asc'    THEN 'price_asc'
            WHEN 'price_desc'   THEN 'price_desc'
            WHEN 'dom_asc'      THEN 'dom_asc'
            WHEN 'dom_desc'     THEN 'dom_desc'
            WHEN 'sqft_asc'     THEN 'sqft_asc'
            WHEN 'sqft_desc'    THEN 'sqft_desc'
            WHEN 'newest'       THEN 'newest'
            WHEN 'oldest'       THEN 'oldest'
            ELSE 'relevance'
        END;

    v_limit :=
        LEAST
        (
            50,
            GREATEST
            (
                1,
                COALESCE(p_limit, 20)
            )
        );

    v_offset :=
        GREATEST
        (
            0,
            COALESCE(p_offset, 0)
        );


    -- --------------------------------------------------------
    -- Add only the requested source branches.
    --
    -- to_jsonb(alias) preserves every column exposed by the
    -- applicable source view without widening the RPC signature.
    -- --------------------------------------------------------

    IF 'active' = ANY(v_statuses) THEN
        v_branches := ARRAY_APPEND
        (
            v_branches,
            $active$
            SELECT
                'active'::text AS status_cd,

                a.lstng_ky,
                a.prprty_ky,
                a.mls::bigint AS mls,

                a.address,
                a.development_name,
                a.zone_name,
                a.area_name,
                a.community_name,

                a.prprty_type AS property_type,
                a.prprty_type_cd AS property_type_cd,

                a.market_type,
                a.market_segment,
                (a.market_segment = 'pre_construction') AS pre_construction,

                a.beds,
                a.baths,

                a.sqft,
                a.sqm,

                a.lot_sqft,
                a.lot_sqm,

                a.original_price,
                a.current_price AS list_price,
                NULL::numeric AS sold_price,

                a.price_per_sqft,
                a.price_per_sqm,

                a.dom::integer AS dom,
                a.year_blt_dt::integer AS year_built,

                a.prmy_view_nm AS primary_view,
                a.scndry_view_nm AS secondary_view,

                a.lat_nb AS latitude,
                a.long_nb AS longitude,

                a.bldng_ds AS building_name,
                a.unit_id,

                a.snapshot_date,
                NULL::date AS sold_date,

                a.data_current_as_of::text AS data_current_as_of,
                NULL::text AS href,

                a.current_price AS effective_price,
                to_jsonb(a) AS listing_data

            FROM public.active_listing AS a
            $active$
        );
    END IF;


    IF 'pending' = ANY(v_statuses) THEN
        v_branches := ARRAY_APPEND
        (
            v_branches,
            $pending$
            SELECT
                'pending'::text AS status_cd,

                p.lstng_ky,
                p.prprty_ky,
                p.mls::bigint AS mls,

                p.address,
                p.development_name,
                p.zone_name,
                p.area_name,
                p.community_name,

                p.prprty_type AS property_type,
                p.prprty_type_cd AS property_type_cd,

                p.market_type,
                p.market_segment,
                (p.market_segment = 'pre_construction') AS pre_construction,

                p.beds,
                p.baths,

                p.sqft,
                p.sqm,

                p.lot_sqft,
                p.lot_sqm,

                p.original_price,
                p.current_price AS list_price,
                NULL::numeric AS sold_price,

                p.price_per_sqft,
                p.price_per_sqm,

                p.dom::integer AS dom,
                p.year_blt_dt::integer AS year_built,

                p.prmy_view_nm AS primary_view,
                p.scndry_view_nm AS secondary_view,

                p.lat_nb AS latitude,
                p.long_nb AS longitude,

                p.bldng_ds AS building_name,
                p.unit_id,

                p.snapshot_date,
                NULL::date AS sold_date,

                p.data_current_as_of::text AS data_current_as_of,
                NULL::text AS href,

                p.current_price AS effective_price,
                to_jsonb(p) AS listing_data

            FROM public.pending_listing AS p
            $pending$
        );
    END IF;


    IF 'closed' = ANY(v_statuses) THEN
        v_branches := ARRAY_APPEND
        (
            v_branches,
            $closed$
            SELECT
                'closed'::text AS status_cd,

                c.lstng_ky,
                c.prprty_ky,
                c.mls::bigint AS mls,

                c.address,
                c.development_name,
                c.zone_name,
                c.area_name,
                c.community_name,

                c.prprty_type AS property_type,
                c.prprty_type_cd AS property_type_cd,

                CASE
                    WHEN c.pre_construction
                        THEN 'Pre-Construction'
                    ELSE 'Resale'
                END AS market_type,

                c.market_segment,
                c.pre_construction,

                c.beds,
                c.baths,

                c.sqft,
                c.sqm,

                NULL::numeric AS lot_sqft,
                NULL::numeric AS lot_sqm,

                c.original_list_price AS original_price,
                c.final_list_price AS list_price,
                c.sold_price,

                c.sold_price_per_sqft AS price_per_sqft,
                c.sold_price_per_sqm AS price_per_sqm,

                c.days_on_market::integer AS dom,
                NULL::integer AS year_built,

                NULL::text AS primary_view,
                NULL::text AS secondary_view,

                NULL::numeric AS latitude,
                NULL::numeric AS longitude,

                NULL::text AS building_name,
                NULL::text AS unit_id,

                c.market_snapshot_date AS snapshot_date,
                c.sold_date,

                c.data_current_as_of::text AS data_current_as_of,
                NULL::text AS href,

                c.sold_price AS effective_price,
                to_jsonb(c) AS listing_data

            FROM public.closed_listing AS c

            WHERE
                (
                    $24::date IS NULL
                    OR c.sold_date >= $24::date
                )

                AND
                (
                    $25::date IS NULL
                    OR c.sold_date <= $25::date
                )
            $closed$
        );
    END IF;


    IF CARDINALITY(v_branches) = 0 THEN
        RETURN;
    END IF;

    v_unified_sql :=
        ARRAY_TO_STRING
        (
            v_branches,
            E'\n\nUNION ALL\n\n'
        );


    -- --------------------------------------------------------
    -- Apply shared filters once to the selected source branches.
    --
    -- total_count is computed from filtered_listings separately
    -- from pagination. The source views are not re-read.
    -- --------------------------------------------------------

    v_sql :=
        FORMAT
        (
            $sql$
            WITH requested_geographies AS
            (
                SELECT
                    e.entity_ky,
                    e.entity_type_cd,

                    COALESCE
                    (
                        canonical_variant.canonical_name,
                        e.entity_identifier_cd
                    ) AS canonical_name

                FROM geo.entity AS e

                LEFT JOIN LATERAL
                (
                    SELECT
                        ev.entity_variant_nm AS canonical_name

                    FROM geo.entity_variant AS ev

                    WHERE ev.entity_ky = e.entity_ky
                      AND ev.variant_type_cd = 'CA'

                    ORDER BY
                        CASE ev.language_cd
                            WHEN 'EN' THEN 1
                            WHEN 'ES' THEN 2
                            ELSE 3
                        END,
                        ev.entity_variant_ky

                    LIMIT 1
                ) AS canonical_variant
                    ON TRUE

                WHERE $1::bigint[] IS NOT NULL
                  AND CARDINALITY($1::bigint[]) > 0
                  AND e.entity_ky = ANY($1::bigint[])
            ),

            unified_listings AS
            (
                %s
            ),

            filtered_listings AS
            (
                SELECT
                    u.*,

                    CASE
                        WHEN $26::text IS NULL THEN 0

                        WHEN u.mls::text = $26::text THEN 1

                        WHEN LOWER(COALESCE(u.development_name, ''))
                            = LOWER($26::text) THEN 2

                        WHEN LOWER(COALESCE(u.building_name, ''))
                            = LOWER($26::text) THEN 3

                        WHEN COALESCE(u.address, '')
                            ILIKE '%%' || $26::text || '%%' THEN 4

                        WHEN COALESCE(u.development_name, '')
                            ILIKE '%%' || $26::text || '%%' THEN 5

                        WHEN COALESCE(u.building_name, '')
                            ILIKE '%%' || $26::text || '%%' THEN 6

                        WHEN COALESCE(u.unit_id, '')
                            ILIKE '%%' || $26::text || '%%' THEN 7

                        WHEN COALESCE(u.community_name, '')
                            ILIKE '%%' || $26::text || '%%' THEN 8

                        WHEN COALESCE(u.area_name, '')
                            ILIKE '%%' || $26::text || '%%' THEN 9

                        WHEN COALESCE(u.zone_name, '')
                            ILIKE '%%' || $26::text || '%%' THEN 10

                        ELSE 99
                    END AS relevance_rank

                FROM unified_listings AS u

                WHERE
                    -- Geography: multiple entity keys use OR logic.
                    (
                        $1::bigint[] IS NULL
                        OR CARDINALITY($1::bigint[]) = 0
                        OR EXISTS
                        (
                            SELECT 1

                            FROM requested_geographies AS rg

                            WHERE
                                (
                                    rg.entity_type_cd = 'ZN'
                                    AND LOWER(TRIM(COALESCE(u.zone_name, '')))
                                        = LOWER(TRIM(rg.canonical_name))
                                )
                                OR
                                (
                                    rg.entity_type_cd = 'AR'
                                    AND LOWER(TRIM(COALESCE(u.area_name, '')))
                                        = LOWER(TRIM(rg.canonical_name))
                                )
                                OR
                                (
                                    rg.entity_type_cd = 'CM'
                                    AND LOWER(TRIM(COALESCE(u.community_name, '')))
                                        = LOWER(TRIM(rg.canonical_name))
                                )
                                OR
                                (
                                    rg.entity_type_cd = 'DV'
                                    AND LOWER(TRIM(COALESCE(u.development_name, '')))
                                        = LOWER(TRIM(rg.canonical_name))
                                )
                                OR
                                (
                                    rg.entity_type_cd = 'BD'
                                    AND LOWER(TRIM(COALESCE(u.building_name, '')))
                                        = LOWER(TRIM(rg.canonical_name))
                                )
                        )
                    )

                    -- Free text.
                    AND
                    (
                        $26::text IS NULL

                        OR u.mls::text = $26::text

                        OR COALESCE(u.address, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.development_name, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.building_name, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.unit_id, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.community_name, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.area_name, '')
                            ILIKE '%%' || $26::text || '%%'

                        OR COALESCE(u.zone_name, '')
                            ILIKE '%%' || $26::text || '%%'
                    )

                    -- Property type.
                    AND
                    (
                        $2::text[] IS NULL
                        OR CARDINALITY($2::text[]) = 0
                        OR EXISTS
                        (
                            SELECT 1

                            FROM UNNEST($2::text[])
                                AS requested_type(value)

                            WHERE LOWER(TRIM(u.property_type_cd))
                                = LOWER(TRIM(requested_type.value))
                        )
                    )

                    -- Market segment.
                    AND
                    (
                        $3::text[] IS NULL
                        OR CARDINALITY($3::text[]) = 0
                        OR EXISTS
                        (
                            SELECT 1

                            FROM UNNEST($3::text[])
                                AS requested_segment(value)

                            WHERE LOWER(TRIM(u.market_segment))
                                = LOWER
                                  (
                                      REPLACE
                                      (
                                          TRIM(requested_segment.value),
                                          '-',
                                          '_'
                                      )
                                  )
                        )
                    )

                    -- Price.
                    AND ($4::numeric IS NULL OR u.effective_price >= $4::numeric)
                    AND ($5::numeric IS NULL OR u.effective_price <= $5::numeric)

                    -- Beds and baths.
                    AND ($6::numeric IS NULL OR u.beds >= $6::numeric)
                    AND ($7::numeric IS NULL OR u.beds <= $7::numeric)
                    AND ($8::numeric IS NULL OR u.baths >= $8::numeric)
                    AND ($9::numeric IS NULL OR u.baths <= $9::numeric)

                    -- Interior size.
                    AND ($10::numeric IS NULL OR u.sqft >= $10::numeric)
                    AND ($11::numeric IS NULL OR u.sqft <= $11::numeric)
                    AND ($12::numeric IS NULL OR u.sqm >= $12::numeric)
                    AND ($13::numeric IS NULL OR u.sqm <= $13::numeric)

                    -- Lot size.
                    AND ($14::numeric IS NULL OR u.lot_sqft >= $14::numeric)
                    AND ($15::numeric IS NULL OR u.lot_sqft <= $15::numeric)
                    AND ($16::numeric IS NULL OR u.lot_sqm >= $16::numeric)
                    AND ($17::numeric IS NULL OR u.lot_sqm <= $17::numeric)

                    -- Year built.
                    AND ($18::integer IS NULL OR u.year_built >= $18::integer)
                    AND ($19::integer IS NULL OR u.year_built <= $19::integer)

                    -- Days on market.
                    AND ($20::integer IS NULL OR u.dom <= $20::integer)

                    -- Views.
                    AND
                    (
                        $21::text IS NULL
                        OR COALESCE(u.primary_view, '')
                            ILIKE '%%' || $21::text || '%%'
                    )

                    AND
                    (
                        $22::text IS NULL
                        OR COALESCE(u.secondary_view, '')
                            ILIKE '%%' || $22::text || '%%'
                    )

                    -- Pre-construction.
                    AND
                    (
                        $23::boolean IS NULL
                        OR u.pre_construction = $23::boolean
                    )
            ),

            result_count AS
            (
                SELECT COUNT(*)::bigint AS total_count
                FROM filtered_listings
            ),

            paged_listings AS
            (
                SELECT *
                FROM filtered_listings AS f

                ORDER BY
                    CASE
                        WHEN $27::text = 'relevance'
                            THEN f.relevance_rank
                    END ASC NULLS LAST,

                    CASE
                        WHEN $27::text = 'price_asc'
                            THEN f.effective_price
                    END ASC NULLS LAST,

                    CASE
                        WHEN $27::text = 'price_desc'
                            THEN f.effective_price
                    END DESC NULLS LAST,

                    CASE
                        WHEN $27::text = 'dom_asc'
                            THEN f.dom
                    END ASC NULLS LAST,

                    CASE
                        WHEN $27::text = 'dom_desc'
                            THEN f.dom
                    END DESC NULLS LAST,

                    CASE
                        WHEN $27::text = 'sqft_asc'
                            THEN f.sqft
                    END ASC NULLS LAST,

                    CASE
                        WHEN $27::text = 'sqft_desc'
                            THEN f.sqft
                    END DESC NULLS LAST,

                    CASE
                        WHEN $27::text = 'newest'
                            THEN COALESCE(f.sold_date, f.snapshot_date)
                    END DESC NULLS LAST,

                    CASE
                        WHEN $27::text = 'oldest'
                            THEN COALESCE(f.sold_date, f.snapshot_date)
                    END ASC NULLS LAST,

                    CASE f.status_cd
                        WHEN 'active'  THEN 1
                        WHEN 'pending' THEN 2
                        WHEN 'closed'  THEN 3
                        ELSE 4
                    END,

                    COALESCE(f.sold_date, f.snapshot_date)
                        DESC NULLS LAST,

                    f.mls DESC NULLS LAST

                LIMIT $28::integer
                OFFSET $29::integer
            )

            SELECT
                p.status_cd,

                p.lstng_ky,
                p.prprty_ky,
                p.mls,

                p.address,
                p.development_name,
                p.zone_name,
                p.area_name,
                p.community_name,

                p.property_type,
                p.property_type_cd,

                p.market_type,
                p.market_segment,
                p.pre_construction,

                p.beds,
                p.baths,

                p.sqft,
                p.sqm,

                p.lot_sqft,
                p.lot_sqm,

                p.original_price,
                p.list_price,
                p.sold_price,

                p.price_per_sqft,
                p.price_per_sqm,

                p.dom,
                p.year_built,

                p.primary_view,
                p.secondary_view,

                p.latitude,
                p.longitude,

                p.building_name,
                p.unit_id,

                p.snapshot_date,
                p.sold_date,

                p.data_current_as_of,
                p.href,

                p.listing_data,
                rc.total_count

            FROM paged_listings AS p
            CROSS JOIN result_count AS rc
            $sql$,

            v_unified_sql
        );


    RETURN QUERY EXECUTE v_sql
    USING
        p_geography_entity_kys,  -- $1
        p_property_type_cds,     -- $2
        p_market_segments,       -- $3

        p_min_price,             -- $4
        p_max_price,             -- $5

        p_min_beds,              -- $6
        p_max_beds,              -- $7

        p_min_baths,             -- $8
        p_max_baths,             -- $9

        p_min_sqft,              -- $10
        p_max_sqft,              -- $11

        p_min_sqm,               -- $12
        p_max_sqm,               -- $13

        p_min_lot_sqft,          -- $14
        p_max_lot_sqft,          -- $15

        p_min_lot_sqm,           -- $16
        p_max_lot_sqm,           -- $17

        p_min_year_built,        -- $18
        p_max_year_built,        -- $19

        p_max_dom,               -- $20

        p_primary_view,          -- $21
        p_secondary_view,        -- $22

        p_pre_construction,      -- $23

        p_sold_date_from,        -- $24
        p_sold_date_to,          -- $25

        v_search_text,           -- $26
        v_sort,                  -- $27
        v_limit,                 -- $28
        v_offset;                -- $29
END;
$function$;


COMMENT ON FUNCTION public.ai_property_search_v2
(
    text[],
    bigint[],
    text[],
    text[],
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    numeric,
    integer,
    integer,
    integer,
    text,
    text,
    boolean,
    date,
    date,
    text,
    text,
    integer,
    integer
)
IS
'Ask SearchPV property search V2. Plans only requested listing-status sources and preserves the full source-view row in listing_data JSONB.';


COMMIT;


-- ============================================================
-- Smoke tests
-- Run these one at a time after the transaction succeeds.
-- ============================================================

-- 1. Confirm the installed language is plpgsql.
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    l.lanname AS language_name
FROM pg_proc p
JOIN pg_namespace n
  ON n.oid = p.pronamespace
JOIN pg_language l
  ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname = 'ai_property_search_v2';


-- 2. Active only.
SELECT *
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['active'],
    p_limit => 20
);


-- 3. Pending only.
SELECT *
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['pending'],
    p_limit => 20
);


-- 4. Closed only, recent period.
SELECT *
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['closed'],
    p_sold_date_from => CURRENT_DATE - 90,
    p_sold_date_to => CURRENT_DATE,
    p_limit => 20
);


-- 5. Combined Active + Pending.
SELECT *
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['active', 'pending'],
    p_limit => 20
);


-- 6. Inspect the complete source-view row retained in JSONB.
SELECT
    status_cd,
    mls,
    listing_data,
    total_count
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['active'],
    p_limit => 1
);


-- 7. Performance measurement.
EXPLAIN
(
    ANALYZE,
    BUFFERS,
    VERBOSE
)
SELECT *
FROM public.ai_property_search_v2
(
    p_statuses => ARRAY['active'],
    p_limit => 20
);