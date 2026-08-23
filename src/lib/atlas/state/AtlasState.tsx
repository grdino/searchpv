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

/*
 * A Popular Area is an exact Atlas geographic footprint.
 *
 * It is deliberately NOT an MLS entity.
 *
 * Examples:
 *
 * Emiliano Zapata
 *   -> [437]
 *
 * Nuevo Nayarit
 *   -> [626]
 *
 * Las Glorias
 *   -> [365, 366, 370]
 */
export type AtlasPopularArea = {
  footprintKey: string;
  displayName: string;
  boundaryKys: number[];
  salesCount?: number;
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
 */
export type AtlasCustomMarketMethod =
  | "select"
  | "draw";

/*
 * A single longitude / latitude vertex.
 *
 * Mapbox uses:
 *
 * [longitude, latitude]
 */
export type AtlasDrawVertex =
  [
    number,
    number,
  ];

/*
 * Finished Custom Market polygon.
 *
 * Keep this intentionally small and GeoJSON-compatible so it
 * can later be sent directly to the statistics API.
 */
export type AtlasDrawnGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type AtlasStateContextValue = {
  /*
   * Broader geography being explored.
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
   * Exact footprint selected from the Popular Areas
   * discovery shortcuts.
   *
   * This remains separate from MLS entity selection so the
   * displayed name, highlighted geography and statistics can
   * all describe the same physical footprint.
   */
  popularAreaSelection: AtlasPopularArea | null;

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

  customMarketMethod: AtlasCustomMarketMethod;

  /*
   * Government polygons included through Select Areas.
   */
  customBoundaries: AtlasBoundary[];

  /*
   * Vertices currently being created in Draw Area mode.
   *
   * These are the editable/in-progress points.
   */
  customDrawVertices: AtlasDrawVertex[];

  /*
   * Completed polygon.
   *
   * Null means no finished custom drawing currently exists.
   */
  customDrawnGeometry: AtlasDrawnGeometry | null;

  /*
   * Whether a polygon is actively being created.
   */
  customDrawActive: boolean;

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
   * POPULAR AREA ACTIONS
   * ==========================================================
   */

  selectPopularArea: (
    area: AtlasPopularArea,
  ) => void;

  clearPopularArea: () => void;

  /*
   * ==========================================================
   * CUSTOM MARKET — GENERAL
   * ==========================================================
   */

  startCustomMarket: () => void;

  setCustomMarketMethod: (
    method: AtlasCustomMarketMethod,
  ) => void;

  exitCustomMarket: () => void;

  /*
   * ==========================================================
   * CUSTOM MARKET — SELECT AREAS
   * ==========================================================
   */

  toggleCustomBoundary: (
    boundary: AtlasBoundary,
  ) => void;

  clearCustomBoundaries: () => void;

  /*
   * ==========================================================
   * CUSTOM MARKET — DRAW AREA
   * ==========================================================
   */

  startCustomDraw: () => void;

  addCustomDrawVertex: (
    vertex: AtlasDrawVertex,
  ) => void;

  undoCustomDrawVertex: () => void;

  finishCustomDraw: () => void;

  clearCustomDraw: () => void;

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

  /*
   * Popular Area footprint selected from the discovery
   * shortcuts underneath Atlas Search.
   */
  const [
    popularAreaSelection,
    setPopularAreaSelection,
  ] =
    useState<AtlasPopularArea | null>(
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

  const [
    customMarketMethod,
    setCustomMarketMethodState,
  ] =
    useState<AtlasCustomMarketMethod>(
      "select",
    );

  /*
   * Select Areas state.
   */
  const [
    customBoundaries,
    setCustomBoundaries,
  ] =
    useState<AtlasBoundary[]>(
      [],
    );

  /*
   * Draw Area state.
   */
  const [
    customDrawVertices,
    setCustomDrawVertices,
  ] =
    useState<AtlasDrawVertex[]>(
      [],
    );

  const [
    customDrawnGeometry,
    setCustomDrawnGeometry,
  ] =
    useState<AtlasDrawnGeometry | null>(
      null,
    );

  const [
    customDrawActive,
    setCustomDrawActive,
  ] =
    useState(false);

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
    /*
     * A direct MLS geography selection replaces any Popular
     * Area footprint selection.
     */
    setPopularAreaSelection(
      null,
    );

    setContextEntity(entity);
    setAnalysisEntity(entity);

    setFocusedBoundary(null);
    setRelatedEntities([]);
    setFocusMatchesContext(true);

    setSheetState("half");
  }

  /*
   * ==========================================================
   * POPULAR AREA SELECTION
   * ==========================================================
   */

  function selectPopularArea(
    area: AtlasPopularArea,
  ) {
    /*
     * Popular Areas are standalone geographic footprints.
     *
     * Do not assign an arbitrary MLS entity as the context or
     * analysis entity. AtlasMap will use boundaryKys to
     * highlight and fit the exact footprint, while the
     * BottomSheet can use the same boundaryKys for statistics.
     */
    setPopularAreaSelection(
      area,
    );

    setContextEntity(null);
    setAnalysisEntity(null);

    setFocusedBoundary(null);
    setRelatedEntities([]);

    setFocusMatchesContext(
      true,
    );

    /*
     * Popular Area discovery is normal Explore behavior.
     */
    setMode("explore");

    setSheetState("half");
  }

  function clearPopularArea() {
    setPopularAreaSelection(
      null,
    );

    if (
      !contextEntity &&
      !analysisEntity &&
      !focusedBoundary
    ) {
      setSheetState(
        "collapsed",
      );
    }
  }

  /*
   * ==========================================================
   * GOVERNMENT POLYGON CLICK
   * ==========================================================
   */

  function selectBoundary(
    boundary: AtlasBoundary,
    entities: AtlasEntity[] = [],
  ) {
    /*
     * Clicking an individual map polygon exits the Popular
     * Area footprint selection and resumes ordinary Explore
     * behavior.
     */
    setPopularAreaSelection(
      null,
    );

    setFocusedBoundary(boundary);
    setRelatedEntities(entities);

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
    setPopularAreaSelection(
      null,
    );

    if (
      contextEntity &&
      focusMatchesContext
    ) {
      setAnalysisEntity(entity);

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

    setPopularAreaSelection(
      null,
    );

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
   * CUSTOM MARKET — GENERAL
   * ==========================================================
   */

  function startCustomMarket() {
    /*
     * Custom Market is a separate analysis mode.
     */
    setPopularAreaSelection(
      null,
    );

    /*
     * Every new Custom Market begins with Select Areas.
     */
    setCustomMarketMethodState(
      "select",
    );

    /*
     * Start both methods empty.
     */
    setCustomBoundaries([]);

    setCustomDrawVertices([]);
    setCustomDrawnGeometry(null);
    setCustomDrawActive(false);

    setMode(
      "custom-select",
    );

    /*
     * Preserve Explore context underneath.
     */
  }

  function setCustomMarketMethod(
    method: AtlasCustomMarketMethod,
  ) {
    setCustomMarketMethodState(
      method,
    );

    /*
     * Switching methods should not destroy either method's
     * saved work.
     *
     * However, if the user leaves Draw Area while actively
     * sketching an unfinished polygon, stop the active drawing
     * interaction while preserving its vertices.
     */
    if (method !== "draw") {
      setCustomDrawActive(
        false,
      );
    }
  }

  /*
   * ==========================================================
   * CUSTOM MARKET — SELECT AREAS
   * ==========================================================
   */

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

  /*
   * ==========================================================
   * CUSTOM MARKET — DRAW AREA
   * ==========================================================
   */

  function startCustomDraw() {
    /*
     * Starting a fresh drawing clears any previous completed
     * geometry and prior vertices.
     */
    setCustomDrawVertices(
      [],
    );

    setCustomDrawnGeometry(
      null,
    );

    setCustomDrawActive(
      true,
    );
  }

  function addCustomDrawVertex(
    vertex: AtlasDrawVertex,
  ) {
    if (
      !customDrawActive
    ) {
      return;
    }

    setCustomDrawVertices(
      (current) => [
        ...current,
        vertex,
      ],
    );
  }

  function undoCustomDrawVertex() {
    setCustomDrawVertices(
      (current) =>
        current.slice(
          0,
          -1,
        ),
    );
  }

  function finishCustomDraw() {
    /*
     * GeoJSON Polygon needs at least:
     *
     * 3 distinct vertices
     *
     * plus a closing vertex equal to the first point.
     */
    if (
      customDrawVertices.length <
      3
    ) {
      return;
    }

    const ring = [
      ...customDrawVertices,
      customDrawVertices[0],
    ];

    setCustomDrawnGeometry({
      type:
        "Polygon",

      coordinates: [
        ring,
      ],
    });

    setCustomDrawActive(
      false,
    );
  }

  function clearCustomDraw() {
    setCustomDrawVertices(
      [],
    );

    setCustomDrawnGeometry(
      null,
    );

    setCustomDrawActive(
      false,
    );
  }

  function exitCustomMarket() {
    /*
     * Abandon the current Custom Market entirely.
     */
    setCustomBoundaries([]);

    setCustomDrawVertices([]);
    setCustomDrawnGeometry(null);
    setCustomDrawActive(false);

    /*
     * Next Custom Market begins in Select Areas.
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

    if (
      !focusedBoundary &&
      !popularAreaSelection
    ) {
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

      if (!popularAreaSelection) {
        setSheetState(
          "collapsed",
        );
      }
    }
  }

  function clearSelection() {
    setContextEntity(null);
    setAnalysisEntity(null);

    setFocusedBoundary(null);
    setRelatedEntities([]);

    setPopularAreaSelection(
      null,
    );

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

        popularAreaSelection,

        selectedEntity,
        selectedBoundary,

        relatedEntities,
        focusMatchesContext,

        mode,
        customMarketMethod,

        customBoundaries,

        customDrawVertices,
        customDrawnGeometry,
        customDrawActive,

        propertyTypeFilter,
        marketTypeFilter,

        sheetState,

        selectEntity,
        selectBoundary,
        selectGeography,
        resetAnalysisToContext,

        selectPopularArea,
        clearPopularArea,

        startCustomMarket,
        setCustomMarketMethod,
        exitCustomMarket,

        toggleCustomBoundary,
        clearCustomBoundaries,

        startCustomDraw,
        addCustomDrawVertex,
        undoCustomDrawVertex,
        finishCustomDraw,
        clearCustomDraw,

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