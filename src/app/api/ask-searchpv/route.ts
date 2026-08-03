// src/app/api/ask-searchpv/route.ts

import { NextResponse } from "next/server";

import {
  formatMarketStatisticsPresentation,
} from "@/lib/ask-searchpv/response-formatter";

import {
  dispatchAskSearchPVOperation,
  isImplementedAskSearchPVOperation,
  type AskSearchPVExecutionResult,
} from "@/lib/ask-searchpv/dispatcher";

import {
  routeAskSearchPVRequest,
  type RouteAskSearchPVResult,
} from "@/lib/ask-searchpv/intent-router";

import type {
  AskSearchPVRequest,
  AskSearchPVResponse,
  AskSearchPVResponseBlock,
  AskSearchPVSource,
  MetricCardBlock,
} from "@/lib/ask-searchpv/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 2_000;

interface AskSearchPVApiRequest extends AskSearchPVRequest {
  /**
   * Debug output is returned only outside production, or when
   * ASK_SEARCHPV_DEBUG=true is set on the server.
   */
  debug?: boolean;
}

interface AskSearchPVDebugPayload {
  routing: RouteAskSearchPVResult;
  executionResult?: AskSearchPVExecutionResult;
  timing: {
    routingMs: number;
    executionMs: number;
    totalMs: number;
  };
}

interface AskSearchPVApiSuccess {
  response: AskSearchPVResponse;
  debug?: AskSearchPVDebugPayload;
}

interface AskSearchPVApiError {
  requestId: string;
  error: {
    code:
      | "invalid_json"
      | "invalid_request"
      | "execution_failed";
    message: string;
  };
}

/**
 * POST /api/ask-searchpv
 *
 * The API route is an orchestration boundary only:
 *
 * request validation
 *   -> deterministic intent routing
 *   -> geography resolution
 *   -> deterministic operation dispatch
 *   -> initial response composition
 *
 * It contains no SQL and performs no market calculations.
 */
export async function POST(
  request: Request,
): Promise<
  NextResponse<
    AskSearchPVApiSuccess | AskSearchPVApiError
  >
> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const body = await readJsonBody(request);

    const validationError =
      validateRequestBody(body);

    if (validationError) {
      return errorResponse(
        requestId,
        "invalid_request",
        validationError,
        400,
      );
    }

    const apiRequest = normalizeRequest(body);

    const routingStartedAt = performance.now();

    const routing =
      await routeAskSearchPVRequest(
        apiRequest,
      );

    const routingMs =
      performance.now() - routingStartedAt;

    let executionResult:
      | AskSearchPVExecutionResult
      | undefined;

    let executionMs = 0;

    if (
      routing.executionPlan &&
      isImplementedAskSearchPVOperation(
        routing.executionPlan.operationId,
      )
    ) {
      const executionStartedAt =
        performance.now();

      executionResult =
        await dispatchAskSearchPVOperation(
          routing.executionPlan,
          {
            permissionScope: "public",
          },
        );

      executionMs =
        performance.now() -
        executionStartedAt;
    }

    const totalMs =
      performance.now() - startedAt;

    const response = composeResponse({
      requestId,
      question: apiRequest.question,
      routing,
      executionResult,
      processingMs: totalMs,
    });

    const payload: AskSearchPVApiSuccess = {
      response,
    };

    if (
      apiRequest.debug === true &&
      debugOutputIsAllowed()
    ) {
      payload.debug = {
        routing,
        executionResult,
        timing: {
          routingMs: roundMs(routingMs),
          executionMs: roundMs(executionMs),
          totalMs: roundMs(totalMs),
        },
      };
    }

    return NextResponse.json(
      payload,
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    if (error instanceof InvalidJsonError) {
      return errorResponse(
        requestId,
        "invalid_json",
        error.message,
        400,
      );
    }

    console.error(
      "Ask SearchPV request failed.",
      {
        requestId,
        error,
      },
    );

    return errorResponse(
      requestId,
      "execution_failed",
      getSafeErrorMessage(error),
      500,
    );
  }
}

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InvalidJsonError();
  }
}

