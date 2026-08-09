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
  longitude: number;
  latitude: number;
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

export type AtlasSheetState =
  | "collapsed"
  | "half"
  | "focused";

type AtlasStateContextValue = {
  selectedEntity: AtlasEntity | null;
  selectedBoundary: AtlasBoundary | null;
  sheetState: AtlasSheetState;

  selectEntity: (entity: AtlasEntity) => void;
  selectBoundary: (boundary: AtlasBoundary) => void;
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

  const [sheetState, setSheetState] =
    useState<AtlasSheetState>("collapsed");

  function selectEntity(entity: AtlasEntity) {
    setSelectedEntity(entity);
    setSelectedBoundary(null);
    setSheetState("half");
  }

  function selectBoundary(boundary: AtlasBoundary) {
    setSelectedBoundary(boundary);
    setSelectedEntity(null);
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

    if (!selectedEntity) {
      setSheetState("collapsed");
    }
  }

  function clearSelection() {
    setSelectedEntity(null);
    setSelectedBoundary(null);
    setSheetState("collapsed");
  }

  return (
    <AtlasStateContext.Provider
      value={{
        selectedEntity,
        selectedBoundary,
        sheetState,
        selectEntity,
        selectBoundary,
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
      "useAtlasState must be used inside AtlasStateProvider"
    );
  }

  return context;
}