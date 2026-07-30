// src/lib/ask-searchpv/services/property-search.ts

import { createClient } from "@/lib/supabase/server";

import type {
  ListingTableRow,
  PropertySearchParameters,
} from "../types";

const DEFAULT_RESULT_LIMIT = 20;
const MAX_RESULT_LIMIT = 50;

const DEFAULT_STATUSES = ["active"] as const;

type SupportedPropertyStatus =
  | "active"
  | "pending"
  | "closed";

interface PropertySearchRpcRow {
  status_cd: SupportedPropertyStatus;

  lstng_ky: number | string;
  prprty_ky: number | string;
  mls: number | string;

  address: string | null;
  development_name: string | null;
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;

  property_type: string | null;
  property_type_cd: string | null;

  market_type: string | null;
  market_segment: string | null;
  pre_construction: boolean | null;

  beds: number | string | null;
  baths: number | string | null;

  sqft: number | string | null;
  sqm: number | string | null;

  lot_sqft: number | string | null;
  lot_sqm: number | string | null;

  original_price: number | string | null;
  list_price: number | string | null;
  sold_price: number | string | null;

  price_per_sqft: number | string | null;
  price_per_sqm: number | string | null;

  dom: number | string | null;
  year_built: number | string | null;

  primary_view: string | null;
  secondary_view: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  building_name: string | null;
  unit_id: string | null;

  snapshot_date: string | null;
  sold_date: string | null;

  data_current_as_of: string | null;

  href: string | null;

  total_count: number | string;
}

export interface PropertySearchResult {
  rows: ListingTableRow[];
  totalCount: number;
  resultLimit: number;
  resultOffset: number;
  dataCurrentAsOf?: string;
  warnings: string[];
}

interface NormalizedPropertySearchParameters {
  filters: PropertySearchParameters["filters"];
  statuses: SupportedPropertyStatus[];
  sort: string;
  limit: number;
  offset: number;
}

export async function searchProperties(
  parameters: PropertySearchParameters,
): Promise<PropertySearchResult> {
  const normalized =
    normalizePropertySearchParameters(parameters);

  const geographyEntityKeys =
    getResolvedGeographyEntityKeys(
      normalized.filters.geography ?? [],
    );

  const propertyTypeCodes =
    normalizeStringArray(
      normalized.filters.propertyTypeCode,
    );

  const marketSegments =
    normalizeMarketSegments(
      normalized.filters.marketType,
    );

  const supabase = await createClient();

  const rpcParameters = {
    p_statuses: normalized.statuses,

    p_geography_entity_kys:
      geographyEntityKeys.length > 0
        ? geographyEntityKeys
        : null,

    p_property_type_cds:
      propertyTypeCodes.length > 0
        ? propertyTypeCodes
        : null,

    p_market_segments:
      marketSegments.length > 0
        ? marketSegments
        : null,

    p_min_price:
      normalized.filters.minPrice ?? null,

    p_max_price:
      normalized.filters.maxPrice ?? null,

    p_min_beds:
      normalized.filters.minBeds ?? null,

    p_max_beds:
      normalized.filters.maxBeds ?? null,

    p_min_baths:
      normalized.filters.minBaths ?? null,

    p_max_baths:
      normalized.filters.maxBaths ?? null,

    p_min_sqft:
      normalized.filters.minSqft ?? null,

    p_max_sqft:
      normalized.filters.maxSqft ?? null,

    p_min_sqm:
      normalized.filters.minSqm ?? null,

    p_max_sqm:
      normalized.filters.maxSqm ?? null,

    p_min_lot_sqft:
      normalized.filters.minLotSqft ?? null,

    p_max_lot_sqft:
      normalized.filters.maxLotSqft ?? null,

    p_min_lot_sqm:
      normalized.filters.minLotSqm ?? null,

    p_max_lot_sqm:
      normalized.filters.maxLotSqm ?? null,

    p_min_year_built:
      normalized.filters.minYearBuilt ?? null,

    p_max_year_built:
      normalized.filters.maxYearBuilt ?? null,

    p_max_dom:
      normalized.filters.maxDom ?? null,

    p_primary_view:
      normalized.filters.primaryView ?? null,

    p_secondary_view:
      normalized.filters.secondaryView ?? null,

    p_pre_construction:
      normalized.filters.preConstruction ?? null,

    p_sold_date_from: null,
    p_sold_date_to: null,

    p_search_text:
      geographyEntityKeys.length === 0
        ? parameters.searchText ?? null
        : null,

    p_sort: normalized.sort,
    p_limit: normalized.limit,
    p_offset: normalized.offset,
  };

  console.log(
    "ai_property_search_v2 parameters:",
    JSON.stringify(rpcParameters, null, 2),
  );

  const { data, error } = await supabase.rpc(
    "ai_property_search_v2",
    rpcParameters,
  );

  if (error) {
    throw new Error(
      `Unable to search properties: ${error.message}`,
    );
  }

  const rpcRows =
    (data ?? []) as PropertySearchRpcRow[];

  const rows = rpcRows.map(mapPropertySearchRow);

  const firstRow = rpcRows[0];

  return {
    rows,
    totalCount:
      toNullableNumber(firstRow?.total_count) ??
      rows.length,
    resultLimit: normalized.limit,
    resultOffset: normalized.offset,
    dataCurrentAsOf:
      firstRow?.data_current_as_of ?? undefined,
    warnings: buildSearchWarnings(normalized),
  };
}

