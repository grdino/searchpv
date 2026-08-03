// src/lib/ask-searchpv/services/market-statistics.ts

import { createClient } from "@/lib/supabase/server";

import {
  METRIC_CATALOG,
  METRIC_IDS,
  type MetricId,
} from "../metricCatalog";

import type {
  MarketStatisticsParameters,
} from "../types";

const DEFAULT_METRIC_IDS: readonly MetricId[] = [
  "active_listing_count",
  "pending_listing_count",
  "closed_sale_count",
  "median_list_price",
  "median_sold_price",
  "average_price_per_sqft",
  "average_dom",
  "months_inventory",
];

const SUPPORTED_ENTITY_TYPES = [
  "ZN",
  "AR",
  "CM",
  "DV",
] as const;

type SupportedEntityType =
  (typeof SUPPORTED_ENTITY_TYPES)[number];

type SnapshotView =
  | "zone_snapshot"
  | "area_snapshot"
  | "community_snapshot"
  | "development_snapshot";

type SnapshotColumn =
  | "active_count"
  | "pending_count"
  | "sales_12mo"
  | "avg_list_price"
  | "median_list_price"
  | "avg_list_price_ft2"
  | "avg_list_price_m2"
  | "avg_sold_price"
  | "median_sold_price"
  | "avg_sold_price_ft2"
  | "median_sold_price_ft2"
  | "avg_sold_price_m2"
  | "median_sold_price_m2"
  | "current_avg_dom"
  | "sold_avg_dom_12mo"
  | "months_inventory";

interface SnapshotViewDefinition {
  view: SnapshotView;
  geographyNameColumn:
    | "zone_name"
    | "area_name"
    | "community_name"
    | "development_name";
  geographySlugColumn:
    | "zone_slug"
    | "area_slug"
    | "community_slug"
    | "development_slug";
}

const SNAPSHOT_VIEW_BY_ENTITY_TYPE: Record<
  SupportedEntityType,
  SnapshotViewDefinition
> = {
  ZN: {
    view: "zone_snapshot",
    geographyNameColumn: "zone_name",
    geographySlugColumn: "zone_slug",
  },
  AR: {
    view: "area_snapshot",
    geographyNameColumn: "area_name",
    geographySlugColumn: "area_slug",
  },
  CM: {
    view: "community_snapshot",
    geographyNameColumn: "community_name",
    geographySlugColumn: "community_slug",
  },
  DV: {
    view: "development_snapshot",
    geographyNameColumn: "development_name",
    geographySlugColumn: "development_slug",
  },
};

interface SnapshotRow {
  zone_name?: string | null;
  zone_slug?: string | null;

  area_name?: string | null;
  area_slug?: string | null;

  community_name?: string | null;
  community_slug?: string | null;

  development_name?: string | null;
  development_slug?: string | null;

  snapshot_date: string | null;
  sales_period_start: string | null;
  sales_period_end: string | null;

  market_segment: string | null;
  property_type_segment: string | null;

  active_count: number | string | null;
  pending_count: number | string | null;
  sales_12mo: number | string | null;

  avg_list_price: number | string | null;
  median_list_price: number | string | null;
  avg_list_price_ft2?: number | string | null;
  avg_list_price_m2?: number | string | null;

  avg_sold_price: number | string | null;
  median_sold_price: number | string | null;
  avg_sold_price_ft2?: number | string | null;
  median_sold_price_ft2?: number | string | null;
  avg_sold_price_m2?: number | string | null;
  median_sold_price_m2?: number | string | null;

  current_avg_dom: number | string | null;
  sold_avg_dom_12mo: number | string | null;
  months_inventory: number | string | null;

  [column: string]: unknown;
}

export interface MarketStatisticValue {
  metricId: MetricId;
  label: string;
  shortLabel: string;
  description: string;
  valueType:
    (typeof METRIC_CATALOG)[MetricId]["valueType"];
  value: number | null;
  sourceColumn?: string;
  dataCategory:
    (typeof METRIC_CATALOG)[MetricId]["dataCategory"];
}

