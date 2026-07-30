// src/lib/ask-searchpv/services/geography.ts

import { createClient } from "@/lib/supabase/server";

import type {
  GeographyEntityType,
  GeographyHierarchy,
  GeographyMatchMethod,
  ResolvedGeography,
} from "../types";

const ENTITY_TYPE_MAP: Record<string, GeographyEntityType> = {
  ZN: "zone",
  AR: "area",
  CM: "community",
  DV: "development",
  BD: "building",
  NB: "neighborhood",
  PL: "place",
};

const DOMAIN_TO_DATABASE_ENTITY_TYPE: Record<
  GeographyEntityType,
  string
> = {
  zone: "ZN",
  area: "AR",
  community: "CM",
  development: "DV",
  building: "BD",
  neighborhood: "NB",
  place: "PL",
};

interface GeographyResolverRow {
  entity_ky: number;
  entity_identifier_cd: string;
  entity_type_cd: string;
  entity_type_nm: string | null;
  canonical_nm: string | null;
  entity_source_cd: string | null;
  longitude_nb: number | string | null;
  latitude_nb: number | string | null;

  matched_variant_nm: string | null;
  matched_variant_type_cd: string | null;
  matched_language_cd: string | null;

  match_method: string;
  confidence_nb: number | string;

  parent_entity_ky: number | null;
  parent_entity_type_cd: string | null;
  parent_canonical_nm: string | null;

  hierarchy_js: unknown;
}

export interface ResolveGeographyOptions {
  expectedType?: GeographyEntityType;
  limit?: number;
  ambiguityThreshold?: number;
}

export interface GeographyResolutionResult {
  inputText: string;
  resolved: boolean;
  requiresClarification: boolean;
  primary?: ResolvedGeography;
  candidates: ResolvedGeography[];
  clarificationQuestion?: string;
  warnings: string[];
}

export async function resolveGeography(
  inputText: string,
  options: ResolveGeographyOptions = {},
): Promise<GeographyResolutionResult> {
  const normalizedInput = inputText.trim();

  if (!normalizedInput) {
    return {
      inputText,
      resolved: false,
      requiresClarification: true,
      candidates: [],
      clarificationQuestion:
        "Which Puerto Vallarta or Riviera Nayarit location are you interested in?",
      warnings: ["Geography search text was empty."],
    };
  }

  const limit = clampLimit(options.limit ?? 10);
  const ambiguityThreshold =
    options.ambiguityThreshold ?? 0.08;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "resolve_geography",
    {
      p_search: normalizedInput,
      p_expected_entity_type_cd: options.expectedType
        ? DOMAIN_TO_DATABASE_ENTITY_TYPE[options.expectedType]
        : null,
      p_limit: limit,
    },
  );

  if (error) {
    throw new Error(
      `Unable to resolve geography: ${error.message}`,
    );
  }

  const rows = (data ?? []) as GeographyResolverRow[];

  const candidates = rows
    .map((row) => mapResolverRow(row, normalizedInput))
    .filter(
      (
        candidate,
      ): candidate is ResolvedGeography => candidate !== null,
    );

  if (candidates.length === 0) {
    return {
      inputText: normalizedInput,
      resolved: false,
      requiresClarification: true,
      candidates: [],
      clarificationQuestion:
        `I could not confidently match "${normalizedInput}" to a SearchPV location. Could you provide a nearby area, community, or development name?`,
      warnings: ["No geography candidates were returned."],
    };
  }

  const primary = candidates[0];

  const meaningfulAlternatives = candidates
    .slice(1)
    .filter((candidate) =>
      isMeaningfulAlternative(
        primary,
        candidate,
        ambiguityThreshold,
      ),
    );

    const requiresClarification =
      shouldRequireClarification(
        primary,
        meaningfulAlternatives,
        ambiguityThreshold,
      );

  const resolvedPrimary: ResolvedGeography = {
    ...primary,
    resolved: !requiresClarification,
    alternatives: meaningfulAlternatives.map(
      (candidate) => ({
        entityKey: candidate.entityKey,
        identifier: candidate.identifier,
        entityType:
          candidate.entityType ?? "place",
        canonicalName:
          candidate.canonicalName ?? normalizedInput,
        confidence: candidate.confidence,
      }),
    ),
  };

  return {
    inputText: normalizedInput,
    resolved: !requiresClarification,
    requiresClarification,
    primary: resolvedPrimary,
    candidates,
    clarificationQuestion: requiresClarification
      ? buildClarificationQuestion(
          normalizedInput,
          primary,
          meaningfulAlternatives,
        )
      : undefined,
    warnings: [],
  };
}

