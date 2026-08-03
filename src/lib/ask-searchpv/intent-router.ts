// src/lib/ask-searchpv/intent-router.ts

import {
  clampPropertyResultLimit,
  DEFAULT_PROPERTY_SORT,
  DEFAULT_PROPERTY_STATUSES,
  getIntentDefinition,
} from "./intents";

import {
  getOperationForIntent,
  type AskSearchPVExecutionPlan,
} from "./operations";

import {
  resolveGeography,
  type GeographyResolutionResult,
} from "./services/geography";

import type {
  AskSearchPVIntent,
  AskSearchPVInterpretation,
  AskSearchPVRequest,
  GeographyComparisonParameters,
  GeographyEntityType,
  MarketStatisticsParameters,
  PropertySearchParameters,
  PropertySort,
  PropertyStatus,
  ResolvedGeography,
} from "./types";

import type { MetricId } from "./metricCatalog";

const DEFAULT_MARKET_METRICS: MetricId[] = [
  "active_listing_count",
  "pending_listing_count",
  "closed_sale_count",
  "median_list_price",
  "median_sold_price",
  "average_dom",
  "months_inventory",
];

const COMPARISON_METRICS: MetricId[] = [
  "active_listing_count",
  "median_list_price",
  "median_sold_price",
  "average_dom",
  "months_inventory",
];

/**
 * Preferred geography types when multiple entities match the
 * same search text.
 *
 * Example:
 * "Versalles"
 *   Community (preferred)
 *   Development
 *
 * The resolver returns all candidates.
 * The router chooses the preferred one based on the user's intent.
 */
const INTENT_ENTITY_PRIORITY: Partial<
  Record<AskSearchPVIntent, GeographyEntityType[]>
> = {
  market_statistics: [
    "community",
    "area",
    "zone",
    "neighborhood",
    "development",
    "building",
    "place",
  ],

  property_search: [
    "community",
    "area",
    "zone",
    "neighborhood",
    "development",
    "building",
  ],

  development_information: [
    "development",
    "building",
    "community",
    "area",
    "zone",
  ],

  geography_comparison: [
    "community",
    "area",
    "zone",
    "neighborhood",
  ],
};

const MARKET_KEYWORDS = [
  "market",
  "median",
  "average",
  "inventory",
  "months of inventory",
  "months inventory",
  "listings are",
  "active listings",
  "pending listings",
  "closed sales",
  "sold price",
  "list price",
  "price per square foot",
  "price per sqft",
  "price per square meter",
  "price per sqm",
  "days on market",
  "dom",
  "sales activity",
  "how is",
  "how's",
  "doing",
];

const PROPERTY_SEARCH_KEYWORDS = [
  "show me",
  "find",
  "search",
  "listings",
  "properties",
  "property",
  "condos",
  "condo",
  "homes",
  "home",
  "houses",
  "house",
  "for sale",
  "available",
  "pending",
  "closed",
  "under",
  "over",
  "between",
  "bedroom",
  "bedrooms",
  "bathroom",
  "bathrooms",
  "ocean view",
  "sea view",
  "pre-construction",
  "preconstruction",
  "resale",
];

const DEVELOPMENT_KEYWORDS = [
  "tell me about",
  "amenities",
  "allow pets",
  "pet friendly",
  "hoa",
  "development",
  "building",
  "nearby",
  "profile",
];

const NAVIGATION_KEYWORDS = [
  "take me to",
  "where can i",
  "where is",
  "open",
  "go to",
  "report",
  "page",
  "market explorer",
  "active listings report",
  "closed sales report",
  "pending listings report",
];

const COMPARISON_KEYWORDS = [
  "compare",
  "versus",
  " vs ",
  "which has",
  "which is",
  "difference between",
  "better market",
  "lower prices",
  "higher prices",
];

const UNSUPPORTED_KEYWORDS = [
  "write a contract",
  "legal contract",
  "book me a flight",
  "guarantee",
  "predict exactly",
];

const ENTITY_TYPE_HINTS: Array<{
  pattern: RegExp;
  type: GeographyEntityType;
}> = [
  {
    pattern: /\bdevelopment\b|\bcondominium\b|\bcondo building\b/i,
    type: "development",
  },
  {
    pattern: /\bbuilding\b|\btower\b/i,
    type: "building",
  },
  {
    pattern: /\bcommunity\b|\bneighborhood\b/i,
    type: "community",
  },
  {
    pattern: /\barea\b|\bzone\b/i,
    type: "area",
  },
];