export interface MarketStatisticsGeography {
  entityKey: number;
  entityTypeCd: SupportedEntityType;
  canonicalName: string;
  slug?: string;
  inputText?: string;
}

export interface MarketStatisticsResult {
  geography: MarketStatisticsGeography;
  sourceView: SnapshotView;
  snapshotDate?: string;
  salesPeriodStart?: string;
  salesPeriodEnd?: string;
  marketSegment: string;
  propertyTypeSegment: string;
  metrics: MarketStatisticValue[];
  warnings: string[];
}

interface NormalizedMarketStatisticsParameters {
  geography: MarketStatisticsGeography;
  metricIds: MetricId[];
  marketSegment: string;
  propertyTypeSegment: string;
  priceContext: "active" | "sold";
  domContext: "active" | "sold";
}

interface MetricSource {
  column?: SnapshotColumn;
  warning?: string;
}

/**
 * Load one market-statistics snapshot for a resolved geography.
 *
 * All market calculations remain in the reporting views. This
 * service validates the request, chooses the correct view, applies
 * deterministic filters, and maps database columns to MetricIds.
 */
export async function getMarketStatistics(
  parameters: MarketStatisticsParameters,
): Promise<MarketStatisticsResult> {
  const normalized =
    normalizeMarketStatisticsParameters(parameters);

  const viewDefinition =
    SNAPSHOT_VIEW_BY_ENTITY_TYPE[
      normalized.geography.entityTypeCd
    ];

  const supabase = await createClient();

  let query = supabase
    .from(viewDefinition.view)
    .select("*")
    .eq(
      "market_segment",
      normalized.marketSegment,
    )
    .eq(
      "property_type_segment",
      normalized.propertyTypeSegment,
    );

  if (normalized.geography.slug) {
    query = query.eq(
      viewDefinition.geographySlugColumn,
      normalized.geography.slug,
    );
  } else {
    query = query.eq(
      viewDefinition.geographyNameColumn,
      normalized.geography.canonicalName,
    );
  }

  const { data, error } = await query
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load market statistics from public.${viewDefinition.view}: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      buildNoSnapshotMessage(
        normalized,
        viewDefinition,
      ),
    );
  }

  const row = data as SnapshotRow;

  const warnings: string[] = [];

  const metrics = normalized.metricIds.map(
    (metricId) =>
      mapMetricValue(
        metricId,
        row,
        normalized,
        viewDefinition.view,
        warnings,
      ),
  );

  if (
    normalized.marketSegment === "all" &&
    normalized.propertyTypeSegment === "all"
  ) {
    warnings.push(
      "Statistics include all market segments and all property types.",
    );
  }

  return {
    geography: normalized.geography,
    sourceView: viewDefinition.view,
    snapshotDate: row.snapshot_date ?? undefined,
    salesPeriodStart:
      row.sales_period_start ?? undefined,
    salesPeriodEnd:
      row.sales_period_end ?? undefined,
    marketSegment: normalized.marketSegment,
    propertyTypeSegment:
      normalized.propertyTypeSegment,
    metrics,
    warnings: [...new Set(warnings)],
  };
}

function normalizeMarketStatisticsParameters(
  parameters: MarketStatisticsParameters,
): NormalizedMarketStatisticsParameters {
  const raw = parameters as unknown as Record<
    string,
    unknown
  >;

  const geography = normalizeGeography(
    raw.geography ??
      raw.resolvedGeography ??
      readNestedValue(raw, "filters", "geography"),
  );

  const metricIds = normalizeMetricIds(
    raw.metricIds ?? raw.metrics,
  );

  const marketSegment = normalizeSegment(
    raw.marketSegment ??
      readNestedValue(raw, "filters", "marketSegment") ??
      readNestedValue(raw, "filters", "marketType"),
    "all",
  );

  const propertyTypeSegment = normalizeSegment(
    raw.propertyTypeSegment ??
      readNestedValue(
        raw,
        "filters",
        "propertyTypeSegment",
      ) ??
      readNestedValue(
        raw,
        "filters",
        "propertyType",
      ),
    "all",
  );

  const context = normalizeContext(
    raw.context ?? raw.metricContext,
  );

  return {
    geography,
    metricIds,
    marketSegment,
    propertyTypeSegment,
    priceContext: context,
    domContext: context,
  };
}

