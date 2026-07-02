CREATE OR REPLACE VIEW rpt.active_listing AS
 WITH latest_snapshot AS (
         SELECT max(invntry_snap.invntry_snap_date_ky) AS invntry_snap_date_ky
           FROM dw.invntry_snap
        ), price_changes AS (
         SELECT prc_hstry.lstng_ky,
            count(*) AS price_changes
           FROM dw.prc_hstry
          GROUP BY prc_hstry.lstng_ky
        )
 SELECT s.invntry_snap_ky,
    s.invntry_snap_date_ky,
    l.lstng_ky,
    p.prprty_ky,
    p.zone_ds AS zone_name,
    p.area_ds AS area_name,
    p.cmnty_ds AS community_name,
    p.dvlpmnt_ds AS development_name,
    p.prprty_type,
    l.prprty_type_cd,
        CASE
            WHEN s.pre_cnstrctn_fl THEN 'Pre-Construction'::text
            ELSE 'Resale'::text
        END AS market_type,
    l.lstng_nb AS mls,
    p.adrs_ds AS address,
    p.dvlpmnt_ds AS development,
    l.bdrm_nb AS beds,
    COALESCE(l.full_bthrm_nb, 0::numeric) + COALESCE(l.half_bthrm_nb, 0::numeric) * 0.5 AS baths,
    l.ft2_cnstrctn_nb AS sqft,
    l.m2_cnstrctn_nb AS sqm,
    l.ft2_lot_nb AS lot_sqft,
    l.m2_lot_nb AS lot_sqm,
    s.orgnl_list_prc_am AS original_price,
    s.snap_list_prc_am AS current_price,
    COALESCE(pc.price_changes, 0::bigint) AS price_changes,
        CASE
            WHEN s.orgnl_list_prc_am IS NOT NULL AND s.snap_list_prc_am IS NOT NULL THEN s.snap_list_prc_am - s.orgnl_list_prc_am
            ELSE NULL::numeric
        END AS price_change_amount,
        CASE
            WHEN s.orgnl_list_prc_am > 0::numeric THEN round((s.snap_list_prc_am - s.orgnl_list_prc_am) / s.orgnl_list_prc_am * 100::numeric, 2)
            ELSE NULL::numeric
        END AS price_change_percent,
    s.prc_ft2_qt AS price_per_sqft,
    s.prc_m2_qt AS price_per_sqm,
    s.dom_qt AS dom,
    l.lstng_agncy_ds,
    l.lstng_agnt_nm,
    l.lstng_co_agnt_nm,
    l.year_blt_dt,
    l.flr_nb,
    l.prmy_view_nm,
    l.scndry_view_nm,
    p.lat_nb,
    p.long_nb,
    p.bldng_ds,
    p.unit_id,
    p.tax_id,
    p.prprty_fngrprnt_id,
    p.load_dt,
    s.run_ts as data_current_as_of
   FROM dw.invntry_snap s
     JOIN latest_snapshot ls ON s.invntry_snap_date_ky = ls.invntry_snap_date_ky
     JOIN dw.lstng l ON s.lstng_ky = l.lstng_ky
     JOIN dw.prprty p ON s.prprty_ky = p.prprty_ky
     LEFT JOIN price_changes pc ON s.lstng_ky = pc.lstng_ky
  WHERE s.stts_cd = 'A'::text;;


drop view if exists public.active_listing;

create or replace view public.active_listing as
select *
from rpt.active_listing;