export interface RouteAskSearchPVResult {
  interpretation: AskSearchPVInterpretation;
  executionPlan?: AskSearchPVExecutionPlan;
  geographyResolutions: GeographyResolutionResult[];
  warnings: string[];
}

/**
 * Deterministically classify a user question and prepare an execution plan.
 *
 * This router is intentionally conservative. It does not use an LLM and does
 * not generate SQL. It classifies common MVP requests, extracts a limited set
 * of filters, resolves geography using public.resolve_geography(), and returns
 * clarification when ambiguity would materially affect the result.
 */
export async function routeAskSearchPVRequest(
  request: AskSearchPVRequest,
): Promise<RouteAskSearchPVResult> {
  const question = request.question.trim();

  if (!question) {
    return clarificationResult(
      "What would you like to know about Puerto Vallarta or Riviera Nayarit real estate?",
      "missing_required_parameter",
      "The question was empty.",
    );
  }

  const normalizedQuestion = normalizeText(question);
  const warnings: string[] = [];

  const intent = classifyIntent(normalizedQuestion);

  if (intent === "unsupported") {
    return {
      interpretation: {
        intent,
        confidence: 0.95,
        summary: getIntentDefinition(intent).description,
        needsClarification: false,
      },
      geographyResolutions: [],
      warnings,
    };
  }

  if (intent === "site_navigation") {
    const interpretation: AskSearchPVInterpretation = {
      intent,
      confidence: 0.9,
      summary: "The user appears to be looking for a SearchPV page or report.",
      needsClarification: false,
      siteNavigation: {
        topic: question,
      },
    };

    return {
      interpretation,
      executionPlan: buildExecutionPlan(interpretation),
      geographyResolutions: [],
      warnings,
    };
  }

  const geographyTexts = extractGeographyTexts(
    question,
    intent,
  );

  const rawGeographyResolutions =
    await resolveGeographies(
      geographyTexts,
      inferExpectedGeographyType(
        question,
        intent,
      ),
    );

  const geographyResolutions =
    applyIntentEntityPreference(
      rawGeographyResolutions,
      intent,
    );

  for (const resolution of geographyResolutions) {
    warnings.push(...resolution.warnings);
  }

  const clarification =
    findRequiredGeographyClarification(
      geographyResolutions,
      intent,
    );

  if (clarification) {
    return {
      interpretation: {
        intent: "clarification_required",
        confidence: 1,
        summary: "The geography needs clarification before SearchPV can run the request.",
        needsClarification: true,
        clarificationQuestion:
          clarification.clarificationQuestion ??
          "Which location did you mean?",
      },
      geographyResolutions,
      warnings,
    };
  }

  const resolvedGeographies = geographyResolutions
    .map((resolution) => resolution.primary)
    .filter(
      (
        geography,
      ): geography is ResolvedGeography =>
        Boolean(geography?.resolved),
    );

  const interpretation = buildInterpretation(
    question,
    normalizedQuestion,
    intent,
    resolvedGeographies,
    request,
  );

  if (interpretation.needsClarification) {
    return {
      interpretation,
      geographyResolutions,
      warnings,
    };
  }

  return {
    interpretation,
    executionPlan: buildExecutionPlan(interpretation),
    geographyResolutions,
    warnings,
  };
}

function classifyIntent(
  normalizedQuestion: string,
): AskSearchPVIntent {
  if (
    containsAny(
      normalizedQuestion,
      UNSUPPORTED_KEYWORDS,
    )
  ) {
    return "unsupported";
  }

  if (
    containsAny(
      normalizedQuestion,
      NAVIGATION_KEYWORDS,
    )
  ) {
    return "site_navigation";
  }

  if (
    containsAny(
      normalizedQuestion,
      COMPARISON_KEYWORDS,
    )
  ) {
    return "geography_comparison";
  }

  if (
    containsAny(
      normalizedQuestion,
      DEVELOPMENT_KEYWORDS,
    )
  ) {
    return "development_information";
  }

  const marketScore = keywordScore(
    normalizedQuestion,
    MARKET_KEYWORDS,
  );

  const propertyScore = keywordScore(
    normalizedQuestion,
    PROPERTY_SEARCH_KEYWORDS,
  );

  if (
    marketScore > propertyScore &&
    marketScore > 0
  ) {
    return "market_statistics";
  }

  if (propertyScore > 0) {
    return "property_search";
  }

  return "clarification_required";
}

