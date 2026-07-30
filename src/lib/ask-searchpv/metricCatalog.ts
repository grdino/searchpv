// src/lib/ask-searchpv/metricCatalog.ts

export const METRIC_IDS = [
  "active_listing_count",
  "pending_listing_count",
  "closed_sale_count",

  "inventory_value",

  "median_list_price",
  "average_list_price",

  "median_sold_price",
  "average_sold_price",

  "median_price_per_sqft",
  "average_price_per_sqft",

  "median_price_per_sqm",
  "average_price_per_sqm",

  "median_dom",
  "average_dom",

  "months_inventory",

  "average_sold_to_list_ratio",
  "median_sold_to_list_ratio",

  "average_sold_to_original_list_ratio",
  "median_sold_to_original_list_ratio",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export type MetricValueType =
  | "count"
  | "currency"
  | "currency_per_sqft"
  | "currency_per_sqm"
  | "days"
  | "months"
  | "percentage";

export type MetricDataCategory =
  | "active_inventory"
  | "pending_inventory"
  | "closed_sales"
  | "market_snapshot";

export interface MetricDefinition {
  id: MetricId;
  label: string;
  shortLabel: string;
  description: string;
  valueType: MetricValueType;
  dataCategory: MetricDataCategory;

  supportedPeriods: Array<
    | "latest_snapshot"
    | "rolling_months"
    | "calendar_year"
    | "date_range"
  >;

  aliases: string[];

  higherIsGenerallyBetter?: boolean;
  caution?: string;
}

export const METRIC_CATALOG: Record<MetricId, MetricDefinition> = {
  active_listing_count: {
    id: "active_listing_count",
    label: "Active Listings",
    shortLabel: "Active",
    description:
      "The number of listings classified as active in the selected geography and latest available inventory snapshot.",
    valueType: "count",
    dataCategory: "active_inventory",
    supportedPeriods: ["latest_snapshot"],
    aliases: [
      "active listings",
      "active inventory",
      "homes for sale",
      "properties for sale",
      "available listings",
      "current listings",
    ],
  },

  pending_listing_count: {
    id: "pending_listing_count",
    label: "Pending Listings",
    shortLabel: "Pending",
    description:
      "The number of listings classified as pending in the selected geography and latest available inventory snapshot.",
    valueType: "count",
    dataCategory: "pending_inventory",
    supportedPeriods: ["latest_snapshot"],
    aliases: [
      "pending listings",
      "pending sales",
      "properties under contract",
      "under contract",
      "accepted offers",
    ],
  },

  closed_sale_count: {
    id: "closed_sale_count",
    label: "Closed Sales",
    shortLabel: "Sales",
    description:
      "The number of completed sales within the selected geography and reporting period.",
    valueType: "count",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "closed sales",
      "sold listings",
      "sales count",
      "number sold",
      "properties sold",
      "transactions",
    ],
  },

  inventory_value: {
    id: "inventory_value",
    label: "Total Inventory Value",
    shortLabel: "Inventory Value",
    description:
      "The combined current asking price of listings included in the selected inventory snapshot.",
    valueType: "currency",
    dataCategory: "active_inventory",
    supportedPeriods: ["latest_snapshot"],
    aliases: [
      "inventory value",
      "total listing value",
      "value of active inventory",
      "combined asking price",
    ],
    caution:
      "This is the sum of asking prices, not an estimate of actual market value or expected sale proceeds.",
  },

  median_list_price: {
    id: "median_list_price",
    label: "Median List Price",
    shortLabel: "Median List",
    description:
      "The middle current asking price when the selected listings are ordered from lowest to highest.",
    valueType: "currency",
    dataCategory: "active_inventory",
    supportedPeriods: ["latest_snapshot"],
    aliases: [
      "median list price",
      "median asking price",
      "typical asking price",
      "median price",
    ],
  },

  average_list_price: {
    id: "average_list_price",
    label: "Average List Price",
    shortLabel: "Average List",
    description:
      "The arithmetic mean of the current asking prices for the selected listings.",
    valueType: "currency",
    dataCategory: "active_inventory",
    supportedPeriods: ["latest_snapshot"],
    aliases: [
      "average list price",
      "average asking price",
      "mean list price",
    ],
    caution:
      "A small number of very high-priced properties can materially increase an average.",
  },

  median_sold_price: {
    id: "median_sold_price",
    label: "Median Sold Price",
    shortLabel: "Median Sold",
    description:
      "The middle recorded sold price when completed sales are ordered from lowest to highest.",
    valueType: "currency",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median sold price",
      "median sale price",
      "typical sold price",
      "median closing price",
    ],
  },

  average_sold_price: {
    id: "average_sold_price",
    label: "Average Sold Price",
    shortLabel: "Average Sold",
    description:
      "The arithmetic mean of recorded sold prices for completed sales in the selected period.",
    valueType: "currency",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average sold price",
      "average sale price",
      "mean sold price",
      "average closing price",
    ],
    caution:
      "A small number of high-value sales can materially increase an average.",
  },

  median_price_per_sqft: {
    id: "median_price_per_sqft",
    label: "Median Price per Square Foot",
    shortLabel: "Median $/ft²",
    description:
      "The median price per interior square foot for the selected listings or completed sales.",
    valueType: "currency_per_sqft",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median price per square foot",
      "median price per sqft",
      "median dollars per square foot",
      "median $ per foot",
      "median $/ft2",
      "median $/ft²",
    ],
    caution:
      "Comparability depends on consistent area measurements and similar property types.",
  },

  average_price_per_sqft: {
    id: "average_price_per_sqft",
    label: "Average Price per Square Foot",
    shortLabel: "Average $/ft²",
    description:
      "The arithmetic mean price per interior square foot for the selected listings or completed sales.",
    valueType: "currency_per_sqft",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average price per square foot",
      "average price per sqft",
      "average dollars per square foot",
      "average $ per foot",
      "average $/ft2",
      "average $/ft²",
    ],
    caution:
      "Comparability depends on consistent area measurements and similar property types.",
  },

  median_price_per_sqm: {
    id: "median_price_per_sqm",
    label: "Median Price per Square Meter",
    shortLabel: "Median $/m²",
    description:
      "The median price per interior square meter for the selected listings or completed sales.",
    valueType: "currency_per_sqm",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median price per square meter",
      "median price per sqm",
      "median dollars per square meter",
      "median $ per meter",
      "median $/m2",
      "median $/m²",
    ],
    caution:
      "Comparability depends on consistent area measurements and similar property types.",
  },

  average_price_per_sqm: {
    id: "average_price_per_sqm",
    label: "Average Price per Square Meter",
    shortLabel: "Average $/m²",
    description:
      "The arithmetic mean price per interior square meter for the selected listings or completed sales.",
    valueType: "currency_per_sqm",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average price per square meter",
      "average price per sqm",
      "average dollars per square meter",
      "average $ per meter",
      "average $/m2",
      "average $/m²",
    ],
    caution:
      "Comparability depends on consistent area measurements and similar property types.",
  },

  median_dom: {
    id: "median_dom",
    label: "Median Days on Market",
    shortLabel: "Median DOM",
    description:
      "The middle number of days on market when the selected listings or sales are ordered from lowest to highest.",
    valueType: "days",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median days on market",
      "median dom",
      "typical days on market",
      "how long properties take to sell",
    ],
  },

  average_dom: {
    id: "average_dom",
    label: "Average Days on Market",
    shortLabel: "Average DOM",
    description:
      "The arithmetic mean number of days on market for the selected listings or completed sales.",
    valueType: "days",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average days on market",
      "average dom",
      "mean days on market",
    ],
    caution:
      "Long-running listings can materially increase an average.",
  },

  months_inventory: {
    id: "months_inventory",
    label: "Months of Inventory",
    shortLabel: "Months Inventory",
    description:
      "An estimate of how many months the current inventory could last at the recent pace of completed sales.",
    valueType: "months",
    dataCategory: "market_snapshot",
    supportedPeriods: [
      "latest_snapshot",
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "months of inventory",
      "months inventory",
      "inventory months",
      "market supply",
      "months of supply",
    ],
    caution:
      "The result depends on the sales period and calculation method used by the underlying SearchPV report.",
  },

  average_sold_to_list_ratio: {
    id: "average_sold_to_list_ratio",
    label: "Average Sold-to-List Ratio",
    shortLabel: "Avg Sold/List",
    description:
      "The average sold price divided by the final list price, expressed as a percentage.",
    valueType: "percentage",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average sold to list ratio",
      "average sale to list ratio",
      "average percent of asking price",
      "average discount from list price",
    ],
  },

  median_sold_to_list_ratio: {
    id: "median_sold_to_list_ratio",
    label: "Median Sold-to-List Ratio",
    shortLabel: "Median Sold/List",
    description:
      "The median sold price divided by the final list price, expressed as a percentage.",
    valueType: "percentage",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median sold to list ratio",
      "median sale to list ratio",
      "median percent of asking price",
      "median discount from list price",
    ],
  },

  average_sold_to_original_list_ratio: {
    id: "average_sold_to_original_list_ratio",
    label: "Average Sold-to-Original-List Ratio",
    shortLabel: "Avg Sold/Original",
    description:
      "The average sold price divided by the original list price, expressed as a percentage.",
    valueType: "percentage",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "average sold to original list ratio",
      "average sale to original asking ratio",
      "average discount from original price",
    ],
  },

  median_sold_to_original_list_ratio: {
    id: "median_sold_to_original_list_ratio",
    label: "Median Sold-to-Original-List Ratio",
    shortLabel: "Median Sold/Original",
    description:
      "The median sold price divided by the original list price, expressed as a percentage.",
    valueType: "percentage",
    dataCategory: "closed_sales",
    supportedPeriods: [
      "rolling_months",
      "calendar_year",
      "date_range",
    ],
    aliases: [
      "median sold to original list ratio",
      "median sale to original asking ratio",
      "median discount from original price",
    ],
  },
};

export const DEFAULT_MARKET_METRICS: MetricId[] = [
  "active_listing_count",
  "pending_listing_count",
  "closed_sale_count",
  "median_sold_price",
  "median_dom",
  "months_inventory",
];

export function isMetricId(value: string): value is MetricId {
  return METRIC_IDS.includes(value as MetricId);
}

export function getMetricDefinition(
  metricId: MetricId,
): MetricDefinition {
  return METRIC_CATALOG[metricId];
}

export function getMetricDefinitions(
  metricIds: MetricId[],
): MetricDefinition[] {
  return metricIds.map((metricId) => METRIC_CATALOG[metricId]);
}

export function findMetricByAlias(
  input: string,
): MetricDefinition | undefined {
  const normalizedInput = normalizeMetricText(input);

  return Object.values(METRIC_CATALOG).find((metric) => {
    if (normalizeMetricText(metric.label) === normalizedInput) {
      return true;
    }

    if (normalizeMetricText(metric.shortLabel) === normalizedInput) {
      return true;
    }

    return metric.aliases.some(
      (alias) => normalizeMetricText(alias) === normalizedInput,
    );
  });
}

function normalizeMetricText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[²]/g, "2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}