function normalizePropertySearchParameters(
  parameters: PropertySearchParameters,
): NormalizedPropertySearchParameters {
  const filters = parameters.filters ?? {};

  validateNumericRange(
    "price",
    filters.minPrice,
    filters.maxPrice,
  );

  validateNumericRange(
    "bedrooms",
    filters.minBeds,
    filters.maxBeds,
  );

  validateNumericRange(
    "bathrooms",
    filters.minBaths,
    filters.maxBaths,
  );

  validateNumericRange(
    "square feet",
    filters.minSqft,
    filters.maxSqft,
  );

  validateNumericRange(
    "square meters",
    filters.minSqm,
    filters.maxSqm,
  );

  validateNumericRange(
    "lot square feet",
    filters.minLotSqft,
    filters.maxLotSqft,
  );

  validateNumericRange(
    "lot square meters",
    filters.minLotSqm,
    filters.maxLotSqm,
  );

  validateNumericRange(
    "year built",
    filters.minYearBuilt,
    filters.maxYearBuilt,
  );

  validateNonNegativeNumber(
    "maximum days on market",
    filters.maxDom,
  );

  const statuses =
    normalizeStatuses(filters.statuses);

  return {
    filters,
    statuses,
    sort: normalizeSort(parameters.sort),
    limit: clampResultLimit(parameters.limit),
    offset: 0,
  };
}

function normalizeStatuses(
  statuses:
    | readonly string[]
    | undefined,
): SupportedPropertyStatus[] {
  if (!statuses?.length) {
    return [...DEFAULT_STATUSES];
  }

  const normalized = statuses
    .map((status) =>
      status.trim().toLowerCase(),
    )
    .filter(
      (
        status,
      ): status is SupportedPropertyStatus =>
        status === "active" ||
        status === "pending" ||
        status === "closed",
    );

  if (normalized.length === 0) {
    return [...DEFAULT_STATUSES];
  }

  return [...new Set(normalized)];
}

function getResolvedGeographyEntityKeys(
  geographies:
    | PropertySearchParameters["filters"]["geography"]
    | undefined,
): number[] {
  if (!geographies?.length) {
    return [];
  }

  const unresolved = geographies.filter(
    (geography) =>
      !geography.resolved ||
      geography.entityKey === undefined,
  );

  if (unresolved.length > 0) {
    const names = unresolved
      .map((geography) => geography.inputText)
      .join(", ");

    throw new Error(
      `Property search received unresolved geography: ${names}.`,
    );
  }

  return [
    ...new Set(
      geographies
        .map((geography) => geography.entityKey)
        .filter(
          (entityKey): entityKey is number =>
            entityKey !== undefined,
        ),
    ),
  ];
}