function buildInterpretation(
  question: string,
  normalizedQuestion: string,
  intent: AskSearchPVIntent,
  geographies: ResolvedGeography[],
  request: AskSearchPVRequest,
): AskSearchPVInterpretation {
  switch (intent) {
    case "property_search": {
      const parameters = buildPropertySearchParameters(
        question,
        normalizedQuestion,
        geographies,
        request,
      );

      return {
        intent,
        confidence: 0.84,
        summary:
          "The user wants to search listings using property and location filters.",
        needsClarification: false,
        propertySearch: parameters,
      };
    }

    case "market_statistics": {
      if (geographies.length === 0) {
        return {
          intent: "clarification_required",
          confidence: 1,
          summary:
            "A geography is required for a market-statistics request.",
          needsClarification: true,
          clarificationQuestion:
            "Which area, community, or development would you like market statistics for?",
        };
      }

      const parameters =
        buildMarketStatisticsParameters(
          normalizedQuestion,
          geographies[0],
        );

      return {
        intent,
        confidence: 0.87,
        summary:
          "The user wants verified market metrics for one resolved geography.",
        needsClarification: false,
        marketStatistics: parameters,
      };
    }

    case "geography_comparison": {
      if (geographies.length < 2) {
        return {
          intent: "clarification_required",
          confidence: 1,
          summary:
            "At least two resolved geographies are required for a comparison.",
          needsClarification: true,
          clarificationQuestion:
            "Which two locations would you like to compare?",
        };
      }

      const parameters: GeographyComparisonParameters = {
        geographies,
        metricIds: inferMetricIds(
          normalizedQuestion,
          COMPARISON_METRICS,
        ),
        period: {
          type: "latest_snapshot",
        },
        propertyType:
          inferPropertyType(normalizedQuestion),
        propertyTypeCode:
          inferPropertyTypeCode(
            normalizedQuestion,
          ),
        marketSegment:
          inferMarketSegment(
            normalizedQuestion,
          ),
        bedroomSegment:
          inferBedroomSegment(
            normalizedQuestion,
          ),
      };

      return {
        intent,
        confidence: 0.9,
        summary:
          "The user wants to compare verified metrics across resolved geographies.",
        needsClarification: false,
        geographyComparison: parameters,
      };
    }

    case "development_information": {
      if (geographies.length === 0) {
        return {
          intent: "clarification_required",
          confidence: 1,
          summary:
            "A development or building name is required.",
          needsClarification: true,
          clarificationQuestion:
            "Which development would you like information about?",
        };
      }

      return {
        intent,
        confidence: 0.84,
        summary:
          "The user wants profile or market information for a development.",
        needsClarification: false,
        developmentInformation: {
          geography: geographies[0],
          includeProfile: true,
          includeMarketSnapshot: true,
          includeNearbyPlaces:
            /\bnearby\b|\bnear\b|\brestaurants?\b|\bshops?\b/i.test(
              question,
            ),
          includeActiveListings:
            /\blistings?\b|\bfor sale\b|\bavailable\b/i.test(
              question,
            ),
        },
      };
    }

    case "site_navigation":
    case "unsupported":
      throw new Error(
        `Intent ${intent} should have been handled before interpretation building.`,
      );

    case "clarification_required":
      return {
        intent,
        confidence: 0.5,
        summary:
          "The request does not clearly match one supported Ask SearchPV intent.",
        needsClarification: true,
        clarificationQuestion:
          "Are you looking for properties, market statistics, a location comparison, development information, or a SearchPV page?",
      };

    default:
      return assertNever(intent);
  }
}

