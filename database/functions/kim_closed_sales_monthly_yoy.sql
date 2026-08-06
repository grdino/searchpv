DROP FUNCTION IF EXISTS public.closed_sales_monthly_yoy(date);

CREATE OR REPLACE FUNCTION public.closed_sales_monthly_yoy(
    p_as_of_date date DEFAULT (
        CURRENT_TIMESTAMP
        AT TIME ZONE 'America/Bahia_Banderas'
    )::date
)
RETURNS TABLE (
    comparison_month date,
    month_sequence integer,
    month_number integer,
    month_name text,

    current_period_start date,
    current_period_end date,
    current_period_label text,

    previous_period_start date,
    previous_period_end date,
    previous_period_label text,

    is_month_to_date boolean,

    market_name text,
    market_sort integer,

    geography_type text,
    geography_name text,
    geography_sort integer,

    category_type text,
    category_name text,
    category_sort integer,

    current_sales_count bigint,
    previous_sales_count bigint,
    sales_count_change bigint,
    sales_count_change_pct numeric,

    current_total_sold_usd numeric,
    previous_total_sold_usd numeric,
    total_sold_change_usd numeric,
    total_sold_change_pct numeric,

    current_median_sold_price_usd numeric,
    previous_median_sold_price_usd numeric,
    median_sold_price_change_usd numeric,
    median_sold_price_change_pct numeric,

    current_median_sold_price_per_sqm_usd numeric,
    previous_median_sold_price_per_sqm_usd numeric,
    median_sold_price_per_sqm_change_usd numeric,
    median_sold_price_per_sqm_change_pct numeric
)
LANGUAGE sql
STABLE
AS
$$

WITH parameters AS (
    SELECT
        p_as_of_date::date AS as_of_date,
        date_trunc('month', p_as_of_date)::date AS current_month
),

comparison_months AS (
    SELECT
        gs.comparison_month::date AS comparison_month,

        row_number() OVER (
            ORDER BY gs.comparison_month
        )::integer AS month_sequence,

        p.current_month::date AS current_month,
        p.as_of_date::date AS as_of_date

    FROM parameters AS p

    CROSS JOIN LATERAL generate_series(
        p.current_month::timestamp - interval '11 months',
        p.current_month::timestamp,
        interval '1 month'
    ) AS gs(comparison_month)
),

comparison_periods AS (
    SELECT
        cm.comparison_month,
        cm.month_sequence,

        cm.comparison_month AS current_period_start,

        CASE
            WHEN cm.comparison_month = cm.current_month
                THEN cm.as_of_date

            ELSE (
                cm.comparison_month
                + interval '1 month'
                - interval '1 day'
            )::date
        END AS current_period_end,

        (
            cm.comparison_month
            - interval '1 year'
        )::date AS previous_period_start,

        CASE
            WHEN cm.comparison_month = cm.current_month
                THEN (
                    (
                        cm.comparison_month
                        - interval '1 year'
                    )::date
                    + (
                        cm.as_of_date
                        - cm.current_month
                    )
                )::date

            ELSE (
                cm.comparison_month
                - interval '1 year'
                + interval '1 month'
                - interval '1 day'
            )::date
        END AS previous_period_end,

        (
            cm.comparison_month = cm.current_month
        ) AS is_month_to_date

    FROM comparison_months AS cm
),

period_definitions AS (
    SELECT
        cp.*,
        'current'::text AS period_type,
        cp.current_period_start AS period_start,
        cp.current_period_end AS period_end
    FROM comparison_periods AS cp

    UNION ALL

    SELECT
        cp.*,
        'previous'::text AS period_type,
        cp.previous_period_start AS period_start,
        cp.previous_period_end AS period_end
    FROM comparison_periods AS cp
),

