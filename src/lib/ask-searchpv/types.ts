// src/lib/ask-searchpv/types.ts

import type { MetricId } from "./metricCatalog";

export const ASK_SEARCHPV_INTENTS = [
  "property_search",
  "market_statistics",
  "geography_comparison",
  "development_information",
  "site_navigation",
  "clarification_required",
  "unsupported",
] as const;

export type AskSearchPVIntent = (typeof ASK_SEARCHPV_INTENTS)[number];

export const GEOGRAPHY_ENTITY_TYPES = [
  "zone",
  "area",
  "community",
  "development",
  "building",
  "neighborhood",
  "place",
] as const;

export type GeographyEntityType =
  (typeof GEOGRAPHY_ENTITY_TYPES)[number];

export const GEOGRAPHY_MATCH_METHODS = [
  "canonical_exact",
  "variant_exact",
  "normalized_exact",
  "prefix",
  "token",
  "fuzzy",
  "place",
  "unresolved",
] as const;

export type GeographyMatchMethod =
  (typeof GEOGRAPHY_MATCH_METHODS)[number];

export const PROPERTY_STATUS_VALUES = [
  "active",
  "pending",
  "closed",
] as const;

export type PropertyStatus =
  (typeof PROPERTY_STATUS_VALUES)[number];

export const PROPERTY_SORT_VALUES = [
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "oldest",
  "dom_asc",
  "dom_desc",
  "price_per_sqft_asc",
  "price_per_sqft_desc",
] as const;

export type PropertySort =
  (typeof PROPERTY_SORT_VALUES)[number];

export interface AskSearchPVRequest {
  question: string;
  context?: {
    currentPath?: string;
    previousQuestion?: string;
    previousIntent?: AskSearchPVIntent;
  };
  preferences?: {
    currency?: "USD" | "MXN";
    areaUnit?: "sqft" | "sqm";
    resultLimit?: number;
  };
}

export interface GeographyInput {
  rawText: string;
  expectedType?: GeographyEntityType;
}

export interface GeographyHierarchy {
  zone?: {
    entityKey?: number;
    identifier?: string;
    name: string;
    slug?: string;
  };
  area?: {
    entityKey?: number;
    identifier?: string;
    name: string;
    slug?: string;
  };
  community?: {
    entityKey?: number;
    identifier?: string;
    name: string;
    slug?: string;
  };
  development?: {
    entityKey?: number;
    identifier?: string;
    name: string;
    slug?: string;
  };
}

export interface ResolvedGeography {
  inputText: string;
  matchedVariant?: string;
  resolved: boolean;
  entityKey?: number;
  identifier?: string;
  entityType?: GeographyEntityType;
  canonicalName?: string;
  slug?: string;
  matchMethod: GeographyMatchMethod;
  confidence: number;
  hierarchy?: GeographyHierarchy;
  alternatives?: Array<{
    entityKey?: number;
    identifier?: string;
    entityType: GeographyEntityType;
    canonicalName: string;
    confidence: number;
  }>;
}

export interface PropertyFilters {
  statuses?: PropertyStatus[];

  geography?: ResolvedGeography[];

  propertyType?: string;
  propertyTypeCode?: string;
  marketType?: string;

  minPrice?: number;
  maxPrice?: number;

  minBeds?: number;
  maxBeds?: number;

  minBaths?: number;
  maxBaths?: number;

  minSqft?: number;
  maxSqft?: number;

  minSqm?: number;
  maxSqm?: number;

  minLotSqft?: number;
  maxLotSqft?: number;

  minLotSqm?: number;
  maxLotSqm?: number;

  minYearBuilt?: number;
  maxYearBuilt?: number;

  maxDom?: number;

  primaryView?: string;
  secondaryView?: string;

  preConstruction?: boolean;
}

export interface PropertySearchParameters {
  searchText?: string;
  filters: PropertyFilters;
  sort: PropertySort;
  limit: number;
}

export type MarketPeriod =
  | {
      type: "rolling_months";
      months: number;
    }
  | {
      type: "calendar_year";
      year: number;
    }
  | {
      type: "date_range";
      startDate: string;
      endDate: string;
    }
  | {
      type: "latest_snapshot";
    };

export interface MarketStatisticsParameters {
  metricIds: MetricId[];
  geography?: ResolvedGeography;
  period?: MarketPeriod;
  propertyType?: string;
  propertyTypeCode?: string;
  marketSegment?: string;
  bedroomSegment?: string;
}