function buildPropertySearchParameters(
  question: string,
  normalizedQuestion: string,
  geographies: ResolvedGeography[],
  request: AskSearchPVRequest,
): PropertySearchParameters {
    console.log(
    "Resolved geographies:",
    JSON.stringify(geographies, null, 2),
  );
  const priceRange =
    extractPriceRange(normalizedQuestion);

  const bedroomRange =
    extractBedroomRange(normalizedQuestion);

  const bathroomRange =
    extractBathroomRange(normalizedQuestion);

  const statuses =
    inferStatuses(normalizedQuestion);

  return {
    searchText:
      shouldUseQuestionAsSearchText(
        normalizedQuestion,
        geographies,
      )
        ? question
        : undefined,
    filters: {
      statuses,
      geography:
        geographies.length > 0
          ? geographies
          : undefined,
      propertyType:
        inferPropertyType(normalizedQuestion),
      propertyTypeCode:
        inferPropertyTypeCode(
          normalizedQuestion,
        ),
      marketType:
        inferMarketSegment(normalizedQuestion),
      minPrice: priceRange.minimum,
      maxPrice: priceRange.maximum,
      minBeds: bedroomRange.minimum,
      maxBeds: bedroomRange.maximum,
      minBaths: bathroomRange.minimum,
      maxBaths: bathroomRange.maximum,
      preConstruction:
        inferPreConstruction(normalizedQuestion),
      primaryView:
        inferPrimaryView(normalizedQuestion),
    },
    sort: inferPropertySort(
      normalizedQuestion,
    ),
    limit: clampPropertyResultLimit(
      request.preferences?.resultLimit,
    ),
  };
}

/**
 * Extract a possible geography name from the words remaining after
 * recognizable property-search filters are removed.
 *
 * Example:
 * "condos under 500000 zona romantica"
 *
 * Becomes:
 * "zona romantica"
 */
function extractTrailingGeographyCandidate(
  question: string,
): string | null {
  let candidate = question;

  // Remove common property-type words.
  candidate = candidate.replace(
    /\b(condos?|condominiums?|houses?|homes?|apartments?|villas?|lots?|land)\b/gi,
    " ",
  );

  // Remove maximum-price phrases.
  candidate = candidate.replace(
    /\b(?:under|below|less than|up to|max(?:imum)?)\s*\$?\s*[\d,]+(?:\.\d+)?\b/gi,
    " ",
  );

  // Remove minimum-price phrases.
  candidate = candidate.replace(
    /\b(?:over|above|more than|at least|min(?:imum)?)\s*\$?\s*[\d,]+(?:\.\d+)?\b/gi,
    " ",
  );

  // Remove bedroom filters.
  candidate = candidate.replace(
    /\b\d+(?:\+)?\s*(?:bed|beds|bedroom|bedrooms|br)\b/gi,
    " ",
  );

  // Remove bathroom filters.
  candidate = candidate.replace(
    /\b\d+(?:\.\d+)?(?:\+)?\s*(?:bath|baths|bathroom|bathrooms|ba)\b/gi,
    " ",
  );

  // Remove common search and status words.
  candidate = candidate.replace(
    /\b(?:show me|find me|find|search for|search|listings?|properties|property|for sale|active|available)\b/gi,
    " ",
  );

  // Remove geography connector words if one remains.
  candidate = candidate.replace(
    /\b(?:in|at|within|around|near)\b/gi,
    " ",
  );

  // Normalize whitespace.
  candidate = candidate.replace(/\s+/g, " ").trim();

  return candidate.length >= 2 ? candidate : null;
}

function buildMarketStatisticsParameters(
  normalizedQuestion: string,
  geography: ResolvedGeography,
): MarketStatisticsParameters {
  return {
    metricIds: inferMetricIds(
      normalizedQuestion,
      DEFAULT_MARKET_METRICS,
    ),
    geography,
    period: inferMarketPeriod(
      normalizedQuestion,
    ),
    propertyType:
      inferPropertyType(normalizedQuestion),
    propertyTypeCode:
      inferPropertyTypeCode(
        normalizedQuestion,
      ),
    marketSegment:
      inferMarketSegment(normalizedQuestion),
    bedroomSegment:
      inferBedroomSegment(normalizedQuestion),
  };
}

function buildExecutionPlan(
  interpretation: AskSearchPVInterpretation,
): AskSearchPVExecutionPlan | undefined {
  if (
    interpretation.needsClarification ||
    interpretation.intent ===
      "clarification_required" ||
    interpretation.intent === "unsupported"
  ) {
    return undefined;
  }

  const operation = getOperationForIntent(
    interpretation.intent,
  );

  if (!operation) {
    return undefined;
  }

  const parameters =
    interpretation.propertySearch ??
    interpretation.marketStatistics ??
    interpretation.geographyComparison ??
    interpretation.developmentInformation ??
    interpretation.siteNavigation;

  if (!parameters) {
    return undefined;
  }

  return {
    operationId: operation.id,
    intent: operation.intent,
    permissionScope:
      operation.permissionScope,
    parameters,
  };
}