period_sales AS (
    SELECT
        pd.comparison_month,
        pd.month_sequence,

        pd.current_period_start,
        pd.current_period_end,
        pd.previous_period_start,
        pd.previous_period_end,
        pd.is_month_to_date,

        pd.period_type,

        cl.clsd_sale_ky,
        cl.zone_name,
        cl.community_name,
        cl.property_type_segment,
        cl.bedroom_segment,

        cl.sold_date::date AS sold_date,
        cl.sold_price::numeric AS sold_price,
        cl.sold_price_per_sqm::numeric AS sold_price_per_sqm

    FROM period_definitions AS pd

    INNER JOIN public.closed_listing AS cl
        ON cl.sold_date >= pd.period_start
       AND cl.sold_date < pd.period_end + 1

    WHERE cl.sold_price IS NOT NULL
      AND cl.sold_price > 0
),

normalized_sales AS (
    SELECT
        ps.*,

        CASE
            WHEN lower(trim(coalesce(ps.zone_name, ''))) IN (
                'puerto vallarta',
                'pv'
            )
                THEN 'Puerto Vallarta'

            WHEN lower(trim(coalesce(ps.zone_name, ''))) IN (
                'riviera nayarit',
                'nayarit',
                'rn'
            )
                THEN 'Nayarit'

            WHEN lower(trim(coalesce(ps.zone_name, '')))
                LIKE '%puerto vallarta%'
                THEN 'Puerto Vallarta'

            WHEN lower(trim(coalesce(ps.zone_name, '')))
                LIKE '%nayarit%'
                THEN 'Nayarit'

            ELSE NULL
        END AS market_name,

        nullif(
            trim(ps.community_name),
            ''
        ) AS normalized_community_name,

        CASE
            WHEN lower(trim(coalesce(
                ps.property_type_segment,
                ''
            ))) IN (
                'condo',
                'condos',
                'condominium',
                'condominiums'
            )
                THEN 'Condos'

            WHEN lower(trim(coalesce(
                ps.property_type_segment,
                ''
            ))) IN (
                'house',
                'houses',
                'home',
                'homes'
            )
                THEN 'Houses'

            ELSE NULL
        END AS property_category,

        CASE
            WHEN lower(trim(coalesce(
                ps.bedroom_segment,
                ''
            ))) IN (
                'studio',
                'studios',
                '0br',
                '0 br',
                '0-bedroom',
                '0 bedroom'
            )
                THEN 'Studio'

            WHEN lower(trim(coalesce(
                ps.bedroom_segment,
                ''
            ))) IN (
                '1br',
                '1 br',
                '1-bedroom',
                '1 bedroom'
            )
                THEN '1 Bedroom'

            WHEN lower(trim(coalesce(
                ps.bedroom_segment,
                ''
            ))) IN (
                '2br',
                '2 br',
                '2-bedroom',
                '2 bedroom'
            )
                THEN '2 Bedrooms'

            WHEN lower(trim(coalesce(
                ps.bedroom_segment,
                ''
            ))) IN (
                '3br',
                '3 br',
                '3+br',
                '3+ br',
                '3br+',
                '3 br+',
                '3_plus',
                '3plus',
                '3-bedroom',
                '3 bedrooms',
                '3+ bedrooms',
                '3br_plus',
                '3br plus'
            )
                THEN '3+ Bedrooms'

            WHEN lower(trim(coalesce(
                ps.bedroom_segment,
                ''
            ))) ~ '^[3-9][0-9]*[[:space:]]*(\+)?[[:space:]]*br$'
                THEN '3+ Bedrooms'

            ELSE NULL
        END AS bedroom_category

    FROM period_sales AS ps
),

/*
Each sale is expanded into two geographic levels:

1. Market
2. Community
*/
geographic_sales AS (
    SELECT
        ns.*,

        geography.geography_type,
        geography.geography_name,
        geography.geography_sort

    FROM normalized_sales AS ns

    CROSS JOIN LATERAL (
        VALUES
            (
                'Market'::text,
                ns.market_name,
                1
            ),
            (
                'Community'::text,
                ns.normalized_community_name,
                2
            )
    ) AS geography (
        geography_type,
        geography_name,
        geography_sort
    )

    WHERE ns.market_name IS NOT NULL
      AND geography.geography_name IS NOT NULL
),

