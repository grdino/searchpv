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
 * Consumer market filters.
 *
 * These live in Atlas state rather than inside the bottom sheet
 * so the same filters can later drive:
 *
 * - market statistics
 * - listing markers
 * - Homes for Sale links
 * - market observations / fun facts
 */
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

type AtlasStateContextValue = {
  selectedEntity: AtlasEntity | null;
  selectedBoundary: AtlasBoundary | null;

  /*
   * All MLS entities that use the currently selected
   * government boundary.
   */
  relatedEntities: AtlasEntity[];

  /*
   * Consumer market filters.
   */
  propertyTypeFilter: AtlasPropertyTypeFilter;
  marketTypeFilter: AtlasMarketTypeFilter;

  sheetState: AtlasSheetState;

  /*
   * Direct SearchPV selection, normally from search.
   */
  selectEntity: (entity: AtlasEntity) => void;

  /*
   * Government-boundary selection.
   *
   * The related entity list tells Atlas which MLS footprints
   * include this government polygon.
   */
  selectBoundary: (
    boundary: AtlasBoundary,
    relatedEntities?: AtlasEntity[],
  ) => void;

  /*
   * Explicitly choose one MLS entity while retaining the
   * selected government polygon.
   */
  selectGeography: (
    entity: AtlasEntity,
    boundary: AtlasBoundary,
  ) => void;

  /*
   * Market-filter controls.
   */
  setPropertyTypeFilter: (
    filter: AtlasPropertyTypeFilter,
  ) => void;

  setMarketTypeFilter: (
    filter: AtlasMarketTypeFilter,
  ) => void;

  clearEntity: () => void;
  clearBoundary: () => void;
  clearSelection: () => void;

  setSheetState: (state: AtlasSheetState) => void;
};

const AtlasStateContext =
  createContext<AtlasStateContextValue | null>(null);

export function AtlasStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedEntity, setSelectedEntity] =
    useState<AtlasEntity | null>(null);

  const [selectedBoundary, setSelectedBoundary] =
    useState<AtlasBoundary | null>(null);

  const [relatedEntities, setRelatedEntities] =
    useState<AtlasEntity[]>([]);

  /*
   * Default consumer view:
   *
   * All property types
   * All market types
   */
  const [
    propertyTypeFilter,
    setPropertyTypeFilter,
  ] = useState<AtlasPropertyTypeFilter>("all");

  const [
    marketTypeFilter,
    setMarketTypeFilter,
  ] = useState<AtlasMarketTypeFilter>("all");

  const [sheetState, setSheetState] =
    useState<AtlasSheetState>("collapsed");

  /*
   * Direct MLS entity selection.
   *
   * Starting a new SearchPV selection clears the previous
   * government-boundary detail.
   *
   * IMPORTANT:
   * We deliberately DO NOT reset the market filters here.
   *
   * If someone chooses:
   *
   *   Condos + Resale
   *
   * and then explores another neighborhood, Atlas should retain
   * that lens so the user can compare places naturally.
   */
  function selectEntity(entity: AtlasEntity) {
    setSelectedEntity(entity);
    setSelectedBoundary(null);
    setRelatedEntities([]);
    setSheetState("half");
  }

  /*
   * Government polygon selected.
   *
   * If the currently selected MLS entity uses this polygon,
   * preserve it.
   *
   * Otherwise clear the old MLS entity and let the bottom
   * sheet show all MLS entities related to this polygon.
   */
  function selectBoundary(
    boundary: AtlasBoundary,
    entities: AtlasEntity[] = [],
  ) {
    setSelectedBoundary(boundary);
    setRelatedEntities(entities);

    setSelectedEntity((current) => {
      /*
      * If the currently selected MLS geography uses this
      * government polygon, preserve it.
      */
      if (current) {
        const stillRelated = entities.some(
          (entity) =>
            Number(entity.entityKy) ===
            Number(current.entityKy),
        );

        if (stillRelated) {
          return current;
        }
      }

      /*
      * The previous MLS geography does not apply here,
      * or there was no previous MLS geography.
      *
      * If this government polygon belongs to exactly one
      * MLS geography, select it automatically.
      */
      if (entities.length === 1) {
        return entities[0];
      }

      /*
      * Zero or multiple MLS matches.
      *
      * Do not guess.
      */
      return null;
    });

    setSheetState("half");
  }

  /*
   * User explicitly chooses one of the MLS footprints related
   * to the selected government polygon.
   */
  function selectGeography(
    entity: AtlasEntity,
    boundary: AtlasBoundary,
  ) {
    setSelectedEntity(entity);
    setSelectedBoundary(boundary);
    setSheetState("half");
  }

  function clearEntity() {
    setSelectedEntity(null);

    if (!selectedBoundary) {
      setSheetState("collapsed");
    }
  }

  function clearBoundary() {
    setSelectedBoundary(null);
    setRelatedEntities([]);

    if (!selectedEntity) {
      setSheetState("collapsed");
    }
  }

  function clearSelection() {
    setSelectedEntity(null);
    setSelectedBoundary(null);
    setRelatedEntities([]);
    setSheetState("collapsed");
  }

  return (
    <AtlasStateContext.Provider
      value={{
        selectedEntity,
        selectedBoundary,
        relatedEntities,

        propertyTypeFilter,
        marketTypeFilter,

        sheetState,

        selectEntity,
        selectBoundary,
        selectGeography,

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
  const context = useContext(AtlasStateContext);

  if (!context) {
    throw new Error(
      "useAtlasState must be used inside AtlasStateProvider",
    );
  }

  return context;
}