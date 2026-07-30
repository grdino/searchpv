// src/lib/ask-searchpv/response-formatter.ts

import type {
  MarketStatisticValue,
  MarketStatisticsResult,
} from "./services/market-statistics";

import type {
  AskSearchPVResponse,
} from "./types";

type FormattedAnswer =
  AskSearchPVResponse["answer"];

export interface MarketStatisticsPresentation {
  answer: FormattedAnswer;
  sourceLabel: string;
  sourceNotes: string;
}

/**
 * Convert a verified market-statistics result into
 * natural user-facing language.
 *
 * This formatter:
 * - never queries the database
 * - never calculates market statistics
 * - never changes metric values
 * - only presents data already returned by the service
 */
export function formatMarketStatisticsPresentation(
  result: MarketStatisticsResult,
): MarketStatisticsPresentation {
  const geographyName =
    result.geography.canonicalName;

  const answer =
    result.metrics.length === 1
      ? formatSingleMetricAnswer(
          geographyName,
          result.metrics[0],
          result,
        )
      : formatMultipleMetricAnswer(
          geographyName,
          result,
        );

  return {
    answer,
    sourceLabel:
      formatSnapshotLabel(
        result.sourceView,
      ),
    sourceNotes:
      formatScopeDescription(result),
  };
}

function formatSingleMetricAnswer(
  geographyName: string,
  metric: MarketStatisticValue,
  result: MarketStatisticsResult,
): FormattedAnswer {
  const formattedValue =
    formatMetricValue(metric);

  const summary =
    formatMetricSentence(
      geographyName,
      metric,
      formattedValue,
    );

  return {
    headline:
      `${geographyName} ${metric.shortLabel}`,
    summary,
    expertContext:
      buildExpertContext(result),
  };
}

function formatMultipleMetricAnswer(
  geographyName: string,
  result: MarketStatisticsResult,
): FormattedAnswer {
  const availableMetrics =
    result.metrics.filter(
      (metric) => metric.value !== null,
    );

  const summary =
    availableMetrics.length > 0
      ? `Here is the latest verified market snapshot for ${geographyName}.`
      : `The requested market metrics are not currently available for ${geographyName}.`;

  return {
    headline:
      `${geographyName} market snapshot`,
    summary,
    expertContext:
      buildExpertContext(result),
  };
}

function formatMetricSentence(
  geographyName: string,
  metric: MarketStatisticValue,
  formattedValue: string,
): string {
  switch (metric.metricId) {
    case "active_listing_count":
      return `${geographyName} currently has ${formattedValue} active ${pluralizeListing(
        metric.value,
      )}.`;

    case "pending_listing_count":
      return `${geographyName} currently has ${formattedValue} pending ${pluralizeListing(
        metric.value,
      )}.`;

    case "closed_sale_count":
      return `${geographyName} recorded ${formattedValue} closed ${pluralizeSale(
        metric.value,
      )} during the reported 12-month period.`;

    case "median_list_price":
      return `The median list price in ${geographyName} is currently ${formattedValue}.`;

    case "average_list_price":
      return `The average list price in ${geographyName} is currently ${formattedValue}.`;

    case "median_sold_price":
      return `The median sold price in ${geographyName} is ${formattedValue} for the reported sales period.`;

    case "average_sold_price":
      return `The average sold price in ${geographyName} is ${formattedValue} for the reported sales period.`;

    case "average_price_per_sqft":
      return `The average price per square foot in ${geographyName} is ${formattedValue}.`;

    case "median_price_per_sqft":
      return `The median price per square foot in ${geographyName} is ${formattedValue}.`;

    case "average_price_per_sqm":
      return `The average price per square meter in ${geographyName} is ${formattedValue}.`;

    case "median_price_per_sqm":
      return `The median price per square meter in ${geographyName} is ${formattedValue}.`;

    case "average_dom":
      return `Properties in ${geographyName} averaged ${formattedValue} days on market.`;

    case "months_inventory":
      return `${geographyName} currently has ${formattedValue} months of inventory.`;

    case "inventory_value":
      return `The total active inventory value in ${geographyName} is ${formattedValue}.`;

    case "median_dom":
      return `The median days on market in ${geographyName} is ${formattedValue}.`;

    case "average_sold_to_list_ratio":
      return `The average sold-to-list price ratio in ${geographyName} is ${formattedValue}.`;

    case "median_sold_to_list_ratio":
      return `The median sold-to-list price ratio in ${geographyName} is ${formattedValue}.`;

    case "average_sold_to_original_list_ratio":
      return `The average sold-to-original-list price ratio in ${geographyName} is ${formattedValue}.`;

    case "median_sold_to_original_list_ratio":
      return `The median sold-to-original-list price ratio in ${geographyName} is ${formattedValue}.`;
  }
}