categorized_sales AS (
    SELECT
        gs.comparison_month,
        gs.month_sequence,

        gs.current_period_start,
        gs.current_period_end,
        gs.previous_period_start,
        gs.previous_period_end,
        gs.is_month_to_date,

        gs.period_type,

        gs.market_name,

        gs.geography_type,
        gs.geography_name,
        gs.geography_sort,

        gs.clsd_sale_ky,
        gs.sold_price,
        gs.sold_price_per_sqm,

        category.category_type,
        category.category_name,
        category.category_sort

    FROM geographic_sales AS gs

    CROSS JOIN LATERAL (
        VALUES
            (
                'Overall'::text,
                'All Closed Sales'::text,
                1
            ),
            (
                'Property Type'::text,
                gs.property_category,
                CASE gs.property_category
                    WHEN 'Condos' THEN 10
                    WHEN 'Houses' THEN 20
                    ELSE 99
                END
            ),
            (
                'Bedrooms'::text,
                gs.bedroom_category,
                CASE gs.bedroom_category
                    WHEN 'Studio' THEN 30
                    WHEN '1 Bedroom' THEN 40
                    WHEN '2 Bedrooms' THEN 50
                    WHEN '3+ Bedrooms' THEN 60
                    ELSE 99
                END
            )
    ) AS category (
        category_type,
        category_name,
        category_sort
    )

    WHERE category.category_name IS NOT NULL
),

period_metrics AS (
    SELECT
        cs.comparison_month,
        cs.month_sequence,

        cs.current_period_start,
        cs.current_period_end,
        cs.previous_period_start,
        cs.previous_period_end,
        cs.is_month_to_date,

        cs.period_type,

        cs.market_name,

        cs.geography_type,
        cs.geography_name,
        cs.geography_sort,

        cs.category_type,
        cs.category_name,
        cs.category_sort,

        count(*)::bigint AS sales_count,

        sum(cs.sold_price)::numeric AS total_sold_usd,

        percentile_cont(0.5)
            WITHIN GROUP (
                ORDER BY cs.sold_price
            )::numeric AS median_sold_price_usd,

        percentile_cont(0.5)
            WITHIN GROUP (
                ORDER BY cs.sold_price_per_sqm
            ) FILTER (
                WHERE cs.sold_price_per_sqm IS NOT NULL
                  AND cs.sold_price_per_sqm > 0
            )::numeric AS median_sold_price_per_sqm_usd

    FROM categorized_sales AS cs

    GROUP BY
        cs.comparison_month,
        cs.month_sequence,

        cs.current_period_start,
        cs.current_period_end,
        cs.previous_period_start,
        cs.previous_period_end,
        cs.is_month_to_date,

        cs.period_type,

        cs.market_name,

        cs.geography_type,
        cs.geography_name,
        cs.geography_sort,

        cs.category_type,
        cs.category_name,
        cs.category_sort
),

/*
The reporting geography list comes from actual sales found within
the 24-month reporting window.
*/
reporting_geographies AS (
    SELECT DISTINCT
        market_name,
        geography_type,
        geography_name,
        geography_sort
    FROM geographic_sales
),

categories AS (
    SELECT *
    FROM (
        VALUES
            (
                'Overall'::text,
                'All Closed Sales'::text,
                1
            ),
            (
                'Property Type'::text,
                'Condos'::text,
                10
            ),
            (
                'Property Type'::text,
                'Houses'::text,
                20
            ),
            (
                'Bedrooms'::text,
                'Studio'::text,
                30
            ),
            (
                'Bedrooms'::text,
                '1 Bedroom'::text,
                40
            ),
            (
                'Bedrooms'::text,
                '2 Bedrooms'::text,
                50
            ),
            (
                'Bedrooms'::text,
                '3+ Bedrooms'::text,
                60
            )
    ) AS category_values (
        category_type,
        category_name,
        category_sort
    )
),

