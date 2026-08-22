"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type AtlasEntity = {
  entityKy: number;
  entityType: string;
  canonicalName: string;
  displayName: string;

  longitude?: number;
  latitude?: number;

  parentName?: string;

  boundary?: {
    type: "Feature";
    geometry: {
      type: string;
      coordinates: unknown;
    };
    properties?: Record<string, unknown>;
  } | null;
};

export type AtlasBoundary = {
  boundaryKy: number;
  boundaryName: string;
  boundaryType?: string;
  municipalityName?: string;
  districtName?: string;
};

export type AtlasPropertyTypeFilter =
  | "all"
  | "condo"
  | "house";

export type AtlasMarketTypeFilter =
  | "all"
  | "resale"
  | "precon";

export type AtlasSheetState =
  | "collapsed"
  | "half"
  | "focused";

/*
 * Atlas interaction mode.
 *
 * explore:
 * Normal Atlas behavior.
 *
 * custom-select:
 * User is building a Custom Market.
 */
export type AtlasMode =
  | "explore"
  | "custom-select";

/*
 * Method used to define the Custom Market.
 *
 * select:
 * User selects existing government polygons.
 *
 * draw:
 * User draws a custom polygon.
 *
 * Drawing geometry itself will be added in the
 * next implementation step.
 */
export type AtlasCustomMarketMethod =
  | "select"
  | "draw";

type AtlasStateContextValue = {
  /*
   * Broader geography being explored.
   *
   * Example:
   * Marina Vallarta
   */
  contextEntity: AtlasEntity | null;

  /*
   * Geography currently driving market statistics.
   */
  analysisEntity: AtlasEntity | null;

  /*
   * Exact government polygon currently focused.
   */
  focusedBoundary: AtlasBoundary | null;

  /*
   * Backward-compatible names.
   */
  selectedEntity: AtlasEntity | null;
  selectedBoundary: AtlasBoundary | null;

  /*
   * MLS geographies related to the focused polygon.
   */
  relatedEntities: AtlasEntity[];

  /*
   * Whether the focused polygon belongs to the
   * broader Explore context.
   */
  focusMatchesContext: boolean;

  /*
   * ==========================================================
   * CUSTOM MARKET
   * ==========================================================
   */

  mode: AtlasMode;

  /*
   * Which Custom Market creation method is active.
   */
  customMarketMethod: AtlasCustomMarketMethod;

  /*
   * Government polygons currently included in the
   * Custom Market Select Areas method.
   *
   * Store the full boundary object rather than only keys so
   * the UI can display names and metadata immediately.
   */
  customBoundaries: AtlasBoundary[];

  propertyTypeFilter: AtlasPropertyTypeFilter;
  marketTypeFilter: AtlasMarketTypeFilter;

  sheetState: AtlasSheetState;

  /*
   * ==========================================================
   * EXPLORE ACTIONS
   * ==========================================================
   */

  selectEntity: (entity: AtlasEntity) => void;

  selectBoundary: (
    boundary: AtlasBoundary,
    relatedEntities?: AtlasEntity[],
  ) => void;

  selectGeography: (
    entity: AtlasEntity,
    boundary: AtlasBoundary,
  ) => void;

  resetAnalysisToContext: () => void;

  /*
   * ==========================================================
   * CUSTOM MARKET ACTIONS
   * ==========================================================
   */

  startCustomMarket: () => void;

  setCustomMarketMethod: (
    method: AtlasCustomMarketMethod,
  ) => void;

  toggleCustomBoundary: (
    boundary: AtlasBoundary,
  ) => void;

  clearCustomBoundaries: () => void;

  exitCustomMarket: () => void;

  setPropertyTypeFilter: (
    filter: AtlasPropertyTypeFilter,
  ) => void;

  setMarketTypeFilter: (
    filter: AtlasMarketTypeFilter,
  ) => void;

  clearEntity: () => void;
  clearBoundary: () => void;
  clearSelection: () => void;

  setSheetState: (
    state: AtlasSheetState,
  ) => void;
};

const AtlasStateContext =
  createContext<AtlasStateContextValue | null>(
    null,
  );

function normalizeName(
  value?: string | null,
) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

/*
 * Does this MLS entity belong to the broader context?
 */
function entityBelongsToContext(
  context: AtlasEntity,
  candidate: AtlasEntity,
) {
  if (
    Number(context.entityKy) ===
    Number(candidate.entityKy)
  ) {
    return true;
  }

  if (
    context.entityType === "AR" &&
    candidate.entityType === "CM"
  ) {
    const contextNames =
      new Set(
        [
          context.displayName,
          context.canonicalName,
        ]
          .map(normalizeName)
          .filter(Boolean),
      );

    return contextNames.has(
      normalizeName(
        candidate.parentName,
      ),
    );
  }

  return false;
}