function normalizeGeography(
  value: unknown,
): MarketStatisticsGeography {
  const candidate = Array.isArray(value)
    ? value[0]
    : value;

  if (!isRecord(candidate)) {
    throw new Error(
      "Market statistics require one resolved geography.",
    );
  }

  if (candidate.resolved === false) {
    throw new Error(
      `Market statistics received unresolved geography: ${String(
        candidate.inputText ?? "unknown geography",
      )}.`,
    );
  }

  const entityKey = toRequiredInteger(
    candidate.entityKey ?? candidate.entity_ky,
    "geography entity key",
  );

  const entityTypeCd = normalizeEntityType(
    candidate.entityTypeCd ??
    candidate.entity_type_cd ??
    candidate.entityType,
  );

  const canonicalName = firstNonEmptyString([
    candidate.canonicalName,
    candidate.canonicalNm,
    candidate.canonical_nm,
    candidate.name,
  ]);

  if (!canonicalName) {
    throw new Error(
      "Resolved geography is missing its canonical name.",
    );
  }

  const slug = firstNonEmptyString([
    candidate.slug,
    candidate.entitySlug,
    candidate.entity_slug,
  ]);

  const inputText = firstNonEmptyString([
    candidate.inputText,
    candidate.searchText,
  ]);

  return {
    entityKey,
    entityTypeCd,
    canonicalName,
    slug: slug ?? undefined,
    inputText: inputText ?? undefined,
  };
}

function normalizeEntityType(
  value: unknown,
): SupportedEntityType {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "zn":
    case "zone":
      return "ZN";

    case "ar":
    case "area":
      return "AR";

    case "cm":
    case "community":
      return "CM";

    case "dv":
    case "development":
      return "DV";
  }

  throw new Error(
    `Market statistics support Zone, Area, Community, and Development geographies. Received: ${normalized || "unknown"}.`,
  );
}

function normalizeMetricIds(
  value: unknown,
): MetricId[] {
  if (value === undefined || value === null) {
    return [...DEFAULT_METRIC_IDS];
  }

  const values = Array.isArray(value)
    ? value
    : [value];

  const supported = new Set<string>(METRIC_IDS);

  const normalized = values
    .map((item) =>
      String(item).trim().toLowerCase(),
    )
    .filter(
      (item): item is MetricId =>
        supported.has(item),
    );

  if (normalized.length === 0) {
    throw new Error(
      "No supported market-statistics metrics were requested.",
    );
  }

  return [...new Set(normalized)];
}

function normalizeSegment(
  value: unknown,
  fallback: string,
): string {
  const first = Array.isArray(value)
    ? value[0]
    : value;

  if (first === undefined || first === null) {
    return fallback;
  }

  const normalized = String(first)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized || normalized === "any") {
    return fallback;
  }

  if (
    normalized === "preconstruction" ||
    normalized === "pre_construct"
  ) {
    return "pre_construction";
  }

  if (
    normalized === "condo" ||
    normalized === "condominiums"
  ) {
    return "condos";
  }

  if (
    normalized === "house" ||
    normalized === "home" ||
    normalized === "homes"
  ) {
    return "houses";
  }

  return normalized;
}

function normalizeContext(
  value: unknown,
): "active" | "sold" {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "active" ||
    normalized === "listing" ||
    normalized === "list"
  ) {
    return "active";
  }

  return "sold";
}