report_grid AS (
    SELECT
        cp.comparison_month,
        cp.month_sequence,

        cp.current_period_start,
        cp.current_period_end,
        cp.previous_period_start,
        cp.previous_period_end,
        cp.is_month_to_date,

        rg.market_name,

        CASE rg.market_name
            WHEN 'Puerto Vallarta' THEN 1
            WHEN 'Nayarit' THEN 2
            ELSE 99
        END AS market_sort,

        rg.geography_type,
        rg.geography_name,
        rg.geography_sort,

        c.category_type,
        c.category_name,
        c.category_sort

    FROM comparison_periods AS cp
    CROSS JOIN reporting_geographies AS rg
    CROSS JOIN categories AS c
),

pivoted_metrics AS (
    SELECT
        rg.comparison_month,
        rg.month_sequence,

        rg.current_period_start,
        rg.current_period_end,
        rg.previous_period_start,
        rg.previous_period_end,
        rg.is_month_to_date,

        rg.market_name,
        rg.market_sort,

        rg.geography_type,
        rg.geography_name,
        rg.geography_sort,

        rg.category_type,
        rg.category_name,
        rg.category_sort,

        max(pm.sales_count) FILTER (
            WHERE pm.period_type = 'current'
        ) AS current_sales_count,

        max(pm.sales_count) FILTER (
            WHERE pm.period_type = 'previous'
        ) AS previous_sales_count,

        max(pm.total_sold_usd) FILTER (
            WHERE pm.period_type = 'current'
        ) AS current_total_sold_usd,

        max(pm.total_sold_usd) FILTER (
            WHERE pm.period_type = 'previous'
        ) AS previous_total_sold_usd,

        max(pm.median_sold_price_usd) FILTER (
            WHERE pm.period_type = 'current'
        ) AS current_median_sold_price_usd,

        max(pm.median_sold_price_usd) FILTER (
            WHERE pm.period_type = 'previous'
        ) AS previous_median_sold_price_usd,

        max(pm.median_sold_price_per_sqm_usd) FILTER (
            WHERE pm.period_type = 'current'
        ) AS current_median_sold_price_per_sqm_usd,

        max(pm.median_sold_price_per_sqm_usd) FILTER (
            WHERE pm.period_type = 'previous'
        ) AS previous_median_sold_price_per_sqm_usd

    FROM report_grid AS rg

    LEFT JOIN period_metrics AS pm
        ON pm.comparison_month = rg.comparison_month
       AND pm.market_name = rg.market_name
       AND pm.geography_type = rg.geography_type
       AND pm.geography_name = rg.geography_name
       AND pm.category_type = rg.category_type
       AND pm.category_name = rg.category_name

    GROUP BY
        rg.comparison_month,
        rg.month_sequence,

        rg.current_period_start,
        rg.current_period_end,
        rg.previous_period_start,
        rg.previous_period_end,
        rg.is_month_to_date,

        rg.market_name,
        rg.market_sort,

        rg.geography_type,
        rg.geography_name,
        rg.geography_sort,

        rg.category_type,
        rg.category_name,
        rg.category_sort
)

