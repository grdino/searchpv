export type MarketSegment = "all" | "pre_construction" | "resale";
export type PropertyTypeSegment = "all" | "condos" | "houses";

export type PropertySearchFilters = {
  market: MarketSegment;
  propertyType: PropertyTypeSegment;

  zone: string | null;
  area: string | null;
  community: string | null;
  development: string | null;

  minBeds: number | null;
  maxBeds: number | null;

  minBaths: number | null;
  maxBaths: number | null;

  minPrice: number | null;
  maxPrice: number | null;

  waterfront: boolean;
  oceanView: boolean;
  petFriendly: boolean;
  pool: boolean;
  parking: boolean;
  furnished: boolean;

  minHoa: number | null;
  maxHoa: number | null;
};

export const DEFAULT_PROPERTY_SEARCH_FILTERS: PropertySearchFilters = {
  market: "all",
  propertyType: "all",

  zone: "Puerto Vallarta",
  area: null,
  community: null,
  development: null,

  minBeds: null,
  maxBeds: null,

  minBaths: null,
  maxBaths: null,

  minPrice: null,
  maxPrice: null,

  waterfront: false,
  oceanView: false,
  petFriendly: false,
  pool: false,
  parking: false,
  furnished: false,

  minHoa: null,
  maxHoa: null,
};

type SearchParamValue = string | string[] | undefined;

export type PropertySearchParams = Record<string, SearchParamValue>;

export function parsePropertySearchFilters(
  params: PropertySearchParams
): PropertySearchFilters {
  return {
    market: parseMarketSegment(params.market),
    propertyType: parsePropertyTypeSegment(params.propertyType),

    zone: parseNullableText(params.zone) ?? "Puerto Vallarta",
    area: parseNullableText(params.area),
    community: parseNullableText(params.community),
    development: parseNullableText(params.development),

    minBeds: parseNullableNonNegativeNumber(params.minBeds),
    maxBeds: parseNullableNonNegativeNumber(params.maxBeds),

    minBaths: parseNullableNonNegativeNumber(params.minBaths),
    maxBaths: parseNullableNonNegativeNumber(params.maxBaths),

    minPrice: parseNullableNonNegativeNumber(params.minPrice),
    maxPrice: parseNullableNonNegativeNumber(params.maxPrice),

    waterfront: parseBoolean(params.waterfront),
    oceanView: parseBoolean(params.oceanView),
    petFriendly: parseBoolean(params.petFriendly),
    pool: parseBoolean(params.pool),
    parking: parseBoolean(params.parking),
    furnished: parseBoolean(params.furnished),

    minHoa: parseNullableNonNegativeNumber(params.minHoa),
    maxHoa: parseNullableNonNegativeNumber(params.maxHoa),
  };
}

export function propertySearchFiltersToParams(
  filters: PropertySearchFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.market !== "all") {
    params.set("market", filters.market);
  }

  if (filters.propertyType !== "all") {
    params.set("propertyType", filters.propertyType);
  }

  if (filters.zone && filters.zone !== "Puerto Vallarta") {
    params.set("zone", filters.zone);
  }

  if (filters.area) {
    params.set("area", filters.area);
  }

  if (filters.community) {
    params.set("community", filters.community);
  }

  if (filters.development) {
    params.set("development", filters.development);
  }

  setNullableNumber(params, "minBeds", filters.minBeds);
  setNullableNumber(params, "maxBeds", filters.maxBeds);

  setNullableNumber(params, "minBaths", filters.minBaths);
  setNullableNumber(params, "maxBaths", filters.maxBaths);

  setNullableNumber(params, "minPrice", filters.minPrice);
  setNullableNumber(params, "maxPrice", filters.maxPrice);

  if (filters.waterfront) params.set("waterfront", "1");
  if (filters.oceanView) params.set("oceanView", "1");
  if (filters.petFriendly) params.set("petFriendly", "1");
  if (filters.pool) params.set("pool", "1");
  if (filters.parking) params.set("parking", "1");
  if (filters.furnished) params.set("furnished", "1");

  setNullableNumber(params, "minHoa", filters.minHoa);
  setNullableNumber(params, "maxHoa", filters.maxHoa);

  return params;
}

export function hasAdvancedPropertyFilters(
  filters: PropertySearchFilters
): boolean {
  return (
    filters.minBeds !== null ||
    filters.maxBeds !== null ||
    filters.minBaths !== null ||
    filters.maxBaths !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.waterfront ||
    filters.oceanView ||
    filters.petFriendly ||
    filters.pool ||
    filters.parking ||
    filters.furnished ||
    filters.minHoa !== null ||
    filters.maxHoa !== null
  );
}

export function buildPropertySearchUrl(
  filters: PropertySearchFilters,
  pathname = "/search-properties",
  hash = "market-explorer"
): string {
  const params = propertySearchFiltersToParams(filters);
  const query = params.toString();

  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export function withPropertySearchFilters(
  current: PropertySearchFilters,
  updates: Partial<PropertySearchFilters>
): PropertySearchFilters {
  return {
    ...current,
    ...updates,
  };
}

function parseMarketSegment(value: SearchParamValue): MarketSegment {
  const normalized = firstValue(value);

  if (normalized === "pre_construction") return "pre_construction";
  if (normalized === "resale") return "resale";

  return "all";
}

function parsePropertyTypeSegment(
  value: SearchParamValue
): PropertyTypeSegment {
  const normalized = firstValue(value);

  if (normalized === "condos") return "condos";
  if (normalized === "houses") return "houses";

  return "all";
}

function parseNullableText(value: SearchParamValue): string | null {
  const normalized = firstValue(value)?.trim();

  if (!normalized || normalized === "all") {
    return null;
  }

  return normalized;
}

function parseNullableNonNegativeNumber(
  value: SearchParamValue
): number | null {
  const normalized = firstValue(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseBoolean(value: SearchParamValue): boolean {
  const normalized = firstValue(value)?.toLowerCase();

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function setNullableNumber(
  params: URLSearchParams,
  key: string,
  value: number | null
) {
  if (value !== null) {
    params.set(key, String(value));
  }
}