async function resolveGeographies(
  geographyTexts: string[],
  expectedType?: GeographyEntityType,
): Promise<GeographyResolutionResult[]> {
  const results: GeographyResolutionResult[] = [];

  for (const geographyText of geographyTexts) {
    results.push(
      await resolveGeography(
        geographyText,
        {
          expectedType,
          limit: 10,
        },
      ),
    );
  }

  return results;
}

/**
 * Applies intent-specific entity-type preference when the
 * geography resolver returns multiple competitive matches.
 *
 * Example:
 * "How many active listings are in Versalles?"
 *
 * For market statistics:
 * - Versalles community is preferred
 * - VERSALLES development remains an alternative
 */
function applyIntentEntityPreference(
  resolutions: GeographyResolutionResult[],
  intent: AskSearchPVIntent,
): GeographyResolutionResult[] {
  const priority =
    INTENT_ENTITY_PRIORITY[intent];

  if (!priority) {
    return resolutions;
  }

  return resolutions.map((resolution) => {
    if (
      !resolution.requiresClarification ||
      resolution.candidates.length === 0
    ) {
      return resolution;
    }

    const highestConfidence = Math.max(
      ...resolution.candidates.map(
        (candidate) =>
          candidate.confidence,
      ),
    );

    const competitiveCandidates =
      resolution.candidates.filter(
        (candidate) =>
          highestConfidence -
            candidate.confidence <=
          0.08,
      );

    const rankedCandidates =
      competitiveCandidates
        .map((candidate) => ({
          candidate,
          priorityIndex:
            candidate.entityType
              ? priority.indexOf(
                  candidate.entityType,
                )
              : -1,
        }))
        .filter(
          ({ priorityIndex }) =>
            priorityIndex >= 0,
        )
        .sort(
          (left, right) =>
            left.priorityIndex -
              right.priorityIndex ||
            right.candidate.confidence -
              left.candidate.confidence,
        );

    const preferred =
      rankedCandidates[0];

    if (!preferred) {
      return resolution;
    }

    const equallyPreferred =
      rankedCandidates.filter(
        ({ candidate, priorityIndex }) =>
          priorityIndex ===
            preferred.priorityIndex &&
          Math.abs(
            candidate.confidence -
              preferred.candidate.confidence,
          ) <= 0.08,
      );

    if (equallyPreferred.length > 1) {
      return resolution;
    }

    const selected =
      preferred.candidate;

    return {
      ...resolution,
      resolved: true,
      requiresClarification: false,
      primary: {
        ...selected,
        resolved: true,
        alternatives:
          resolution.candidates
            .filter(
              (candidate) =>
                candidate.entityKey !==
                  selected.entityKey &&
                candidate.entityType !== undefined &&
                candidate.canonicalName !== undefined,
            )
            .map((candidate) => ({
              entityKey:
                candidate.entityKey,
              identifier:
                candidate.identifier,
              entityType:
                candidate.entityType!,
              canonicalName:
                candidate.canonicalName!,
              confidence:
                candidate.confidence,
            })),
      },
      clarificationQuestion: undefined,
    };
  });
}

function findRequiredGeographyClarification(
  resolutions: GeographyResolutionResult[],
  intent: AskSearchPVIntent,
): GeographyResolutionResult | undefined {
  if (
    intent === "site_navigation" ||
    intent === "unsupported" ||
    intent === "clarification_required"
  ) {
    return undefined;
  }

  return resolutions.find(
    (resolution) =>
      resolution.requiresClarification,
  );
}