export interface GeographyComparisonParameters {
  geographies: ResolvedGeography[];
  metricIds: MetricId[];
  period?: MarketPeriod;
  propertyType?: string;
  propertyTypeCode?: string;
  marketSegment?: string;
  bedroomSegment?: string;
}

export interface DevelopmentInformationParameters {
  geography: ResolvedGeography;
  includeProfile?: boolean;
  includeMarketSnapshot?: boolean;
  includeNearbyPlaces?: boolean;
  includeActiveListings?: boolean;
}

export interface SiteNavigationParameters {
  topic?: string;
  destinationType?:
    | "page"
    | "market"
    | "area"
    | "community"
    | "development"
    | "report";
}

export interface AskSearchPVInterpretation {
  intent: AskSearchPVIntent;
  confidence: number;
  summary: string;
  needsClarification: boolean;
  clarificationQuestion?: string;

  propertySearch?: PropertySearchParameters;
  marketStatistics?: MarketStatisticsParameters;
  geographyComparison?: GeographyComparisonParameters;
  developmentInformation?: DevelopmentInformationParameters;
  siteNavigation?: SiteNavigationParameters;
}

export interface AskSearchPVSource {
  id: string;
  label: string;
  sourceType:
    | "view"
    | "function"
    | "table"
    | "page"
    | "profile"
    | "derived";
  sourceName: string;
  dataCurrentAsOf?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

export interface MetricCardBlock {
  type: "metric_cards";
  title?: string;
  metrics: Array<{
    metricId: MetricId;
    label: string;
    value: number | string | null;
    formattedValue?: string;
    definition?: string;
  }>;
}

export interface ListingTableRow {
  mls: number;
  address?: string | null;
  developmentName?: string | null;
  zoneName?: string | null;
  areaName?: string | null;
  communityName?: string | null;
  propertyType?: string | null;
  marketType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  sqm?: number | null;
  currentPrice?: number | null;
  soldPrice?: number | null;
  pricePerSqft?: number | null;
  pricePerSqm?: number | null;
  dom?: number | null;
  snapshotDate?: string | null;
  soldDate?: string | null;
  href?: string;
}

export interface ListingTableBlock {
  type: "listing_table";
  title?: string;
  rows: ListingTableRow[];
  totalCount?: number;
  resultLimit?: number;
}

export interface ComparisonTableBlock {
  type: "comparison_table";
  title?: string;
  columns: Array<{
    key: string;
    label: string;
  }>;
  rows: Array<Record<string, string | number | null>>;
}

export interface HistoryChartPoint {
  date: string;
  value: number | null;
  secondaryValue?: number | null;
}

export interface HistoryChartBlock {
  type: "history_chart";
  title: string;
  metricId: MetricId;
  points: HistoryChartPoint[];
}

export interface DevelopmentProfileBlock {
  type: "development_profile";
  developmentName: string;
  title?: string | null;
  overview?: string | null;
  locationDescription?: string | null;
  lifestyle?: string | null;
  buyerNotes?: string | null;
  investorNotes?: string | null;
  searchpvInsights?: string | null;
  amenities?: string[];
  nearbySummary?: string | null;
  href?: string;
}

export interface NavigationLinkBlock {
  type: "navigation_links";
  title?: string;
  links: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
}

export type ClarificationReason =
  | "ambiguous_intent"
  | "ambiguous_geography"
  | "missing_required_parameter"
  | "conflicting_parameters"
  | "unsupported_scope";

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  value?: string;
  entityKey?: number;
  intent?: AskSearchPVIntent;
}

export interface ClarificationBlock {
  type: "clarification";
  reason: ClarificationReason;
  question: string;
  options?: ClarificationOption[];
}

export interface DefinitionBlock {
  type: "definitions";
  items: Array<{
    term: string;
    definition: string;
  }>;
}

export type AskSearchPVResponseBlock =
  | MetricCardBlock
  | ListingTableBlock
  | ComparisonTableBlock
  | HistoryChartBlock
  | DevelopmentProfileBlock
  | NavigationLinkBlock
  | ClarificationBlock
  | DefinitionBlock;

export interface AskSearchPVResponse {
  requestId: string;
  question: string;

  interpretation: AskSearchPVInterpretation;

  answer: {
    headline?: string;
    summary: string;
    expertContext?: string;
    humor?: string;
  };

  blocks: AskSearchPVResponseBlock[];
  sources: AskSearchPVSource[];

  suggestedQuestions?: string[];

  diagnostics?: {
    processingMs?: number;
    classifier?: string;
    geographyResolver?: string;
    warnings?: string[];
  };
}