function mapMetricValue(
  metricId: MetricId,
  row: SnapshotRow,
  parameters: NormalizedMarketStatisticsParameters,
  sourceView: SnapshotView,
  warnings: string[],
): MarketStatisticValue {
  const definition = METRIC_CATALOG[metricId];

  const source = getMetricSource(
    metricId,
    parameters,
  );

  if (source.warning) {
    warnings.push(source.warning);
  }

  const value = source.column
    ? toNullableNumber(row[source.column])
    : null;

  if (
    source.column &&
    !(source.column in row)
  ) {
    warnings.push(
      `${definition.label} is not exposed by public.${sourceView}.`,
    );
  } else if (
    source.column &&
    value === null
  ) {
    warnings.push(
      `${definition.label} is unavailable for the selected geography and filters.`,
    );
  }

  return {
    metricId,
    label: definition.label,
    shortLabel: definition.shortLabel,
    description: definition.description,
    valueType: definition.valueType,
    value,
    sourceColumn: source.column,
    dataCategory: definition.dataCategory,
  };
}

function getMetricSource(
  metricId: MetricId,
  parameters: NormalizedMarketStatisticsParameters,
): MetricSource {
  switch (metricId) {
    case "active_listing_count":
      return { column: "active_count" };

    case "pending_listing_count":
      return { column: "pending_count" };

    case "closed_sale_count":
      return { column: "sales_12mo" };

    case "median_list_price":
      return { column: "median_list_price" };

    case "average_list_price":
      return { column: "avg_list_price" };

    case "median_sold_price":
      return { column: "median_sold_price" };

    case "average_sold_price":
      return { column: "avg_sold_price" };

    case "average_price_per_sqft":
      return {
        column:
          parameters.priceContext === "active"
            ? "avg_list_price_ft2"
            : "avg_sold_price_ft2",
      };

    case "median_price_per_sqft":
      if (parameters.priceContext === "active") {
        return {
          warning:
            "Median active-list price per square foot is not currently precomputed in the snapshot views.",
        };
      }

      return { column: "median_sold_price_ft2" };

    case "average_price_per_sqm":
      return {
        column:
          parameters.priceContext === "active"
            ? "avg_list_price_m2"
            : "avg_sold_price_m2",
      };

    case "median_price_per_sqm":
      if (parameters.priceContext === "active") {
        return {
          warning:
            "Median active-list price per square meter is not currently precomputed in the snapshot views.",
        };
      }

      return { column: "median_sold_price_m2" };

    case "average_dom":
      return {
        column:
          parameters.domContext === "active"
            ? "current_avg_dom"
            : "sold_avg_dom_12mo",
      };

    case "months_inventory":
      return { column: "months_inventory" };

    case "inventory_value":
      return {
        warning:
          "Total inventory value is not currently exposed by the geography snapshot views.",
      };

    case "median_dom":
      return {
        warning:
          "Median days on market is not currently exposed by the geography snapshot views.",
      };

    case "average_sold_to_list_ratio":
    case "median_sold_to_list_ratio":
    case "average_sold_to_original_list_ratio":
    case "median_sold_to_original_list_ratio":
      return {
        warning:
          `${METRIC_CATALOG[metricId].label} is available at listing level but is not currently aggregated in the geography snapshot views.`,
      };
  }
}

function buildNoSnapshotMessage(
  parameters: NormalizedMarketStatisticsParameters,
  viewDefinition: SnapshotViewDefinition,
): string {
  return [
    "No market-statistics snapshot was found",
    `for ${parameters.geography.canonicalName}`,
    `in public.${viewDefinition.view}`,
    `with market_segment=${parameters.marketSegment}`,
    `and property_type_segment=${parameters.propertyTypeSegment}.`,
  ].join(" ");
}

function readNestedValue(
  source: Record<string, unknown>,
  parentKey: string,
  childKey: string,
): unknown {
  const parent = source[parentKey];

  if (!isRecord(parent)) {
    return undefined;
  }

  return parent[childKey];
}

function firstNonEmptyString(
  values: unknown[],
): string | null {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function toRequiredInteger(
  value: unknown,
  label: string,
): number {
  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    throw new Error(
      `Resolved geography has an invalid ${label}.`,
    );
  }

  return number;
}

function toNullableNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}