function extractGeographyTexts(
  question: string,
  intent: AskSearchPVIntent,
): string[] {
  if (
    intent === "site_navigation" ||
    intent === "unsupported" ||
    intent === "clarification_required"
  ) {
    return [];
  }

  if (intent === "geography_comparison") {
    return extractComparisonGeographies(
      question,
    );
  }

  const prepositionMatch = question.match(
    /\b(?:in|for|at|around|near)\s+(.+?)(?:[?.!,]|$)/i,
  );

  if (prepositionMatch?.[1]) {
    return [
      cleanGeographyText(
        prepositionMatch[1],
      ),
    ].filter(Boolean);
  }

  const aboutMatch = question.match(
    /\b(?:about|is|does)\s+(.+?)(?:\s+(?:doing|have|allow|offer)|[?.!,]|$)/i,
  );

  if (aboutMatch?.[1]) {
    return [
      cleanGeographyText(
        aboutMatch[1],
      ),
    ].filter(Boolean);
  }

  const tellMeMatch = question.match(
    /\btell me about\s+(.+?)(?:[?.!,]|$)/i,
  );

  if (tellMeMatch?.[1]) {
    return [
      cleanGeographyText(
        tellMeMatch[1],
      ),
    ].filter(Boolean);
  }

  /*
  * Property searches often omit the word "in".
  *
  * Example:
  *
  * condos under 500000 zona romantica
  *
  * Remove the property-search words and see if
  * anything meaningful remains. If it does,
  * let the geography resolver try it.
  */
  if (intent === "property_search") {
    const candidate =
      extractTrailingGeographyCandidate(question);

    if (candidate) {
      return [candidate];
    }
  }

  return [];
}

function extractComparisonGeographies(
  question: string,
): string[] {
  const patterns = [
    /\bcompare\s+(.+?)\s+(?:and|with|to|versus|vs\.?)\s+(.+?)(?:[?.!,]|$)/i,
    /\b(.+?)\s+(?:versus|vs\.?)\s+(.+?)(?:[?.!,]|$)/i,
    /\bbetween\s+(.+?)\s+and\s+(.+?)(?:[?.!,]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);

    if (match?.[1] && match?.[2]) {
      return [
        cleanGeographyText(match[1]),
        cleanGeographyText(match[2]),
      ].filter(Boolean);
    }
  }

  return [];
}

function cleanGeographyText(
  value: string,
): string {
  return value
    .replace(
      /\b(?:under|over|between|with|having|that|which|for sale|listings?|properties?|condos?|homes?|houses?|market|prices?|inventory|sales|statistics|stats|doing)\b.*$/i,
      "",
    )
    .replace(
      /^(?:the|a|an)\s+/i,
      "",
    )
    .trim();
}

function inferExpectedGeographyType(
  question: string,
  intent: AskSearchPVIntent,
): GeographyEntityType | undefined {
  if (intent === "development_information") {
    return "development";
  }

  for (const hint of ENTITY_TYPE_HINTS) {
    if (hint.pattern.test(question)) {
      return hint.type;
    }
  }

  return undefined;
}

function inferMetricIds(
  normalizedQuestion: string,
  defaults: MetricId[],
): MetricId[] {
  const metrics: MetricId[] = [];

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    [
      "active listings",
      "active inventory",
      "how many listings",
    ],
    "active_listing_count",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["pending listings", "pending"],
    "pending_listing_count",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["closed sales", "sales activity", "sold"],
    "closed_sale_count",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["median list price"],
    "median_list_price",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["average list price", "avg list price"],
    "average_list_price",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["median sold price"],
    "median_sold_price",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    ["average sold price", "avg sold price"],
    "average_sold_price",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    [
      "price per square foot",
      "price per sqft",
      "$/sqft",
    ],
    "average_price_per_sqft",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    [
      "price per square meter",
      "price per sqm",
      "$/sqm",
    ],
    "average_price_per_sqm",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    [
      "days on market",
      "dom",
      "how long",
    ],
    "average_dom",
  );

  addMetricIfMatched(
    metrics,
    normalizedQuestion,
    [
      "months of inventory",
      "months inventory",
      "supply",
    ],
    "months_inventory",
  );

  return metrics.length > 0
    ? [...new Set(metrics)]
    : [...defaults];
}

function addMetricIfMatched(
  metrics: MetricId[],
  normalizedQuestion: string,
  phrases: string[],
  metricId: MetricId,
): void {
  if (
    phrases.some((phrase) =>
      normalizedQuestion.includes(phrase),
    )
  ) {
    metrics.push(metricId);
  }
}