function validateRequestBody(
  value: unknown,
): string | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return "The request body must be a JSON object.";
  }

  const body = value as Record<
    string,
    unknown
  >;

  if (typeof body.question !== "string") {
    return 'The "question" field is required and must be a string.';
  }

  const question = body.question.trim();

  if (!question) {
    return 'The "question" field cannot be empty.';
  }

  if (
    question.length > MAX_QUESTION_LENGTH
  ) {
    return `The question cannot exceed ${MAX_QUESTION_LENGTH.toLocaleString(
      "en-US",
    )} characters.`;
  }

  if (
    body.debug !== undefined &&
    typeof body.debug !== "boolean"
  ) {
    return 'The optional "debug" field must be true or false.';
  }

  if (
    body.context !== undefined &&
    !isPlainObject(body.context)
  ) {
    return 'The optional "context" field must be an object.';
  }

  if (
    body.preferences !== undefined &&
    !isPlainObject(body.preferences)
  ) {
    return 'The optional "preferences" field must be an object.';
  }

  return undefined;
}

function normalizeRequest(
  value: unknown,
): AskSearchPVApiRequest {
  const body =
    value as AskSearchPVApiRequest;

  return {
    question: body.question.trim(),
    context: body.context,
    preferences: body.preferences,
    debug: body.debug,
  };
}

function composeResponse({
  requestId,
  question,
  routing,
  executionResult,
  processingMs,
}: {
  requestId: string;
  question: string;
  routing: RouteAskSearchPVResult;
  executionResult?: AskSearchPVExecutionResult;
  processingMs: number;
}): AskSearchPVResponse {
  if (
    routing.interpretation.intent ===
      "clarification_required" ||
    routing.interpretation
      .needsClarification
  ) {
    return {
      requestId,
      question,
      interpretation:
        routing.interpretation,
      answer: {
        headline: "One quick clarification",
        summary:
          routing.interpretation
            .clarificationQuestion ??
          "I need one more detail before I can run that SearchPV request.",
      },
      blocks: [
        {
          type: "clarification",
          reason:
            routing.geographyResolutions.some(
              (resolution) =>
                resolution.requiresClarification,
            )
              ? "ambiguous_geography"
              : "ambiguous_intent",
          question:
            routing.interpretation
              .clarificationQuestion ??
            "Could you clarify what you would like to search?",
          options:
            buildClarificationOptions(
              routing,
            ),
        },
      ],
      sources: [],
      diagnostics: {
        processingMs:
          roundMs(processingMs),
        classifier:
          "deterministic-v1",
        geographyResolver:
          "public.resolve_geography",
        warnings:
          combineWarnings(routing),
      },
    };
  }

  if (
    routing.interpretation.intent ===
      "unsupported"
  ) {
    return {
      requestId,
      question,
      interpretation:
        routing.interpretation,
      answer: {
        headline:
          "That is outside Ask SearchPV’s current scope",
        summary:
          "I can help search properties, explain verified market statistics, compare locations, describe developments, and find SearchPV pages.",
        humor:
          "I know a lot about Vallarta real estate; airline reservations remain safely outside my jurisdiction.",
      },
      blocks: [],
      sources: [],
      suggestedQuestions: [
        "Show me active condos in Marina Vallarta.",
        "What is the median sold price in Bucerías?",
        "Compare Amapas and Conchas Chinas.",
      ],
      diagnostics: {
        processingMs:
          roundMs(processingMs),
        classifier:
          "deterministic-v1",
        warnings:
          combineWarnings(routing),
      },
    };
  }

  if (
    routing.executionPlan &&
    !isImplementedAskSearchPVOperation(
      routing.executionPlan.operationId,
    )
  ) {
    return {
      requestId,
      question,
      interpretation:
        routing.interpretation,
      answer: {
        headline:
          "I understood the request",
        summary:
          `The ${routing.executionPlan.operationId} operation is defined, but its execution service has not been connected yet.`,
        expertContext:
          "Property search and single-market statistics are currently executable. Comparison, development, and navigation services are the next service layer.",
      },
      blocks: [],
      sources: [],
      diagnostics: {
        processingMs:
          roundMs(processingMs),
        classifier:
          "deterministic-v1",
        geographyResolver:
          "public.resolve_geography",
        warnings:
          combineWarnings(routing, [
            `Operation ${routing.executionPlan.operationId} is not implemented.`,
          ]),
      },
    };
  }

  if (!executionResult) {
    return {
      requestId,
      question,
      interpretation:
        routing.interpretation,
      answer: {
        headline:
          "I understood part of the request",
        summary:
          "No executable SearchPV operation was produced. Please add a location or a more specific real-estate question.",
      },
      blocks: [],
      sources: [],
      diagnostics: {
        processingMs:
          roundMs(processingMs),
        classifier:
          "deterministic-v1",
        warnings:
          combineWarnings(routing, [
            "No execution result was produced.",
          ]),
      },
    };
  }

  switch (executionResult.operationId) {
    case "property.search":
      return composePropertySearchResponse(
        requestId,
        question,
        routing,
        executionResult,
        processingMs,
      );

    case "market.statistics":
      return composeMarketStatisticsResponse(
        requestId,
        question,
        routing,
        executionResult,
        processingMs,
      );

    default:
      return assertNever(executionResult);
  }
}