function normalizeStringArray(
  value:
    | string
    | readonly string[]
    | null
    | undefined,
): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  const values =
    typeof value === "string"
      ? [value]
      : [...value];

  return [
    ...new Set(
      values
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeMarketSegments(
  value:
    | string
    | readonly string[]
    | null
    | undefined,
): string[] {
  return normalizeStringArray(value)
    .map((item) =>
      item
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_"),
    )
    .map((item) => {
      if (
        item === "preconstruction" ||
        item === "pre_construct"
      ) {
        return "pre_construction";
      }

      return item;
    });
}

function normalizeSort(
  sort: string | undefined,
): string {
  const normalized =
    sort?.trim().toLowerCase() ??
    "relevance";

  const supportedSorts = new Set([
    "relevance",
    "price_asc",
    "price_desc",
    "dom_asc",
    "dom_desc",
    "sqft_desc",
    "newest",
  ]);

  return supportedSorts.has(normalized)
    ? normalized
    : "relevance";
}

function clampResultLimit(
  limit: number | undefined,
): number {
  if (
    limit === undefined ||
    !Number.isFinite(limit)
  ) {
    return DEFAULT_RESULT_LIMIT;
  }

  return Math.min(
    MAX_RESULT_LIMIT,
    Math.max(1, Math.floor(limit)),
  );
}

function validateNumericRange(
  label: string,
  minimum: number | undefined,
  maximum: number | undefined,
): void {
  validateNonNegativeNumber(
    `minimum ${label}`,
    minimum,
  );

  validateNonNegativeNumber(
    `maximum ${label}`,
    maximum,
  );

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    minimum > maximum
  ) {
    throw new Error(
      `The minimum ${label} cannot exceed the maximum ${label}.`,
    );
  }
}

function validateNonNegativeNumber(
  label: string,
  value: number | undefined,
): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value)) {
    throw new Error(
      `The ${label} must be a valid number.`,
    );
  }

  if (value < 0) {
    throw new Error(
      `The ${label} cannot be negative.`,
    );
  }
}

function mapPropertySearchRow(
  row: PropertySearchRpcRow,
): ListingTableRow {
  const mls = Number(row.mls);

  if (!Number.isFinite(mls)) {
    throw new Error(
      "Property search returned a row with an invalid MLS number.",
    );
  }

  return {
    mls,

    address: row.address,
    developmentName: row.development_name,

    zoneName: row.zone_name,
    areaName: row.area_name,
    communityName: row.community_name,

    propertyType: row.property_type,
    marketType: row.market_type,

    beds: toNullableNumber(row.beds),
    baths: toNullableNumber(row.baths),

    sqft: toNullableNumber(row.sqft),
    sqm: toNullableNumber(row.sqm),

    currentPrice:
      toNullableNumber(row.list_price),

    soldPrice:
      toNullableNumber(row.sold_price),

    pricePerSqft:
      toNullableNumber(row.price_per_sqft),

    pricePerSqm:
      toNullableNumber(row.price_per_sqm),

    dom: toNullableNumber(row.dom),

    snapshotDate: row.snapshot_date,
    soldDate: row.sold_date,

    href: row.href ?? undefined,
  };
}

function buildSearchWarnings(
  parameters: NormalizedPropertySearchParameters,
): string[] {
  const warnings: string[] = [];

  const includesClosed =
    parameters.statuses.includes("closed");

  if (
    includesClosed &&
    (
      parameters.filters.minLotSqft !== undefined ||
      parameters.filters.maxLotSqft !== undefined ||
      parameters.filters.minLotSqm !== undefined ||
      parameters.filters.maxLotSqm !== undefined ||
      parameters.filters.minYearBuilt !== undefined ||
      parameters.filters.maxYearBuilt !== undefined ||
      parameters.filters.primaryView !== undefined ||
      parameters.filters.secondaryView !== undefined
    )
  ) {
    warnings.push(
      "Closed-sale records do not currently include lot size, year built, or view fields. Closed rows will not match filters that require those fields.",
    );
  }

  return warnings;
}

function toNullableNumber(
  value:
    | number
    | string
    | null
    | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}