// src/lib/ask-searchpv/dispatcher.ts

import {
  getAskSearchPVOperation,
  type AskSearchPVExecutionPlan,
  type AskSearchPVOperationDefinition,
  type AskSearchPVOperationId,
  type AskSearchPVPermissionScope,
} from "./operations";

import {
  getMarketStatistics,
  type MarketStatisticsResult,
} from "./services/market-statistics";

import {
  searchProperties,
  type PropertySearchResult,
} from "./services/property-search";

import type {
  MarketStatisticsParameters,
  PropertySearchParameters,
} from "./types";

/**
 * Operations that currently have executable MVP services.
 *
 * The complete operation registry also contains comparison,
 * development-information, and navigation operations. Those remain
 * registered so the intent and API contracts are stable, but the
 * dispatcher will reject them until their services are implemented.
 */
export const IMPLEMENTED_ASK_SEARCHPV_OPERATION_IDS = [
  "property.search",
  "market.statistics",
] as const;

export type ImplementedAskSearchPVOperationId =
  (typeof IMPLEMENTED_ASK_SEARCHPV_OPERATION_IDS)[number];

/**
 * Result returned by the runtime dispatcher.
 *
 * Keeping the operation ID beside the service result makes later
 * response composition deterministic: the composer can switch on
 * operationId and receive the corresponding strongly typed result.
 */
export type AskSearchPVExecutionResult =
  | {
      operationId: "property.search";
      operation: AskSearchPVOperationDefinition;
      result: PropertySearchResult;
    }
  | {
      operationId: "market.statistics";
      operation: AskSearchPVOperationDefinition;
      result: MarketStatisticsResult;
    };

/**
 * Runtime context supplied by the API layer.
 *
 * Public is the default scope. Office operations can be introduced
 * later without changing the dispatcher contract.
 */
export interface AskSearchPVDispatchContext {
  permissionScope?: AskSearchPVPermissionScope;
}

/**
 * Execute one validated Ask SearchPV plan.
 *
 * Responsibilities:
 * - confirm the operation exists and is enabled
 * - enforce the operation permission scope
 * - confirm the plan intent matches the operation registry
 * - route parameters to the correct deterministic service
 *
 * The dispatcher does not classify questions, resolve geography,
 * calculate metrics, or compose user-facing prose.
 */
export async function dispatchAskSearchPVOperation(
  plan: AskSearchPVExecutionPlan,
  context: AskSearchPVDispatchContext = {},
): Promise<AskSearchPVExecutionResult> {
  const operation = getAskSearchPVOperation(
    plan.operationId,
  );

  validateExecutionPlan(plan, operation);
  validatePermission(
    operation,
    context.permissionScope ?? "public",
  );

  switch (plan.operationId) {
    case "property.search": {
      const result = await searchProperties(
        plan.parameters as PropertySearchParameters,
      );

      return {
        operationId: "property.search",
        operation,
        result,
      };
    }

    case "market.statistics": {
      const result = await getMarketStatistics(
        plan.parameters as MarketStatisticsParameters,
      );

      return {
        operationId: "market.statistics",
        operation,
        result,
      };
    }

    case "market.compare":
    case "development.information":
    case "navigation.search":
      throw createNotImplementedError(
        plan.operationId,
        operation,
      );

    default:
      return assertNever(plan.operationId);
  }
}

/**
 * Determine whether an operation currently has an executable service.
 *
 * This is useful to the intent router and API layer when deciding
 * whether to execute a plan or return a controlled unsupported response.
 */
export function isImplementedAskSearchPVOperation(
  operationId: AskSearchPVOperationId,
): operationId is ImplementedAskSearchPVOperationId {
  return (
    IMPLEMENTED_ASK_SEARCHPV_OPERATION_IDS as readonly string[]
  ).includes(operationId);
}

function validateExecutionPlan(
  plan: AskSearchPVExecutionPlan,
  operation: AskSearchPVOperationDefinition,
): void {
  if (!operation.enabledForMvp) {
    throw new Error(
      `Ask SearchPV operation ${operation.id} is not enabled for the MVP.`,
    );
  }

  if (plan.intent !== operation.intent) {
    throw new Error(
      [
        `Ask SearchPV execution plan is inconsistent.`,
        `Operation ${operation.id} expects intent ${operation.intent},`,
        `but the plan contains ${plan.intent}.`,
      ].join(" "),
    );
  }

  if (
    plan.permissionScope !== operation.permissionScope
  ) {
    throw new Error(
      [
        `Ask SearchPV execution plan has an invalid permission scope.`,
        `Operation ${operation.id} requires ${operation.permissionScope},`,
        `but the plan contains ${plan.permissionScope}.`,
      ].join(" "),
    );
  }

  if (
    plan.parameters === null ||
    typeof plan.parameters !== "object"
  ) {
    throw new Error(
      `Ask SearchPV operation ${operation.id} requires a parameters object.`,
    );
  }
}

function validatePermission(
  operation: AskSearchPVOperationDefinition,
  availableScope: AskSearchPVPermissionScope,
): void {
  if (operation.permissionScope === "public") {
    return;
  }

  if (availableScope !== "office") {
    throw new Error(
      `Ask SearchPV operation ${operation.id} requires office access.`,
    );
  }
}

function createNotImplementedError(
  operationId: AskSearchPVOperationId,
  operation: AskSearchPVOperationDefinition,
): Error {
  return new Error(
    [
      `Ask SearchPV operation ${operationId} is registered`,
      `but its ${operation.executor} service has not been implemented yet.`,
    ].join(" "),
  );
}

function assertNever(value: never): never {
  throw new Error(
    `Unsupported Ask SearchPV operation: ${String(value)}.`,
  );
}