export function AtlasStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * ==========================================================
   * EXPLORE STATE
   * ==========================================================
   */

  const [
    contextEntity,
    setContextEntity,
  ] =
    useState<AtlasEntity | null>(
      null,
    );

  const [
    analysisEntity,
    setAnalysisEntity,
  ] =
    useState<AtlasEntity | null>(
      null,
    );

  const [
    focusedBoundary,
    setFocusedBoundary,
  ] =
    useState<AtlasBoundary | null>(
      null,
    );

  const [
    focusMatchesContext,
    setFocusMatchesContext,
  ] = useState(true);

  const [
    relatedEntities,
    setRelatedEntities,
  ] =
    useState<AtlasEntity[]>([]);

  /*
   * ==========================================================
   * CUSTOM MARKET STATE
   * ==========================================================
   */

  const [
    mode,
    setMode,
  ] =
    useState<AtlasMode>(
      "explore",
    );

  /*
   * Default Custom Market workflow:
   *
   * Select existing government areas.
   */
  const [
    customMarketMethod,
    setCustomMarketMethodState,
  ] =
    useState<AtlasCustomMarketMethod>(
      "select",
    );

  const [
    customBoundaries,
    setCustomBoundaries,
  ] =
    useState<AtlasBoundary[]>(
      [],
    );

  /*
   * ==========================================================
   * MARKET FILTERS
   * ==========================================================
   */

  const [
    propertyTypeFilter,
    setPropertyTypeFilter,
  ] =
    useState<AtlasPropertyTypeFilter>(
      "all",
    );

  const [
    marketTypeFilter,
    setMarketTypeFilter,
  ] =
    useState<AtlasMarketTypeFilter>(
      "all",
    );

  const [
    sheetState,
    setSheetState,
  ] =
    useState<AtlasSheetState>(
      "collapsed",
    );

  /*
   * Existing components use selectedEntity /
   * selectedBoundary.
   */
  const selectedEntity =
    analysisEntity;

  const selectedBoundary =
    focusedBoundary;

  /*
   * ==========================================================
   * DIRECT SEARCH / MLS GEOGRAPHY SELECTION
   * ==========================================================
   */

  function selectEntity(
    entity: AtlasEntity,
  ) {
    setContextEntity(entity);
    setAnalysisEntity(entity);

    setFocusedBoundary(null);
    setRelatedEntities([]);
    setFocusMatchesContext(true);

    setSheetState("half");
  }

  /*
   * ==========================================================
   * GOVERNMENT POLYGON CLICK
   * ==========================================================
   *
   * This remains normal Explore behavior.
   *
   * AtlasMap decides whether a click should call:
   *
   * mode === "explore"
   *     -> selectBoundary(...)
   *
   * mode === "custom-select"
   *     -> Custom Market behavior
   */

  function selectBoundary(
    boundary: AtlasBoundary,
    entities: AtlasEntity[] = [],
  ) {
    setFocusedBoundary(boundary);
    setRelatedEntities(entities);

    /*
     * Existing broader context.
     */
    if (contextEntity) {
      const belongsToContext =
        entities.some(
          (entity) =>
            entityBelongsToContext(
              contextEntity,
              entity,
            ),
        );

      if (belongsToContext) {
        setAnalysisEntity(
          contextEntity,
        );

        setFocusMatchesContext(
          true,
        );

        setSheetState("half");

        return;
      }

      /*
       * Polygon outside current context.
       *
       * Preserve broader context in memory.
       */
      setAnalysisEntity(null);

      setFocusMatchesContext(
        false,
      );

      setSheetState("half");

      return;
    }

    /*
     * No existing context.
     *
     * One related MLS geography is safe to
     * adopt automatically.
     */
    if (entities.length === 1) {
      setContextEntity(
        entities[0],
      );

      setAnalysisEntity(
        entities[0],
      );

      setFocusMatchesContext(
        true,
      );

      setSheetState("half");

      return;
    }

    /*
     * Zero or multiple matches.
     *
     * Do not guess.
     */
    setContextEntity(null);
    setAnalysisEntity(null);

    setFocusMatchesContext(false);

    setSheetState("half");
  }

  /*
   * ==========================================================
   * EXPLICIT RELATED MLS GEOGRAPHY SELECTION
   * ==========================================================
   */

  function selectGeography(
    entity: AtlasEntity,
    boundary: AtlasBoundary,
  ) {
    if (
      contextEntity &&
      focusMatchesContext
    ) {
      setAnalysisEntity(entity);

      /*
       * Selected MLS geography may not correspond
       * precisely to the government polygon.
       */
      setFocusedBoundary(null);
      setRelatedEntities([]);

      setFocusMatchesContext(
        true,
      );

      setSheetState("half");

      return;
    }

    /*
     * Start a new broader context.
     */
    setContextEntity(entity);
    setAnalysisEntity(entity);

    setFocusedBoundary(null);
    setRelatedEntities([]);

    setFocusMatchesContext(true);

    setSheetState("half");
  }

  /*
   * ==========================================================
   * RESET ANALYSIS TO BROADER CONTEXT
   * ==========================================================
   */

  function resetAnalysisToContext() {
    if (!contextEntity) {
      return;
    }

    setAnalysisEntity(
      contextEntity,
    );

    setFocusedBoundary(null);
    setRelatedEntities([]);

    setFocusMatchesContext(true);

    setSheetState("half");
  }

  /*
   * ==========================================================
   * CUSTOM MARKET
   * ==========================================================
   */

  function startCustomMarket() {
    /*
     * Every new Custom Market begins in Select Areas mode.
     */
    setCustomMarketMethodState(
      "select",
    );

    /*
     * Start with no selected government polygons.
     */
    setCustomBoundaries([]);

    setMode(
      "custom-select",
    );

    /*
     * Leave Explore context untouched.
     *
     * Cancel / Exit returns the user to exactly
     * where they were before Custom Market.
     */
  }

  /*
   * Switch between:
   *
   * Select Areas
   * Draw Area
   *
   * IMPORTANT:
   *
   * Do not clear customBoundaries when switching.
   *
   * That makes switching methods reversible.
   */
  function setCustomMarketMethod(
    method: AtlasCustomMarketMethod,
  ) {
    setCustomMarketMethodState(
      method,
    );
  }

  function toggleCustomBoundary(
    boundary: AtlasBoundary,
  ) {
    setCustomBoundaries(
      (current) => {
        const alreadySelected =
          current.some(
            (item) =>
              Number(
                item.boundaryKy,
              ) ===
              Number(
                boundary.boundaryKy,
              ),
          );

        if (alreadySelected) {
          return current.filter(
            (item) =>
              Number(
                item.boundaryKy,
              ) !==
              Number(
                boundary.boundaryKy,
              ),
          );
        }

        return [
          ...current,
          boundary,
        ];
      },
    );
  }

  function clearCustomBoundaries() {
    setCustomBoundaries([]);
  }

  function exitCustomMarket() {
    /*
     * Exit Custom Market and return to Explore.
     *
     * Abandon the current Custom Market selection.
     */
    setCustomBoundaries([]);

    /*
     * Reset the next Custom Market session to
     * Select Areas.
     */
    setCustomMarketMethodState(
      "select",
    );

    setMode("explore");
  }

  /*
   * ==========================================================
   * CLEARING EXPLORE STATE
   * ==========================================================
   */

  function clearEntity() {
    setContextEntity(null);
    setAnalysisEntity(null);

    setFocusMatchesContext(
      false,
    );

    if (!focusedBoundary) {
      setSheetState(
        "collapsed",
      );
    }
  }

  function clearBoundary() {
    setFocusedBoundary(null);
    setRelatedEntities([]);

    if (contextEntity) {
      setAnalysisEntity(
        contextEntity,
      );

      setFocusMatchesContext(
        true,
      );
    } else {
      setAnalysisEntity(null);

      setFocusMatchesContext(
        false,
      );

      setSheetState(
        "collapsed",
      );
    }
  }

  function clearSelection() {
    setContextEntity(null);
    setAnalysisEntity(null);

    setFocusedBoundary(null);
    setRelatedEntities([]);

    setFocusMatchesContext(true);

    setSheetState(
      "collapsed",
    );
  }

  return (
    <AtlasStateContext.Provider
      value={{
        contextEntity,
        analysisEntity,
        focusedBoundary,

        selectedEntity,
        selectedBoundary,

        relatedEntities,
        focusMatchesContext,

        mode,
        customMarketMethod,
        customBoundaries,

        propertyTypeFilter,
        marketTypeFilter,

        sheetState,

        selectEntity,
        selectBoundary,
        selectGeography,
        resetAnalysisToContext,

        startCustomMarket,
        setCustomMarketMethod,
        toggleCustomBoundary,
        clearCustomBoundaries,
        exitCustomMarket,

        setPropertyTypeFilter,
        setMarketTypeFilter,

        clearEntity,
        clearBoundary,
        clearSelection,

        setSheetState,
      }}
    >
      {children}
    </AtlasStateContext.Provider>
  );
}

export function useAtlasState() {
  const context =
    useContext(
      AtlasStateContext,
    );

  if (!context) {
    throw new Error(
      "useAtlasState must be used inside AtlasStateProvider",
    );
  }

  return context;
}