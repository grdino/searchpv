-- 2026-07-23 --
-- This pairs down the developments with basic logic. It is basically a first-cut to load the geo 
-- schema tables. Then, there needs to be an "office" sub-application to add/update/delete information
-- those table so that eventually places like Costco or one-offs can be loaded. 
-- Also, maybe a batch load of some kind in the future to use google maps or other to load locations,
-- but we need a mapped verson of the MLS-zones-areas-communities first so we can place things within
-- those boundaries.

WITH hierarchy_counts AS
(
    SELECT
        dvlpmnt_ds,
        zone_ds,
        area_ds,
        cmnty_ds,
        COUNT(*) AS hierarchy_ct
    FROM dw.prprty
    WHERE dvlpmnt_ds IS NOT NULL
      AND TRIM(dvlpmnt_ds) <> ''
      AND UPPER(dvlpmnt_ds) NOT LIKE 'CASA%'
    GROUP BY
        dvlpmnt_ds,
        zone_ds,
        area_ds,
        cmnty_ds
),

preferred_hierarchy AS
(
    SELECT DISTINCT ON (dvlpmnt_ds)
        dvlpmnt_ds,
        zone_ds,
        area_ds,
        cmnty_ds,
        hierarchy_ct
    FROM hierarchy_counts
    ORDER BY
        dvlpmnt_ds,
        hierarchy_ct DESC,
        zone_ds,
        area_ds,
        cmnty_ds
),

development_summary AS
(
    SELECT
        dvlpmnt_ds,

        COUNT(*) AS property_ct,

        COUNT(*) FILTER
        (
            WHERE lat_nb IS NOT NULL
              AND long_nb IS NOT NULL
        ) AS coordinate_ct,

        percentile_cont(0.5)
            WITHIN GROUP (ORDER BY long_nb)
            FILTER (WHERE long_nb IS NOT NULL) AS long_nb,

        percentile_cont(0.5)
            WITHIN GROUP (ORDER BY lat_nb)
            FILTER (WHERE lat_nb IS NOT NULL) AS lat_nb,

        COUNT(DISTINCT zone_ds)  AS zone_ct,
        COUNT(DISTINCT area_ds)  AS area_ct,
        COUNT(DISTINCT cmnty_ds) AS cmnty_ct

    FROM dw.prprty

    WHERE dvlpmnt_ds IS NOT NULL
      AND TRIM(dvlpmnt_ds) <> ''
      AND UPPER(dvlpmnt_ds) NOT LIKE 'CASA%'

    GROUP BY dvlpmnt_ds

    HAVING COUNT(*) > 1
)

SELECT

    s.dvlpmnt_ds,

    s.property_ct,
    s.coordinate_ct,

    s.long_nb,
    s.lat_nb,

    h.zone_ds,
    h.area_ds,
    h.cmnty_ds,

    h.hierarchy_ct,

    s.zone_ct,
    s.area_ct,
    s.cmnty_ct

FROM development_summary s

JOIN preferred_hierarchy h
  ON h.dvlpmnt_ds = s.dvlpmnt_ds

ORDER BY
    s.dvlpmnt_ds;