function buildExpertContext(
  result: MarketStatisticsResult,
): string {
  const scope =
    formatScopeDescription(result);

  if (!result.snapshotDate) {
    return scope;
  }

  return `${scope} Source: ${formatSnapshotLabel(
    result.sourceView,
  )} dated ${formatDate(
    result.snapshotDate,
  )}.`;
}

function formatScopeDescription(
  result: MarketStatisticsResult,
): string {
  const marketDescription =
    formatMarketSegment(
      result.marketSegment,
    );

  const propertyDescription =
    formatPropertyTypeSegment(
      result.propertyTypeSegment,
    );

  return [
    marketDescription,
    propertyDescription,
    "across all bedroom counts: studios, 1-bedroom, 2-bedroom, and 3+-bedroom properties.",
  ].join(" ");
}

function formatMarketSegment(
  segment: string,
): string {
  switch (segment) {
    case "all":
      return "This includes both resale and pre-construction properties.";

    case "resale":
      return "This includes resale properties only.";

    case "pre_construction":
      return "This includes pre-construction properties only.";

    default:
      return `This uses the ${formatSegmentLabel(
        segment,
      )} market segment.`;
  }
}

function formatPropertyTypeSegment(
  segment: string,
): string {
  switch (segment) {
    case "all":
      return "It includes both houses and condos";

    case "houses":
      return "It includes houses only";

    case "condos":
      return "It includes condos only";

    default:
      return `It includes the ${formatSegmentLabel(
        segment,
      )} property type`;
  }
}

function formatSnapshotLabel(
  sourceView: MarketStatisticsResult["sourceView"],
): string {
  switch (sourceView) {
    case "zone_snapshot":
      return "Zone Snapshot";

    case "area_snapshot":
      return "Area Snapshot";

    case "community_snapshot":
      return "Community Snapshot";

    case "development_snapshot":
      return "Development Snapshot";
  }
}

function formatMetricValue(
  metric: MarketStatisticValue,
): string {
  if (metric.value === null) {
    return "unavailable";
  }

  switch (metric.valueType) {
    case "currency":
      return new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        },
      ).format(metric.value);

    case "currency_per_sqft":
      return `${new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        },
      ).format(metric.value)} per ft²`;

    case "currency_per_sqm":
      return `${new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        },
      ).format(metric.value)} per m²`;

    case "percentage":
      return new Intl.NumberFormat(
        "en-US",
        {
          style: "percent",
          maximumFractionDigits: 1,
        },
      ).format(
        Math.abs(metric.value) > 1
          ? metric.value / 100
          : metric.value,
      );

    case "days":
      return new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0,
        },
      ).format(metric.value);

    case "months":
      return new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 1,
        },
      ).format(metric.value);

    case "count":
      return new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0,
        },
      ).format(metric.value);
  }
}

function formatSegmentLabel(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function pluralizeListing(
  value: number | null,
): string {
  return value === 1
    ? "listing"
    : "listings";
}

function pluralizeSale(
  value: number | null,
): string {
  return value === 1
    ? "sale"
    : "sales";
}

function formatDate(
  value: string,
): string {
  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}