function mapResolverRow(
  row: GeographyResolverRow,
  inputText: string,
): ResolvedGeography | null {
  const entityType =
    ENTITY_TYPE_MAP[row.entity_type_cd];

  if (!entityType) {
    return null;
  }

  const confidence = Number(row.confidence_nb);

  return {
    inputText,
    matchedVariant:
      row.matched_variant_nm ?? undefined,
    resolved: true,
    entityKey: row.entity_ky,
    identifier: row.entity_identifier_cd,
    entityType,
    canonicalName:
      row.canonical_nm ??
      row.matched_variant_nm ??
      row.entity_identifier_cd,
    matchMethod:
      normalizeMatchMethod(row.match_method),
    confidence: Number.isFinite(confidence)
      ? confidence
      : 0,
    hierarchy: parseHierarchy(row.hierarchy_js),
  };
}

function normalizeMatchMethod(
  value: string,
): GeographyMatchMethod {
  const allowed: GeographyMatchMethod[] = [
    "canonical_exact",
    "variant_exact",
    "normalized_exact",
    "prefix",
    "token",
    "fuzzy",
    "place",
    "unresolved",
  ];

  return allowed.includes(
    value as GeographyMatchMethod,
  )
    ? (value as GeographyMatchMethod)
    : "unresolved";
}

function parseHierarchy(
  value: unknown,
): GeographyHierarchy | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const hierarchy: GeographyHierarchy = {};

  const zone = parseHierarchyItem(source.zone);
  const area = parseHierarchyItem(source.area);
  const community = parseHierarchyItem(
    source.community,
  );
  const development = parseHierarchyItem(
    source.development,
  );

  if (zone) {
    hierarchy.zone = zone;
  }

  if (area) {
    hierarchy.area = area;
  }

  if (community) {
    hierarchy.community = community;
  }

  if (development) {
    hierarchy.development = development;
  }

  return Object.keys(hierarchy).length > 0
    ? hierarchy
    : undefined;
}

function parseHierarchyItem(
  value: unknown,
):
  | {
      entityKey?: number;
      identifier?: string;
      name: string;
      slug?: string;
    }
  | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const item = value as Record<string, unknown>;

  if (typeof item.name !== "string") {
    return undefined;
  }

  return {
    entityKey:
      typeof item.entityKey === "number"
        ? item.entityKey
        : undefined,
    identifier:
      typeof item.identifier === "string"
        ? item.identifier
        : undefined,
    name: item.name,
    slug:
      typeof item.slug === "string"
        ? item.slug
        : undefined,
  };
}

function isMeaningfulAlternative(
  primary: ResolvedGeography,
  alternative: ResolvedGeography,
  ambiguityThreshold: number,
): boolean {
  if (
    primary.entityKey === alternative.entityKey
  ) {
    return false;
  }

  if (
    primary.matchMethod === "canonical_exact" &&
    alternative.matchMethod === "prefix"
  ) {
    return (
      primary.entityType === "area" &&
      alternative.entityType === "community"
    );
  }

  return (
    Math.abs(
      primary.confidence -
        alternative.confidence,
    ) <= ambiguityThreshold
  );
}

function shouldRequireClarification(
  primary: ResolvedGeography,
  alternatives: ResolvedGeography[],
  ambiguityThreshold: number,
): boolean {
  if (primary.confidence < 0.8) {
    return true;
  }

  if (alternatives.length === 0) {
    return false;
  }

  return alternatives.some((alternative) => {
    if (
      primary.entityType === "area" &&
      alternative.entityType === "community" &&
      alternative.matchMethod === "prefix"
    ) {
      return true;
    }

    return (
      primary.matchMethod ===
        alternative.matchMethod &&
      Math.abs(
        primary.confidence -
          alternative.confidence,
      ) <= ambiguityThreshold
    );
  });
}

function buildClarificationQuestion(
  inputText: string,
  primary: ResolvedGeography,
  alternatives: ResolvedGeography[],
): string {
  const options = [
    primary,
    ...alternatives,
  ]
    .slice(0, 3)
    .map((candidate) => {
      const typeLabel = candidate.entityType
        ? ` ${candidate.entityType}`
        : "";

      return `${candidate.canonicalName}${typeLabel}`;
    });

  if (options.length === 2) {
    return `When you say "${inputText}", do you mean ${options[0]} or ${options[1]}?`;
  }

  return `I found several possible matches for "${inputText}": ${options.join(
    ", ",
  )}. Which one did you mean?`;
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 10;
  }

  return Math.min(
    50,
    Math.max(1, Math.floor(value)),
  );
}