function composePropertySearchResponse(
  requestId: string,
  question: string,
  routing: RouteAskSearchPVResult,
  execution:
    Extract<
      AskSearchPVExecutionResult,
      {
        operationId: "property.search";
      }
    >,
  processingMs: number,
): AskSearchPVResponse {
  const { result } = execution;

  const headline =
    result.totalCount === 1
      ? "1 matching property"
      : `${result.totalCount.toLocaleString(
          "en-US",
        )} matching properties`;

  const blocks: AskSearchPVResponseBlock[] =
    [
      {
        type: "listing_table",
        title: "Matching Listings",
        rows: result.rows,
        totalCount: result.totalCount,
        resultLimit:
          result.resultLimit,
      },
    ];

  const sources: AskSearchPVSource[] =
    [
      {
        id: "property-search",
        label:
          "SearchPV Property Search",
        sourceType: "function",
        sourceName:
          "public.ai_property_search",
        dataCurrentAsOf:
          result.dataCurrentAsOf,
        notes:
          "Search results use approved active, pending, and closed listing sources.",
      },
    ];

  return {
    requestId,
    question,
    interpretation:
      routing.interpretation,
    answer: {
      headline,
      summary:
        result.totalCount > 0
          ? `I found ${result.totalCount.toLocaleString(
              "en-US",
            )} properties matching the interpreted filters and returned the first ${result.rows.length.toLocaleString(
              "en-US",
            )}.`
          : "I did not find properties matching the interpreted filters.",
      expertContext:
        result.totalCount >
        result.rows.length
          ? "The result table is limited for readability; the total count reflects all matching records."
          : undefined,
    },
    blocks,
    sources,
    suggestedQuestions: [
      "Show only the lowest-priced matches.",
      "Change the bedroom or price range.",
      "What are the market statistics for this location?",
    ],
    diagnostics: {
      processingMs:
        roundMs(processingMs),
      classifier:
        "deterministic-v1",
      geographyResolver:
        "public.resolve_geography",
      warnings: combineWarnings(
        routing,
        result.warnings,
      ),
    },
  };
}

