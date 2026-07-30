// src/lib/ask-searchpv/operations.ts

import type {
  AskSearchPVIntent,
  DevelopmentInformationParameters,
  GeographyComparisonParameters,
  MarketStatisticsParameters,
  PropertySearchParameters,
  SiteNavigationParameters,
} from "./types";

export const ASK_SEARCHPV_OPERATION_VERSION = 1;

export const ASK_SEARCHPV_OPERATION_IDS = [
  "property.search",
  "market.statistics",
  "market.compare",
  "development.information",
  "navigation.search",
] as const;

export type AskSearchPVOperationId =
  (typeof ASK_SEARCHPV_OPERATION_IDS)[number];

export type AskSearchPVPermissionScope =
  | "public"
  | "office";

export type AskSearchPVOperationCategory =
  | "property"
  | "market"
  | "development"
  | "navigation";

export type AskSearchPVExecutor =
  | "propertySearch"
  | "marketStatistics"
  | "marketComparison"
  | "developmentInformation"
  | "navigationSearch";

export type AskSearchPVParameters =
  | PropertySearchParameters
  | MarketStatisticsParameters
  | GeographyComparisonParameters
  | DevelopmentInformationParameters
  | SiteNavigationParameters;

export interface AskSearchPVExecutionPlan {
  operationId: AskSearchPVOperationId;
  intent: AskSearchPVIntent;
  permissionScope: AskSearchPVPermissionScope;
  parameters: AskSearchPVParameters;
}

export interface AskSearchPVOperationDefinition {
  id: AskSearchPVOperationId;
  version: number;
  intent: Exclude<
    AskSearchPVIntent,
    "clarification_required" | "unsupported"
  >;

  category: AskSearchPVOperationCategory;
  executor: AskSearchPVExecutor;

  label: string;
  description: string;

  permissionScope: AskSearchPVPermissionScope;

  enabledForMvp: boolean;
}

export const ASK_SEARCHPV_OPERATIONS: Record<
  AskSearchPVOperationId,
  AskSearchPVOperationDefinition
> = {
  "property.search": {
    id: "property.search",
    version: ASK_SEARCHPV_OPERATION_VERSION,
    intent: "property_search",
    category: "property",
    executor: "propertySearch",
    label: "Property Search",
    description:
      "Search approved listing sources using validated property and geography filters.",
    permissionScope: "public",
    enabledForMvp: true,
  },

  "market.statistics": {
    id: "market.statistics",
    version: ASK_SEARCHPV_OPERATION_VERSION,
    intent: "market_statistics",
    category: "market",
    executor: "marketStatistics",
    label: "Market Statistics",
    description:
      "Retrieve approved market metrics for one geography and reporting period.",
    permissionScope: "public",
    enabledForMvp: true,
  },

  "market.compare": {
    id: "market.compare",
    version: ASK_SEARCHPV_OPERATION_VERSION,
    intent: "geography_comparison",
    category: "market",
    executor: "marketComparison",
    label: "Geography Comparison",
    description:
      "Compare approved market metrics across two or more resolved geographies.",
    permissionScope: "public",
    enabledForMvp: true,
  },

  "development.information": {
    id: "development.information",
    version: ASK_SEARCHPV_OPERATION_VERSION,
    intent: "development_information",
    category: "development",
    executor: "developmentInformation",
    label: "Development Information",
    description:
      "Retrieve approved development profile, market snapshot, nearby places, and active listings.",
    permissionScope: "public",
    enabledForMvp: true,
  },

  "navigation.search": {
    id: "navigation.search",
    version: ASK_SEARCHPV_OPERATION_VERSION,
    intent: "site_navigation",
    category: "navigation",
    executor: "navigationSearch",
    label: "Site Navigation",
    description:
      "Locate SearchPV pages, reports, and destinations.",
    permissionScope: "public",
    enabledForMvp: true,
  },
};

export function isAskSearchPVOperationId(
  value: string,
): value is AskSearchPVOperationId {
  return ASK_SEARCHPV_OPERATION_IDS.includes(
    value as AskSearchPVOperationId,
  );
}

export function getAskSearchPVOperation(
  operationId: AskSearchPVOperationId,
): AskSearchPVOperationDefinition {
  return ASK_SEARCHPV_OPERATIONS[operationId];
}

export function getOperationForIntent(
  intent: AskSearchPVIntent,
): AskSearchPVOperationDefinition | undefined {
  return Object.values(
    ASK_SEARCHPV_OPERATIONS,
  ).find(
    (operation) => operation.intent === intent,
  );
}