SELECT
    pm.comparison_month,
    pm.month_sequence,

    extract(
        month FROM pm.comparison_month
    )::integer AS month_number,

    to_char(
        pm.comparison_month,
        'FMMonth'
    ) AS month_name,

    pm.current_period_start,
    pm.current_period_end,

    CASE
        WHEN pm.is_month_to_date
            THEN concat(
                to_char(
                    pm.current_period_start,
                    'FMMonth FMDD'
                ),
                '–',
                to_char(
                    pm.current_period_end,
                    'FMDD, YYYY'
                )
            )
        ELSE to_char(
            pm.current_period_start,
            'FMMonth YYYY'
        )
    END AS current_period_label,

    pm.previous_period_start,
    pm.previous_period_end,

    CASE
        WHEN pm.is_month_to_date
            THEN concat(
                to_char(
                    pm.previous_period_start,
                    'FMMonth FMDD'
                ),
                '–',
                to_char(
                    pm.previous_period_end,
                    'FMDD, YYYY'
                )
            )
        ELSE to_char(
            pm.previous_period_start,
            'FMMonth YYYY'
        )
    END AS previous_period_label,

    pm.is_month_to_date,

    pm.market_name,
    pm.market_sort,

    pm.geography_type,
    pm.geography_name,
    pm.geography_sort,

    pm.category_type,
    pm.category_name,
    pm.category_sort,

    coalesce(
        pm.current_sales_count,
        0
    )::bigint AS current_sales_count,

    coalesce(
        pm.previous_sales_count,
        0
    )::bigint AS previous_sales_count,

    (
        coalesce(pm.current_sales_count, 0)
        - coalesce(pm.previous_sales_count, 0)
    )::bigint AS sales_count_change,

    round(
        (
            coalesce(pm.current_sales_count, 0)::numeric
            - coalesce(pm.previous_sales_count, 0)::numeric
        )
        / nullif(
            pm.previous_sales_count::numeric,
            0
        )
        * 100,
        2
    ) AS sales_count_change_pct,

    round(
        coalesce(pm.current_total_sold_usd, 0),
        2
    ) AS current_total_sold_usd,

    round(
        coalesce(pm.previous_total_sold_usd, 0),
        2
    ) AS previous_total_sold_usd,

    round(
        coalesce(pm.current_total_sold_usd, 0)
        - coalesce(pm.previous_total_sold_usd, 0),
        2
    ) AS total_sold_change_usd,

    round(
        (
            coalesce(pm.current_total_sold_usd, 0)
            - coalesce(pm.previous_total_sold_usd, 0)
        )
        / nullif(
            pm.previous_total_sold_usd,
            0
        )
        * 100,
        2
    ) AS total_sold_change_pct,

    round(
        pm.current_median_sold_price_usd,
        2
    ) AS current_median_sold_price_usd,

    round(
        pm.previous_median_sold_price_usd,
        2
    ) AS previous_median_sold_price_usd,

    round(
        pm.current_median_sold_price_usd
        - pm.previous_median_sold_price_usd,
        2
    ) AS median_sold_price_change_usd,

    round(
        (
            pm.current_median_sold_price_usd
            - pm.previous_median_sold_price_usd
        )
        / nullif(
            pm.previous_median_sold_price_usd,
            0
        )
        * 100,
        2
    ) AS median_sold_price_change_pct,

    round(
        pm.current_median_sold_price_per_sqm_usd,
        2
    ) AS current_median_sold_price_per_sqm_usd,

    round(
        pm.previous_median_sold_price_per_sqm_usd,
        2
    ) AS previous_median_sold_price_per_sqm_usd,

    round(
        pm.current_median_sold_price_per_sqm_usd
        - pm.previous_median_sold_price_per_sqm_usd,
        2
    ) AS median_sold_price_per_sqm_change_usd,

    round(
        (
            pm.current_median_sold_price_per_sqm_usd
            - pm.previous_median_sold_price_per_sqm_usd
        )
        / nullif(
            pm.previous_median_sold_price_per_sqm_usd,
            0
        )
        * 100,
        2
    ) AS median_sold_price_per_sqm_change_pct

FROM pivoted_metrics AS pm

ORDER BY
    pm.market_sort,
    pm.geography_sort,
    pm.geography_name,
    pm.category_sort,
    pm.month_sequence;

$$;