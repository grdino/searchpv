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

export type AtlasSheetState = "collapsed" | "half" | "focused";

type AtlasStateContextValue = {
  selectedEntity: AtlasEntity | null;
  sheetState: AtlasSheetState;

  selectEntity: (entity: AtlasEntity) => void;
  clearEntity: () => void;
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

  const [sheetState, setSheetState] =
    useState<AtlasSheetState>("collapsed");

  function selectEntity(entity: AtlasEntity) {
    setSelectedEntity(entity);
    setSheetState("half");
  }

  function clearEntity() {
    setSelectedEntity(null);
    setSheetState("collapsed");
  }

  return (
    <AtlasStateContext.Provider
      value={{
        selectedEntity,
        sheetState,
        selectEntity,
        clearEntity,
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