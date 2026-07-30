// src/lib/ask-searchpv/intents.ts

import type {
  AskSearchPVIntent,
  GeographyEntityType,
  PropertySort,
  PropertyStatus,
} from "./types";

export interface IntentDefinition {
  id: AskSearchPVIntent;
  label: string;
  description: string;
  examples: string[];
  enabledForMvp: boolean;
}

export const INTENT_DEFINITIONS: Record<
  AskSearchPVIntent,
  IntentDefinition
> = {
  property_search: {
    id: "property_search",
    label: "Property Search",
    description:
      "Find active, pending, or recently closed properties using user-friendly filters.",
    examples: [
      "Show me two-bedroom condos in Zona Romántica.",
      "Find active listings under $500,000 in Marina Vallarta.",
      "What pending homes are available in Amapas?",
    ],
    enabledForMvp: true,
  },

  market_statistics: {
    id: "market_statistics",
    label: "Market Statistics",
    description:
      "Answer questions about inventory, prices, sales activity, days on market, and related metrics.",
    examples: [
      "What is the median sold price in Marina Vallarta?",
      "How many active listings are in Bucerías?",
      "What is the months of inventory for two-bedroom condos?",
    ],
    enabledForMvp: true,
  },

  geography_comparison: {
    id: "geography_comparison",
    label: "Geography Comparison",
    description:
      "Compare two or more markets, areas, communities, or developments using consistent metrics.",
    examples: [
      "Compare Amapas and Conchas Chinas.",
      "Which has lower condo prices, Marina Vallarta or Hotel Zone?",
      "Compare inventory in Bucerías and Nuevo Vallarta.",
    ],
    enabledForMvp: true,
  },

  development_information: {
    id: "development_information",
    label: "Development Information",
    description:
      "Provide profile, market, amenity, location, and nearby-place information for a development.",
    examples: [
      "Tell me about Grand Venetian.",
      "Does Harbor 171 allow pets?",
      "What amenities does Valarte have?",
    ],
    enabledForMvp: true,
  },

  site_navigation: {
    id: "site_navigation",
    label: "Site Navigation",
    description:
      "Help users find SearchPV pages, reports, market pages, and property-search tools.",
    examples: [
      "Take me to active listings.",
      "Where can I compare neighborhoods?",
      "Show me the closed-sales report.",
    ],
    enabledForMvp: true,
  },

  clarification_required: {
    id: "clarification_required",
    label: "Clarification Required",
    description:
      "Request one focused clarification when the user's intent or geography is materially ambiguous.",
    examples: [
      "Do you mean Marina Vallarta or the broader Marina area?",
      "Are you looking for active listings or recent closed sales?",
    ],
    enabledForMvp: true,
  },

  unsupported: {
    id: "unsupported",
    label: "Unsupported",
    description:
      "Handle requests outside SearchPV's supported capabilities and redirect helpfully.",
    examples: [
      "Write a legal purchase contract.",
      "Book me a flight.",
      "Predict exactly what a property will be worth in five years.",
    ],
    enabledForMvp: true,
  },
};

export const MVP_INTENTS = Object.values(INTENT_DEFINITIONS)
  .filter((definition) => definition.enabledForMvp)
  .map((definition) => definition.id);

export const DEFAULT_PROPERTY_STATUSES: PropertyStatus[] = ["active"];

export const DEFAULT_PROPERTY_SORT: PropertySort = "relevance";

export const DEFAULT_PROPERTY_RESULT_LIMIT = 12;

export const MAX_PROPERTY_RESULT_LIMIT = 50;

export const DEFAULT_GEOGRAPHY_TYPES: GeographyEntityType[] = [
  "zone",
  "area",
  "community",
  "development",
  "building",
  "neighborhood",
  "place",
];

export const SEARCHPV_PERSONALITY = {
  role:
    "A knowledgeable Puerto Vallarta real estate expert who combines verified SearchPV facts with practical local context.",

  tone: [
    "conversational",
    "clear",
    "credible",
    "helpful",
    "locally informed",
    "lightly humorous when appropriate",
  ],

  answerPattern: [
    "Briefly interpret the user's request.",
    "Present verified facts and statistics.",
    "Add useful plain-English expert context.",
    "State the relevant data date or reporting period.",
    "Offer a relevant SearchPV page or next action.",
  ],

  humorRules: [
    "Use humor sparingly.",
    "Never make the user the target of a joke.",
    "Do not use humor in legal, financial, safety, compliance, or other serious cautions.",
    "Do not let humor obscure the factual answer.",
    "Use more restraint for consequential real-estate decisions.",
    "A light dry tone is acceptable for clearly off-topic requests.",
  ],

  unsupportedRequestStyle:
    "Acknowledge the request briefly, use light humor only when appropriate, explain the supported boundary, and redirect toward a useful SearchPV capability.",
} as const;

export function isMvpIntent(
  value: string,
): value is AskSearchPVIntent {
  return MVP_INTENTS.includes(value as AskSearchPVIntent);
}

export function getIntentDefinition(
  intent: AskSearchPVIntent,
): IntentDefinition {
  return INTENT_DEFINITIONS[intent];
}

export function clampPropertyResultLimit(
  value?: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_PROPERTY_RESULT_LIMIT;
  }

  return Math.min(
    MAX_PROPERTY_RESULT_LIMIT,
    Math.max(1, Math.floor(value)),
  );
}