function inferStatuses(
  normalizedQuestion: string,
): PropertyStatus[] {
  const statuses: PropertyStatus[] = [];

  if (
    /\bactive\b|\bfor sale\b|\bavailable\b/.test(
      normalizedQuestion,
    )
  ) {
    statuses.push("active");
  }

  if (/\bpending\b/.test(normalizedQuestion)) {
    statuses.push("pending");
  }

  if (
    /\bclosed\b|\bsold\b|\brecent sales\b/.test(
      normalizedQuestion,
    )
  ) {
    statuses.push("closed");
  }

  return statuses.length > 0
    ? [...new Set(statuses)]
    : [...DEFAULT_PROPERTY_STATUSES];
}

function inferPropertySort(
  normalizedQuestion: string,
): PropertySort {
  if (
    /\blowest price\b|\bcheapest\b|\bprice low to high\b/.test(
      normalizedQuestion,
    )
  ) {
    return "price_asc";
  }

  if (
    /\bhighest price\b|\bmost expensive\b|\bprice high to low\b/.test(
      normalizedQuestion,
    )
  ) {
    return "price_desc";
  }

  if (
    /\bnewest\b|\bmost recent\b|\blatest\b/.test(
      normalizedQuestion,
    )
  ) {
    return "newest";
  }

  if (
    /\bshortest dom\b|\bfewest days\b/.test(
      normalizedQuestion,
    )
  ) {
    return "dom_asc";
  }

  if (
    /\blongest dom\b|\bmost days\b/.test(
      normalizedQuestion,
    )
  ) {
    return "dom_desc";
  }

  return DEFAULT_PROPERTY_SORT;
}

function inferPropertyType(
  normalizedQuestion: string,
): string | undefined {
  if (/\bcondos?\b/.test(normalizedQuestion)) {
    return "Condos";
  }

  if (
    /\bhouses?\b|\bhomes?\b|\bvillas?\b/.test(
      normalizedQuestion,
    )
  ) {
    return "Houses";
  }

  if (/\bland\b|\blots?\b/.test(normalizedQuestion)) {
    return "Land";
  }

  return undefined;
}

function inferPropertyTypeCode(
  normalizedQuestion: string,
): string | undefined {
  if (/\bcondos?\b/.test(normalizedQuestion)) {
    return "Condos";
  }

  if (
    /\bhouses?\b|\bhomes?\b|\bvillas?\b/.test(
      normalizedQuestion,
    )
  ) {
    return "Houses";
  }

  if (/\bland\b|\blots?\b/.test(normalizedQuestion)) {
    return "Land";
  }

  return undefined;
}

function inferMarketSegment(
  normalizedQuestion: string,
): string | undefined {
  if (
    /\bpre[- ]?construction\b|\bnew construction\b/.test(
      normalizedQuestion,
    )
  ) {
    return "pre_construction";
  }

  if (/\bresale\b/.test(normalizedQuestion)) {
    return "resale";
  }

  return undefined;
}

function inferPreConstruction(
  normalizedQuestion: string,
): boolean | undefined {
  if (
    /\bpre[- ]?construction\b|\bnew construction\b/.test(
      normalizedQuestion,
    )
  ) {
    return true;
  }

  if (/\bresale\b/.test(normalizedQuestion)) {
    return false;
  }

  return undefined;
}

function inferBedroomSegment(
  normalizedQuestion: string,
): string | undefined {
  const range =
    extractBedroomRange(normalizedQuestion);

  if (
    range.minimum !== undefined &&
    range.maximum === range.minimum
  ) {
    if (range.minimum >= 3) {
      return "3br_plus";
    }

    return `${range.minimum}br`;
  }

  return undefined;
}

function inferPrimaryView(
  normalizedQuestion: string,
): string | undefined {
  if (
    /\bocean view\b|\bsea view\b|\bwater view\b/.test(
      normalizedQuestion,
    )
  ) {
    return "Sea";
  }

  if (/\bmountain view\b/.test(normalizedQuestion)) {
    return "Mountain";
  }

  return undefined;
}

function inferMarketPeriod(
  normalizedQuestion: string,
): MarketStatisticsParameters["period"] {
  const yearMatch = normalizedQuestion.match(
    /\b(20\d{2})\b/,
  );

  if (yearMatch) {
    return {
      type: "calendar_year",
      year: Number(yearMatch[1]),
    };
  }

  const monthMatch = normalizedQuestion.match(
    /\b(?:last|past)\s+(\d{1,2})\s+months?\b/,
  );

  if (monthMatch) {
    return {
      type: "rolling_months",
      months: Number(monthMatch[1]),
    };
  }

  return {
    type: "latest_snapshot",
  };
}

