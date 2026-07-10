-- SearchPV listing update/change-log support
-- Review data types before running in production.

-- 1) Add the new columns to dw.lstng.
-- NOTE: Postgres folds unquoted identifiers to lowercase. Use lowercase column names.

ALTER TABLE dw.lstng
    ADD COLUMN IF NOT EXISTS adrs_st_nm text,
    ADD COLUMN IF NOT EXISTS adrs_zip_cd text,
    ADD COLUMN IF NOT EXISTS lstng_cntrct_end_dt date,
    ADD COLUMN IF NOT EXISTS lstng_cntrct_bgn_dt date,
    ADD COLUMN IF NOT EXISTS sold_dt date,
    ADD COLUMN IF NOT EXISTS pndng_dt date,
    ADD COLUMN IF NOT EXISTS flthrgh_dt date,
    ADD COLUMN IF NOT EXISTS last_prprty_stts_chg_dt date,
    ADD COLUMN IF NOT EXISTS wthdrw_dt date,
    ADD COLUMN IF NOT EXISTS cncl_dt date,
    ADD COLUMN IF NOT EXISTS orgnl_prc_am numeric(14,2),
    ADD COLUMN IF NOT EXISTS lst_prc_am numeric(14,2),
    ADD COLUMN IF NOT EXISTS sld_prc_am numeric(14,2),
    ADD COLUMN IF NOT EXISTS fncng_fl text,
    ADD COLUMN IF NOT EXISTS strt_nb text,
    ADD COLUMN IF NOT EXISTS strt_nm text,
    ADD COLUMN IF NOT EXISTS unit_nb text,
    ADD COLUMN IF NOT EXISTS strt_sfx_ds text,
    ADD COLUMN IF NOT EXISTS bdga_deed_fl text,
    ADD COLUMN IF NOT EXISTS prprty_stl_ds text,
    ADD COLUMN IF NOT EXISTS ttl_lvls_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS ttl_room_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS ttl_bdrm_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS ttl_bthrm_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS ttl_full_bthrm_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS tax_id text,
    ADD COLUMN IF NOT EXISTS prdl_id text,
    ADD COLUMN IF NOT EXISTS prkng_ds text,
    ADD COLUMN IF NOT EXISTS mstr_pln_cmnty_fl text,
    ADD COLUMN IF NOT EXISTS lot_m2_nb numeric(14,2),
    ADD COLUMN IF NOT EXISTS ocn_frnt_mtr_nb numeric(14,2),
    ADD COLUMN IF NOT EXISTS units_in_dvlpmnt_nb numeric(10,2),
    ADD COLUMN IF NOT EXISTS ft2_deck_ptio_nb numeric(14,2),
    ADD COLUMN IF NOT EXISTS m2_deck_ptio_nb numeric(14,2),
    ADD COLUMN IF NOT EXISTS estmtd_dlvry_dt date,
    ADD COLUMN IF NOT EXISTS pre_cnstrctn_fl text,
    ADD COLUMN IF NOT EXISTS pet_frndly_fl text,
    ADD COLUMN IF NOT EXISTS prprty_tax_am numeric(14,2),
    ADD COLUMN IF NOT EXISTS deed_prkng_m2_nb numeric(14,2),
    ADD COLUMN IF NOT EXISTS cnstrctn_mnfst_fl text,
    ADD COLUMN IF NOT EXISTS crnt_lien_ltgtn_fl text,
    ADD COLUMN IF NOT EXISTS adjcnt_to_fdrl_zone_fl text,
    ADD COLUMN IF NOT EXISTS fdrl_zone_cncsn_fl text,
    ADD COLUMN IF NOT EXISTS ctfct_cmrcl_use_fl text,
    ADD COLUMN IF NOT EXISTS flex_room_fl text,
    ADD COLUMN IF NOT EXISTS lstng_prc_mxn_am numeric(14,2),
    ADD COLUMN IF NOT EXISTS dom_nb integer;

-- 2) Work table. This keeps latest raw/update values before applying them to dw.lstng.
CREATE TABLE IF NOT EXISTS dw.lstng_updt
(LIKE dw.lstng INCLUDING DEFAULTS INCLUDING CONSTRAINTS);

-- If dw.lstng has an identity/default sequence on lstng_ky, remove it from the work table.
-- The work table should store the real dw.lstng.lstng_ky, not generate a new key.
ALTER TABLE dw.lstng_updt ALTER COLUMN lstng_ky DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_lstng_updt_lstng_nb
ON dw.lstng_updt (lstng_nb);

CREATE INDEX IF NOT EXISTS ix_lstng_updt_lstng_ky
ON dw.lstng_updt (lstng_ky);

-- 3) Change log.
CREATE TABLE IF NOT EXISTS dw.lstng_chg_log (
    lstng_chg_log_ky bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lstng_ky bigint NOT NULL,
    lstng_nb text NOT NULL,
    clmn_nm text NOT NULL,
    clmn_data_tp text NOT NULL,
    clmn_valu_from_tx text,
    clmn_valu_thru_tx text,
    chg_ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_lstng_chg_log_lstng_ky
ON dw.lstng_chg_log (lstng_ky);

CREATE INDEX IF NOT EXISTS ix_lstng_chg_log_lstng_nb
ON dw.lstng_chg_log (lstng_nb);

CREATE INDEX IF NOT EXISTS ix_lstng_chg_log_chg_ts
ON dw.lstng_chg_log (chg_ts);