function composeMarketStatisticsResponse(
  requestId: string,
  question: string,
  routing: RouteAskSearchPVResult,
  execution:
    Extract<
      AskSearchPVExecutionResult,
      {
        operationId:
          "market.statistics";
      }
    >,
  processingMs: number,
): AskSearchPVResponse {
  const { result } = execution;

  const presentation =
    formatMarketStatisticsPresentation(
      result,
    );

  const metricBlock: MetricCardBlock = {
    type: "metric_cards",
    title: `${result.geography.canonicalName} Market Snapshot`,
    metrics: result.metrics.map(
      (metric) => ({
        metricId: metric.metricId,
        label: metric.label,
        value: metric.value,
        formattedValue:
          formatMetricValue(
            metric.value,
            metric.valueType,
          ),
        definition:
          metric.description,
      }),
    ),
  };

  const sources: AskSearchPVSource[] =
    [
      {
        id: "market-statistics",
        label:
          presentation.sourceLabel,
        sourceType: "view",
        sourceName:
          `public.${result.sourceView}`,
        dataCurrentAsOf:
          result.snapshotDate,
        periodStart:
          result.salesPeriodStart,
        periodEnd:
          result.salesPeriodEnd,
        notes:
          presentation.sourceNotes,
      },
    ];

  return {
    requestId,
    question,
    interpretation:
      routing.interpretation,
    answer:
      presentation.answer,
    blocks: [metricBlock],
    sources,
    suggestedQuestions: [
      `Show me active listings in ${result.geography.canonicalName}.`,
      `What is the median sold price in ${result.geography.canonicalName}?`,
      "Compare this market with another location.",
    ],
    diagnostics: {
      processingMs:
        roundMs(processingMs),
      classifier:
        "deterministic-v1",
      geographyResolver:
        "public.resolve_geography",
      warnings: combineWarnings(
        routing,
        result.warnings,
      ),
    },
  };
}

function buildClarificationOptions(
  routing: RouteAskSearchPVResult,
):
  | Array<{
      id: string;
      label: string;
      description?: string;
      value?: string;
      entityKey?: number;
    }>
  | undefined {
  const resolution =
    routing.geographyResolutions.find(
      (item) =>
        item.requiresClarification,
    );

  if (!resolution) {
    return undefined;
  }

  const candidates =
    resolution.candidates.slice(0, 5);

  if (candidates.length === 0) {
    return undefined;
  }

  return candidates.map(
    (candidate, index) => ({
      id:
        candidate.identifier ??
        `geography-${index + 1}`,
      label:
        candidate.canonicalName ??
        candidate.inputText,
      description:
        candidate.entityType
          ? `${capitalize(
              candidate.entityType,
            )} · ${Math.round(
              candidate.confidence *
                100,
            )}% match`
          : undefined,
      value:
        candidate.identifier,
      entityKey:
        candidate.entityKey,
    }),
  );
}

function combineWarnings(
  routing: RouteAskSearchPVResult,
  additional: string[] = [],
): string[] | undefined {
  const warnings = [
    ...routing.warnings,
    ...additional,
  ].filter(Boolean);

  const uniqueWarnings = [
    ...new Set(warnings),
  ];

  return uniqueWarnings.length > 0
    ? uniqueWarnings
    : undefined;
}

function formatMetricValue(
  value: number | null,
  valueType: string,
): string | undefined {
  if (value === null) {
    return undefined;
  }

  switch (valueType) {
    case "currency":
      return new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        },
      ).format(value);

    case "percentage":
      return new Intl.NumberFormat(
        "en-US",
        {
          style: "percent",
          maximumFractionDigits: 1,
        },
      ).format(
        Math.abs(value) > 1
          ? value / 100
          : value,
      );

    case "decimal":
      return new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 2,
        },
      ).format(value);

    case "integer":
    default:
      return new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0,
        },
      ).format(value);
  }
}

function debugOutputIsAllowed(): boolean {
  return (
    process.env.NODE_ENV !==
      "production" ||
    process.env.ASK_SEARCHPV_DEBUG ===
      "true"
  );
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function roundMs(
  value: number,
): number {
  return Math.round(value * 10) / 10;
}

function capitalize(
  value: string,
): string {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function getSafeErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof InvalidJsonError
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ask SearchPV could not complete the request.";
}

function errorResponse(
  requestId: string,
  code:
    | "invalid_json"
    | "invalid_request"
    | "execution_failed",
  message: string,
  status: number,
): NextResponse<AskSearchPVApiError> {
  return NextResponse.json(
    {
      requestId,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}

class InvalidJsonError extends Error {
  constructor() {
    super(
      "The request body must contain valid JSON.",
    );

    this.name = "InvalidJsonError";
  }
}

function assertNever(
  value: never,
): never {
  throw new Error(
    `Unsupported execution result: ${JSON.stringify(
      value,
    )}`,
  );
}