function extractPriceRange(
  normalizedQuestion: string,
): {
  minimum?: number;
  maximum?: number;
} {
  const between = normalizedQuestion.match(
    /\bbetween\s+\$?([\d,.]+(?:\s*[km])?)\s+(?:and|to)\s+\$?([\d,.]+(?:\s*[km])?)/i,
  );

  if (between) {
    return {
      minimum: parseMoneyValue(between[1]),
      maximum: parseMoneyValue(between[2]),
    };
  }

  const under = normalizedQuestion.match(
    /\b(?:under|below|less than|max(?:imum)?(?: of)?)\s+\$?([\d,.]+(?:\s*[km])?)/i,
  );

  const over = normalizedQuestion.match(
    /\b(?:over|above|more than|min(?:imum)?(?: of)?)\s+\$?([\d,.]+(?:\s*[km])?)/i,
  );

  return {
    minimum: over
      ? parseMoneyValue(over[1])
      : undefined,
    maximum: under
      ? parseMoneyValue(under[1])
      : undefined,
  };
}

function parseMoneyValue(
  value: string,
): number | undefined {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  const multiplier =
    normalized.endsWith("m")
      ? 1_000_000
      : normalized.endsWith("k")
        ? 1_000
        : 1;

  const numeric = Number(
    normalized.replace(/[km]$/, ""),
  );

  return Number.isFinite(numeric)
    ? numeric * multiplier
    : undefined;
}

function extractBedroomRange(
  normalizedQuestion: string,
): {
  minimum?: number;
  maximum?: number;
} {
  const exact = normalizedQuestion.match(
    /\b(\d+(?:\.\d+)?)\s*(?:bed|beds|bedroom|bedrooms|br)\b/i,
  );

  if (exact) {
    const value = Number(exact[1]);

    return {
      minimum: value,
      maximum: value,
    };
  }

  const minimum = normalizedQuestion.match(
    /\b(?:at least|min(?:imum)?(?: of)?)\s+(\d+(?:\.\d+)?)\s*(?:bed|beds|bedroom|bedrooms|br)\b/i,
  );

  return {
    minimum: minimum
      ? Number(minimum[1])
      : undefined,
  };
}

function extractBathroomRange(
  normalizedQuestion: string,
): {
  minimum?: number;
  maximum?: number;
} {
  const exact = normalizedQuestion.match(
    /\b(\d+(?:\.\d+)?)\s*(?:bath|baths|bathroom|bathrooms|ba)\b/i,
  );

  if (exact) {
    const value = Number(exact[1]);

    return {
      minimum: value,
      maximum: value,
    };
  }

  return {};
}

function shouldUseQuestionAsSearchText(
  normalizedQuestion: string,
  geographies: ResolvedGeography[],
): boolean {
  if (geographies.length > 0) {
    return false;
  }

  return (
    /\bmls\b|\bunit\b|\baddress\b|\bbuilding\b/.test(
      normalizedQuestion,
    )
  );
}

function containsAny(
  normalizedText: string,
  phrases: string[],
): boolean {
  return phrases.some((phrase) =>
    normalizedText.includes(phrase),
  );
}

function keywordScore(
  normalizedText: string,
  phrases: string[],
): number {
  return phrases.reduce(
    (score, phrase) =>
      normalizedText.includes(phrase)
        ? score + 1
        : score,
    0,
  );
}

function normalizeText(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clarificationResult(
  question: string,
  _reason:
    | "ambiguous_intent"
    | "ambiguous_geography"
    | "missing_required_parameter"
    | "conflicting_parameters"
    | "unsupported_scope",
  warning: string,
): RouteAskSearchPVResult {
  return {
    interpretation: {
      intent: "clarification_required",
      confidence: 1,
      summary:
        "The request needs one clarification before it can be executed.",
      needsClarification: true,
      clarificationQuestion: question,
    },
    geographyResolutions: [],
    warnings: [warning],
  };
}

function assertNever(value: never): never {
  throw new Error(
    `Unsupported Ask SearchPV intent: ${String(value)}.`,
  );
}