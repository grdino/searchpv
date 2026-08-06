"""
Load current-state MLS listing attributes into SearchPV.

Default daily source:
    prod/data/cleaned/mls_export.csv

Historical backfill:
    python prod/scripts/dw_load_lstng_attribute.py --historical

Daily ETL:
    python prod/scripts/dw_load_lstng_attribute.py

Behavior:
1. Reads only the current source file supplied for this run.
2. Matches source "List Number" to dw.lstng.lstng_nb.
3. Ignores source listings not yet present in dw.lstng and writes a review CSV.
4. Deletes prior attribute values only for matched listings represented in this run.
5. Inserts the complete latest attribute set for that same matched scope.
6. Rebuilds the one-row search profile for that scope.
7. Preserves TRUE / FALSE / NULL semantics.
8. Does not retain attribute history.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import unicodedata
import uuid
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pandas as pd
from sqlalchemy import MetaData, Table, bindparam, insert, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.engine import Connection

from db_connect import engine

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DAILY_SOURCE_PATH = PROJECT_ROOT / "prod/data/cleaned/mls_export.csv"
HISTORICAL_SOURCE_PATH = (
    PROJECT_ROOT / "prod/data/cleaned/mls_export_latest_historical.csv"
)
LOAD_DIR = PROJECT_ROOT / "prod/data/load"
UNMATCHED_PATH = LOAD_DIR / "lstng_attribute_unmatched_listings.csv"
REJECT_PATH = LOAD_DIR / "lstng_attribute_parse_rejects.csv"

SOURCE_LISTING_COLUMN = "List Number"
FEATURES_COLUMN = "Features"
BATCH_COLUMN = "BatchNumber"

VALUE_INSERT_CHUNK_SIZE = 5000
SEARCH_UPSERT_CHUNK_SIZE = 1000

TRUE_VALUES = {"YES", "Y", "TRUE", "T", "1", "SI", "SÍ"}
FALSE_VALUES = {"NO", "N", "FALSE", "F", "0", "NONE", "NINGUNO", "NINGUNA"}

AMOUNT_FIELD_HINTS = (
    "DUES", "AMOUNT", "PRICE", "COST", "FEE", "PESOS", "DOLLARS", "USD", "MXN"
)

DIRECT_SOURCE_COLUMNS = [
    "Primary View",
    "Secondary View",
    "Parking",
    "Mstr Plan Community",
    "Pre-Construction",
    "Pet Friendly",
    "Flex Room",
    "Adjacent to Federal Zone",
    "Has Federal Zone Concession",
    "Construction Manifest",
    "Current Lien or Litigation",
    "Régimen de Propiedad",
    "Liens",
    "Ocean Front Meters",
    "NO_COMMON_NAME.6",  # Furnishing status in the current cleaned MLS export
]


@dataclass(frozen=True)
class ParsedAttribute:
    lstng_nb: int
    source_column_nm: str
    section_nm: str | None
    field_nm: str
    source_path_tx: str
    raw_value_tx: str
    batch_number_tx: str | None


def blank_to_none(value):
    if value is None or pd.isna(value):
        return None
    result = str(value).strip()
    return result if result else None


def normalize_listing_number(value) -> int | None:
    value = blank_to_none(value)
    if value is None:
        return None
    try:
        number = Decimal(value)
    except InvalidOperation:
        return None
    if number != number.to_integral_value():
        return None
    return int(number)


def normalize_key(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^A-Za-z0-9]+", "_", value.upper()).strip("_")
    return value or "ATTRIBUTE"


def stable_attribute_cd(section: str | None, field: str) -> str:
    base = normalize_key(f"{section or 'CSV'}_{field}")
    digest = hashlib.sha1(f"{section or 'CSV'}|{field}".encode("utf-8")).hexdigest()[:8].upper()
    return f"{base[:50]}_{digest}"


def parse_boolean(value: str | None) -> bool | None:
    value = blank_to_none(value)
    if value is None:
        return None
    normalized = value.upper()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    return None


def parse_decimal(value: str | None) -> Decimal | None:
    value = blank_to_none(value)
    if value is None:
        return None
    cleaned = re.sub(r"[^0-9.\-]", "", value.replace(",", ""))
    if cleaned in {"", "-", ".", "-."}:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def infer_data_type(field_nm: str, values: list[str]) -> str:
    nonblank = [v for v in (blank_to_none(x) for x in values) if v is not None]
    if nonblank and all(v.upper() in TRUE_VALUES | FALSE_VALUES for v in nonblank):
        return "BOOLEAN"
    numeric = [parse_decimal(v) for v in nonblank]
    if nonblank and all(v is not None for v in numeric):
        upper_field = field_nm.upper()
        return "AMOUNT" if any(hint in upper_field for hint in AMOUNT_FIELD_HINTS) else "NUMBER"
    return "TEXT"


def parse_source_rows(df: pd.DataFrame) -> tuple[list[ParsedAttribute], list[dict]]:
    parsed: list[ParsedAttribute] = []
    rejects: list[dict] = []

    for row_number, row in df.iterrows():
        lstng_nb = normalize_listing_number(row.get(SOURCE_LISTING_COLUMN))
        if lstng_nb is None:
            rejects.append({"row_number": row_number + 2, "reason": "Invalid List Number"})
            continue

        batch = blank_to_none(row.get(BATCH_COLUMN))

        features = blank_to_none(row.get(FEATURES_COLUMN))
        if features:
            for token in features.split(";"):
                token = token.strip()
                if not token:
                    continue
                parts = [part.strip() for part in token.split("|", 2)]
                if len(parts) != 3 or not parts[0] or not parts[1]:
                    rejects.append({
                        "row_number": row_number + 2,
                        "lstng_nb": lstng_nb,
                        "reason": "Malformed Features token",
                        "raw_token": token,
                    })
                    continue
                section, field, raw_value = parts
                if not raw_value:
                    # A present MLS field with no value is unknown, not a
                    # false assertion and not a load error.
                    continue
                parsed.append(ParsedAttribute(
                    lstng_nb=lstng_nb,
                    source_column_nm=FEATURES_COLUMN,
                    section_nm=section,
                    field_nm=field,
                    source_path_tx=f"Features > {section} > {field}",
                    raw_value_tx=raw_value,
                    batch_number_tx=batch,
                ))

        for column in DIRECT_SOURCE_COLUMNS:
            if column not in df.columns:
                continue
            raw_value = blank_to_none(row.get(column))
            if raw_value is None:
                continue
            parsed.append(ParsedAttribute(
                lstng_nb=lstng_nb,
                source_column_nm=column,
                section_nm=None,
                field_nm=column,
                source_path_tx=f"CSV > {column}",
                raw_value_tx=raw_value,
                batch_number_tx=batch,
            ))

    # Keep the last occurrence of the same source path for a listing.
    deduped = {
        (item.lstng_nb, item.source_path_tx): item
        for item in parsed
    }
    return list(deduped.values()), rejects


def get_listing_key_map(conn: Connection, listing_numbers: list[int]) -> dict[int, int]:
    if not listing_numbers:
        return {}
    stmt = text("""
        SELECT lstng_nb, lstng_ky
        FROM dw.lstng
        WHERE lstng_nb IN :listing_numbers
    """).bindparams(bindparam("listing_numbers", expanding=True))
    return {int(row.lstng_nb): int(row.lstng_ky) for row in conn.execute(stmt, {"listing_numbers": listing_numbers})}


def category_cd(section: str | None) -> str:
    return normalize_key(section or "CSV")[:40]


def upsert_catalog(conn: Connection, parsed: list[ParsedAttribute]) -> dict[str, dict]:
    grouped: dict[str, list[ParsedAttribute]] = {}
    for item in parsed:
        grouped.setdefault(item.source_path_tx, []).append(item)

    categories = {}
    for items in grouped.values():
        sample = items[0]
        categories[category_cd(sample.section_nm)] = sample.section_nm or "CSV Columns"

    conn.execute(text("""
        INSERT INTO dw.attribute_category
        (attribute_category_cd, attribute_category_nm, update_dt)
        VALUES (:cd, :nm, now())
        ON CONFLICT (attribute_category_cd) DO UPDATE SET
            attribute_category_nm = EXCLUDED.attribute_category_nm,
            active_fl = true,
            update_dt = now()
    """), [{"cd": cd, "nm": nm} for cd, nm in categories.items()])

    attribute_rows = []
    source_rows = []
    for path, items in grouped.items():
        sample = items[0]
        dtype = infer_data_type(sample.field_nm, [x.raw_value_tx for x in items])
        attribute_rows.append({
            "category_cd": category_cd(sample.section_nm),
            "attribute_cd": stable_attribute_cd(sample.section_nm, sample.field_nm),
            "attribute_nm": sample.field_nm,
            "data_type_cd": dtype,
        })

    conn.execute(text("""
        INSERT INTO dw.attribute
        (
            attribute_category_cd, attribute_cd, attribute_nm,
            attribute_data_type_cd, update_dt
        )
        VALUES
        (
            :category_cd, :attribute_cd, :attribute_nm,
            :data_type_cd, now()
        )
        ON CONFLICT (attribute_cd) DO UPDATE SET
            attribute_category_cd = EXCLUDED.attribute_category_cd,
            attribute_nm = EXCLUDED.attribute_nm,
            active_fl = true,
            update_dt = now()
    """), attribute_rows)

    attr_map = {
        row.attribute_cd: {"attribute_ky": int(row.attribute_ky), "data_type_cd": row.attribute_data_type_cd}
        for row in conn.execute(text("""
            SELECT attribute_ky, attribute_cd, attribute_data_type_cd
            FROM dw.attribute
            WHERE attribute_cd IN :codes
        """).bindparams(bindparam("codes", expanding=True)), {"codes": [r["attribute_cd"] for r in attribute_rows]})
    }

    for path, items in grouped.items():
        sample = items[0]
        code = stable_attribute_cd(sample.section_nm, sample.field_nm)
        source_rows.append({
            "attribute_ky": attr_map[code]["attribute_ky"],
            "source_column_nm": sample.source_column_nm,
            "source_section_nm": sample.section_nm,
            "source_field_nm": sample.field_nm,
            "source_path_tx": path,
        })

    conn.execute(text("""
        INSERT INTO dw.attribute_source
        (
            attribute_ky, source_column_nm, source_section_nm,
            source_field_nm, source_path_tx, update_dt
        )
        VALUES
        (
            :attribute_ky, :source_column_nm, :source_section_nm,
            :source_field_nm, :source_path_tx, now()
        )
        ON CONFLICT (source_system_cd, source_path_tx) DO UPDATE SET
            attribute_ky = EXCLUDED.attribute_ky,
            source_column_nm = EXCLUDED.source_column_nm,
            source_section_nm = EXCLUDED.source_section_nm,
            source_field_nm = EXCLUDED.source_field_nm,
            active_fl = true,
            update_dt = now()
    """), source_rows)

    result = {}
    for row in conn.execute(text("""
        SELECT
            s.source_path_tx,
            s.attribute_source_ky,
            a.attribute_ky,
            a.attribute_data_type_cd
        FROM dw.attribute_source s
        JOIN dw.attribute a ON a.attribute_ky = s.attribute_ky
        WHERE s.source_path_tx IN :paths
    """).bindparams(bindparam("paths", expanding=True)), {"paths": list(grouped)}):
        result[row.source_path_tx] = {
            "attribute_source_ky": int(row.attribute_source_ky),
            "attribute_ky": int(row.attribute_ky),
            "data_type_cd": row.attribute_data_type_cd,
        }
    return result


def typed_payload(item: ParsedAttribute, data_type_cd: str) -> dict:
    result = {
        "value_boolean_fl": None,
        "value_number_nb": None,
        "value_amount_nb": None,
        "value_text_tx": None,
        "value_date_dt": None,
    }
    if data_type_cd == "BOOLEAN":
        result["value_boolean_fl"] = parse_boolean(item.raw_value_tx)
    elif data_type_cd == "NUMBER":
        result["value_number_nb"] = parse_decimal(item.raw_value_tx)
    elif data_type_cd == "AMOUNT":
        result["value_amount_nb"] = parse_decimal(item.raw_value_tx)
    else:
        result["value_text_tx"] = item.raw_value_tx
    return result


def yes_no_from_values(values: list[str]) -> bool | None:
    """Return explicit boolean semantics: Yes=True, No=False, omitted/other=NULL."""
    parsed = [parse_boolean(value) for value in values]
    explicit = [value for value in parsed if value is not None]
    if not explicit:
        return None
    # When duplicated MLS sources conflict, a positive explicit assertion wins.
    return any(explicit)


def presence_from_values(values: list[str]) -> bool | None:
    """Treat categorical equipment values as present while preserving explicit No."""
    clean = [blank_to_none(value) for value in values]
    clean = [value for value in clean if value is not None]
    if not clean:
        return None
    explicit = [parse_boolean(value) for value in clean]
    if any(value is True for value in explicit):
        return True
    if all(value is False for value in explicit):
        return False
    return True


def categorical_match(values: list[object], terms: tuple[str, ...]) -> bool | None:
    """Return TRUE for a matching category; otherwise NULL, not an inferred FALSE."""
    clean = [blank_to_none(value) for value in values]
    clean = [value.upper() for value in clean if value]
    if not clean:
        return None
    return True if any(any(term in value for term in terms) for value in clean) else None


def parse_furnished(value: object) -> str | None:
    value = blank_to_none(value)
    if value is None:
        return None
    normalized = normalize_key(value)
    if normalized in {"SINMUEBLES", "SIN_MUEBLES", "UNFURNISHED", "NOT_FURNISHED"}:
        return "UNFURNISHED"
    if normalized in {
        "PARCIALMENTE_AMOBLAD", "PARCIALMENTE_AMOBLADO",
        "PARTIALLY_FURNISHED", "PART_FURNISHED"
    }:
        return "PARTIALLY_FURNISHED"
    if normalized in {"AMOBLADO", "AMUEBLADO", "FURNISHED"}:
        return "FURNISHED"
    return None


def parse_parking_spaces(value: object) -> int | None:
    value = blank_to_none(value)
    if value is None:
        return None
    match = re.search(r"\b(\d+)\s*(?:\+|SPACE|SPACES)?\b", value.upper())
    return int(match.group(1)) if match else None


def oceanfront_from_sources(feature_values: list[str], ocean_front_meters: object) -> bool | None:
    explicit = yes_no_from_values(feature_values)
    if explicit is not None:
        return explicit
    meters = parse_decimal(blank_to_none(ocean_front_meters))
    if meters is None:
        return None
    return meters > 0


def build_search_rows(
    df: pd.DataFrame,
    listing_key_map: dict[int, int],
    parsed: list[ParsedAttribute],
) -> list[dict]:
    by_listing: dict[int, list[ParsedAttribute]] = {}
    for item in parsed:
        by_listing.setdefault(item.lstng_nb, []).append(item)

    def values_for(
        lstng_nb: int,
        field_names: tuple[str, ...],
        section_names: tuple[str, ...] = (),
    ) -> list[str]:
        fields = {normalize_key(value) for value in field_names}
        sections = {normalize_key(value) for value in section_names}
        result: list[str] = []
        for item in by_listing.get(lstng_nb, []):
            if sections and normalize_key(item.section_nm or "CSV") not in sections:
                continue
            if normalize_key(item.field_nm) in fields:
                result.append(item.raw_value_tx)
        return result

    rows = []
    for _, row in df.iterrows():
        lstng_nb = normalize_listing_number(row.get(SOURCE_LISTING_COLUMN))
        if lstng_nb not in listing_key_map:
            continue

        primary_secondary = [row.get("Primary View"), row.get("Secondary View")]
        parking_value = blank_to_none(row.get("Parking"))
        parking_explicit = parse_boolean(parking_value)
        parking_fl = None
        if parking_value is not None:
            parking_fl = parking_explicit if parking_explicit is not None else True

        furnished_cd = parse_furnished(row.get("NO_COMMON_NAME.6"))
        if furnished_cd is None:
            furnished_values = values_for(
                lstng_nb,
                ("Furnished", "Furnishing", "Furnished Status"),
            )
            for value in furnished_values:
                furnished_cd = parse_furnished(value)
                if furnished_cd is not None:
                    break

        hoa_mxn = values_for(lstng_nb, ("Dues per month pesos",), ("HOA Info",))
        hoa_usd = values_for(
            lstng_nb,
            ("Dues per month USD", "Dues per month dollars"),
            ("HOA Info",),
        )

        pool_values = values_for(
            lstng_nb,
            ("Pool",),
            ("Amenities", "Common Amenities"),
        )
        private_pool_values = values_for(lstng_nb, ("Private Pool",))
        common_pool_values = values_for(
            lstng_nb,
            ("Pool", "Common Pool"),
            ("Common Amenities",),
        )

        batch = blank_to_none(row.get(BATCH_COLUMN))
        rows.append({
            "lstng_ky": listing_key_map[lstng_nb],
            "furnished_cd": furnished_cd,
            "pet_friendly_fl": parse_boolean(row.get("Pet Friendly")),
            "preconstruction_fl": parse_boolean(row.get("Pre-Construction")),
            "flex_room_fl": parse_boolean(row.get("Flex Room")),
            "master_planned_community_fl": parse_boolean(row.get("Mstr Plan Community")),
            "beachfront_fl": yes_no_from_values(values_for(lstng_nb, ("Beachfront",))),
            "oceanfront_fl": oceanfront_from_sources(
                values_for(lstng_nb, ("Oceanfront", "Ocean Front")),
                row.get("Ocean Front Meters"),
            ),
            "waterfront_fl": yes_no_from_values(values_for(lstng_nb, ("Waterfront",))),
            "beach_access_fl": yes_no_from_values(values_for(lstng_nb, ("Beach Access", "Access to Beach"))),
            "ocean_view_fl": categorical_match(primary_secondary, ("OCEAN", "SEA VIEW", "MAR")),
            "mountain_view_fl": categorical_match(primary_secondary, ("MOUNTAIN", "MONTA", "SIERRA")),
            "city_view_fl": categorical_match(primary_secondary, ("CITY", "CIUDAD")),
            "marina_view_fl": categorical_match(primary_secondary, ("MARINA",)),
            "golf_view_fl": categorical_match(primary_secondary, ("GOLF",)),
            "pool_view_fl": categorical_match(primary_secondary, ("POOL", "ALBERCA")),
            "garden_view_fl": categorical_match(primary_secondary, ("GARDEN", "JARDIN")),
            "jungle_view_fl": categorical_match(primary_secondary, ("JUNGLE", "SELVA")),
            "pool_fl": yes_no_from_values(pool_values),
            "private_pool_fl": yes_no_from_values(private_pool_values),
            "common_pool_fl": yes_no_from_values(common_pool_values),
            "infinity_pool_fl": yes_no_from_values(values_for(lstng_nb, ("Infinity Pool",))),
            "jacuzzi_fl": yes_no_from_values(values_for(lstng_nb, ("Jacuzzi", "Hot Tub"))),
            "gym_fl": yes_no_from_values(values_for(lstng_nb, ("Gym", "Fitness Center"))),
            "spa_fl": yes_no_from_values(values_for(lstng_nb, ("Spa",))),
            "elevator_fl": yes_no_from_values(values_for(lstng_nb, ("Elevator",))),
            "security_24hr_fl": yes_no_from_values(values_for(
                lstng_nb,
                ("24 Hours Security", "24 Hour Security", "24-hr Security"),
            )),
            "gated_fl": yes_no_from_values(values_for(lstng_nb, ("Gated Community", "Gated",))),
            "wheelchair_accessible_fl": yes_no_from_values(values_for(
                lstng_nb,
                ("Wheelchair Access", "Wheelchair Accessible", "Accessible"),
            )),
            "fiber_optic_fl": presence_from_values(values_for(lstng_nb, ("Fiberoptic", "Fiber Optic"))),
            "air_conditioning_fl": presence_from_values(values_for(lstng_nb, ("Air Conditioning",))),
            "washer_dryer_fl": presence_from_values(values_for(lstng_nb, ("Washer/Dryer", "Washer Dryer"))),
            "solar_panels_fl": presence_from_values(values_for(lstng_nb, ("Solar Panels", "Solar Panel"))),
            "parking_fl": parking_fl,
            "parking_type_cd": normalize_key(parking_value)[:50] if parking_value else None,
            "parking_space_nb": parse_parking_spaces(parking_value),
            "hoa_monthly_mxn_amt": parse_decimal(hoa_mxn[-1]) if hoa_mxn else None,
            "hoa_monthly_usd_amt": parse_decimal(hoa_usd[-1]) if hoa_usd else None,
            "hoa_includes_water_fl": yes_no_from_values(values_for(lstng_nb, ("Water",), ("HOA Info",))),
            "hoa_includes_electricity_fl": yes_no_from_values(values_for(
                lstng_nb,
                ("Common Area Electric", "Electricity"),
                ("HOA Info",),
            )),
            "hoa_includes_gas_fl": yes_no_from_values(values_for(lstng_nb, ("Gas",), ("HOA Info",))),
            "source_batch_number_tx": batch,
        })
    return list({row["lstng_ky"]: row for row in rows}.values())

def chunked(items, chunk_size: int):
    """Yield fixed-size lists without duplicating the complete dataset."""
    chunk = []
    for item in items:
        chunk.append(item)
        if len(chunk) >= chunk_size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


def build_value_row(
    item: ParsedAttribute,
    listing_key_map: dict[int, int],
    catalog_map: dict[str, dict],
) -> dict:
    metadata = catalog_map[item.source_path_tx]
    payload = typed_payload(item, metadata["data_type_cd"])
    return {
        "lstng_ky": listing_key_map[item.lstng_nb],
        "attribute_ky": metadata["attribute_ky"],
        "attribute_source_ky": metadata["attribute_source_ky"],
        "raw_value_tx": item.raw_value_tx,
        "source_batch_number_tx": item.batch_number_tx,
        **payload,
    }


def run(source_path: Path) -> None:
    LOAD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Reading {source_path}", flush=True)
    df = pd.read_csv(source_path, low_memory=False)
    if SOURCE_LISTING_COLUMN not in df.columns:
        raise RuntimeError(f"Missing required source column: {SOURCE_LISTING_COLUMN}")

    print(f"Parsing attributes from {len(df):,} source listings...", flush=True)
    parsed, rejects = parse_source_rows(df)
    listing_numbers = sorted({
        number
        for value in df[SOURCE_LISTING_COLUMN]
        if (number := normalize_listing_number(value)) is not None
    })
    print(f"Parsed attribute rows: {len(parsed):,}", flush=True)

    with engine.begin() as conn:
        listing_key_map = get_listing_key_map(conn, listing_numbers)
        unmatched = sorted(set(listing_numbers) - set(listing_key_map))

        pd.DataFrame({"lstng_nb": unmatched}).to_csv(UNMATCHED_PATH, index=False)
        pd.DataFrame(rejects).to_csv(REJECT_PATH, index=False)

        matched_parsed = [
            item for item in parsed
            if item.lstng_nb in listing_key_map
        ]
        if not listing_key_map:
            print("No source listings matched dw.lstng. Nothing loaded.", flush=True)
            return

        print("Refreshing the attribute catalog...", flush=True)
        catalog_map = upsert_catalog(conn, matched_parsed)
        scope_keys = sorted(set(listing_key_map.values()))

        print(
            f"Deleting prior attribute values for {len(scope_keys):,} matched listings...",
            flush=True,
        )
        conn.execute(
            text("""
                DELETE FROM dw.lstng_attribute_value
                WHERE lstng_ky IN :scope_keys
            """).bindparams(bindparam("scope_keys", expanding=True)),
            {"scope_keys": scope_keys},
        )

        metadata = MetaData()
        value_table = Table(
            "lstng_attribute_value",
            metadata,
            schema="dw",
            autoload_with=conn,
        )
        search_table = Table(
            "lstng_search_attribute",
            metadata,
            schema="dw",
            autoload_with=conn,
        )

        total_values = len(matched_parsed)
        inserted_values = 0
        print(
            f"Inserting {total_values:,} listing attribute rows in "
            f"chunks of {VALUE_INSERT_CHUNK_SIZE:,}...",
            flush=True,
        )

        value_row_iter = (
            build_value_row(item, listing_key_map, catalog_map)
            for item in matched_parsed
        )
        for value_chunk in chunked(value_row_iter, VALUE_INSERT_CHUNK_SIZE):
            # Explicit .values(chunk) produces one PostgreSQL multi-row INSERT
            # instead of one network round trip per attribute row.
            conn.execute(insert(value_table).values(value_chunk))
            inserted_values += len(value_chunk)
            print(
                f"  Attribute rows inserted: "
                f"{inserted_values:,} / {total_values:,}",
                flush=True,
            )

        print("Building listing search profiles...", flush=True)
        search_rows = build_search_rows(df, listing_key_map, matched_parsed)

        search_update_columns = [
            column.name
            for column in search_table.columns
            if column.name not in {"lstng_ky", "derived_dt", "update_dt"}
        ]

        upserted_search_rows = 0
        total_search_rows = len(search_rows)
        print(
            f"Upserting {total_search_rows:,} search profiles in "
            f"chunks of {SEARCH_UPSERT_CHUNK_SIZE:,}...",
            flush=True,
        )

        for search_chunk in chunked(search_rows, SEARCH_UPSERT_CHUNK_SIZE):
            insert_stmt = pg_insert(search_table).values(search_chunk)
            update_values = {
                column_name: getattr(insert_stmt.excluded, column_name)
                for column_name in search_update_columns
            }
            update_values["derived_dt"] = text("now()")
            update_values["update_dt"] = text("now()")

            conn.execute(
                insert_stmt.on_conflict_do_update(
                    index_elements=[search_table.c.lstng_ky],
                    set_=update_values,
                )
            )
            upserted_search_rows += len(search_chunk)
            print(
                f"  Search profiles upserted: "
                f"{upserted_search_rows:,} / {total_search_rows:,}",
                flush=True,
            )

        print(f"Matched listings: {len(listing_key_map):,}", flush=True)
        print(f"Unmatched listings: {len(unmatched):,}", flush=True)
        print(f"Current attribute rows inserted: {inserted_values:,}", flush=True)
        print(f"Search profiles refreshed: {upserted_search_rows:,}", flush=True)
        print(f"Parse rejects: {len(rejects):,}", flush=True)
        print("Attribute load committed successfully.", flush=True)

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--historical", action="store_true", help="Use the latest historical source file.")
    parser.add_argument("--source", type=Path, help="Override the source CSV path.")
    args = parser.parse_args()
    source = args.source or (HISTORICAL_SOURCE_PATH if args.historical else DAILY_SOURCE_PATH)
    if not source.exists():
        raise FileNotFoundError(source)
    run(source)


if __name__ == "__main__":
    main()