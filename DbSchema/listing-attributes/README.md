# SearchPV Listing Attribute Production Package

## Install 

1. Run `01_searchpv_attribute_model.sql` in the Supabase SQL Editor.
2. Copy `02_dw_load_lstng_attribute.py` to `prod/scripts/dw_load_lstng_attribute.py`.
3. Replace or edit `prod/scripts/run_daily_mls_pipeline.py` using `03_run_daily_mls_pipeline_updated.py`.
3a. run python prod/scripts/dw_load_lstng_attribute.py --historical
4. Run the daily pipeline normally.
5. Run `04_validation_queries.sql` after the first load.

## Daily source and matching

- Source: `prod/data/cleaned/mls_export.csv`
- Source key: `List Number`
- Warehouse match: `dw.lstng.lstng_nb`
- Stored FK: `dw.lstng.lstng_ky`

The attribute loader runs after `dw_load_lstng.py`, so newly inserted listings are already available for matching.

## Current-state replacement behavior

For listings represented in the current CSV and found in `dw.lstng`, the loader:

1. deletes their prior rows from `dw.lstng_attribute_value`;
2. inserts the complete current attribute set;
3. upserts their row in `dw.lstng_search_attribute`, including NULL resets.

Listings absent from the current CSV are untouched. Source listings not found in `dw.lstng` are reported in `prod/data/load/lstng_attribute_unmatched_listings.csv`.

## Boolean semantics

- `TRUE`: explicitly Yes/present
- `FALSE`: explicitly No
- `NULL`: unknown, omitted, or not sufficiently supported

Categorical view fields only establish `TRUE` for a matching view. A different supplied view does not automatically establish `FALSE`.

## Furnishing field

The current cleaned MLS export uses `NO_COMMON_NAME.6` for furnishing status:

- `Amoblado` -> `FURNISHED`
- `Parcialmente Amoblad[o]` -> `PARTIALLY_FURNISHED`
- `SinMuebles` -> `UNFURNISHED`

## Historical backfill

Use an explicit source path if the historical CSV is not stored in the repository:

```powershell
python prod/scripts/dw_load_lstng_attribute.py --source "C:\path\to\mls_export_latest_historical.csv"
```

The `--historical` shortcut expects:

`prod/data/cleaned/mls_export_latest_historical.csv`

## Generated cache files

Do not copy or commit `.pyc` files or `__pycache__` directories. Python creates them automatically.
