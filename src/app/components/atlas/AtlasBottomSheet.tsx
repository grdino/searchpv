"use client";

import { useEffect, useState } from "react";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";

function entityTypeLabel(entityType: string) {
  switch (entityType) {
    case "ZN":
    case "zone":
      return "MLS Zone";

    case "AR":
    case "area":
      return "MLS Area";

    case "CM":
    case "community":
      return "MLS Community";

    case "DV":
    case "development":
      return "Development";

    default:
      return "MLS Geography";
  }
}

function isDevelopmentEntityType(
  entityType: string | null | undefined,
) {
  return (
    entityType === "DV" ||
    entityType === "development"
  );
}

type SummaryMode =
  | "median"
  | "avg";

type AreaUnit =
  | "ft2"
  | "m2";

type MarketSnapshot = {
  snapshotDate: string | null;

  activeCount: number;
  pendingCount: number;
  sales12Mo: number;

  avgListPrice: number | null;
  medianListPrice: number | null;

  avgListPriceFt2: number | null;
  medianListPriceFt2: number | null;

  avgListPriceM2: number | null;
  medianListPriceM2: number | null;

  bedroom?: string;

  boundaryCount?: number;
  boundaryKys?: number[];

  geometryType?: string;
  areaM2?: number | null;

  sourceType?: string;

  entityKy?: number;

  developmentName?: string | null;

  zoneName?: string | null;
  areaName?: string | null;
  communityName?: string | null;

  longitude?: number | null;
  latitude?: number | null;

  propertyCount?: number;
  condoPropertyCount?: number;
  housePropertyCount?: number;

  currentAvgDom?: number | null;

  avgSoldPrice?: number | null;
  medianSoldPrice?: number | null;

  avgSoldPriceFt2?: number | null;
  medianSoldPriceFt2?: number | null;

  avgSoldPriceM2?: number | null;
  medianSoldPriceM2?: number | null;

  soldAvgDom12Mo?: number | null;

  monthsInventory?: number | null;
};

function formatPrice(
  value: number | null,
) {
  if (value === null) {
    return "—";
  }

  if (value >= 1_000_000) {
    const millions =
      value / 1_000_000;

    return `$${millions.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(
      value / 1_000,
    ).toLocaleString("en-US")}K`;
  }

  return `$${Math.round(
    value,
  ).toLocaleString("en-US")}`;
}

function formatWholeNumber(
  value: number | null,
) {
  if (value === null) {
    return "—";
  }

  return Math.round(
    value,
  ).toLocaleString("en-US");
}

export default function AtlasBottomSheet() {
  const {
    contextEntity,
    analysisEntity,

    selectedEntity,
    selectedBoundary,
    relatedEntities,

    popularAreaSelection,

    mode,

    customMarketMethod,
    setCustomMarketMethod,

    customBoundaries,
    toggleCustomBoundary,
    clearCustomBoundaries,

    customDrawVertices,
    customDrawnGeometry,
    customDrawActive,

    exitCustomMarket,

    propertyTypeFilter,
    marketTypeFilter,
    bedroomFilter,

    sheetState,
    setSheetState,

    setPropertyTypeFilter,
    setMarketTypeFilter,
    setBedroomFilter,

    selectGeography,
    resetAnalysisToContext,
  } = useAtlasState();

  const isFocused =
    sheetState === "focused";

  const isCustomMarket =
    mode === "custom-select";

  const isSelectAreas =
    isCustomMarket &&
    customMarketMethod === "select";

  const isDrawArea =
    isCustomMarket &&
    customMarketMethod === "draw";

  /*
   * A Draw Area becomes a market only after the polygon
   * has been finished.
   */
  const hasFinishedDrawing =
    isDrawArea &&
    !customDrawActive &&
    Boolean(
      customDrawnGeometry,
    );

  const [
    marketSnapshot,
    setMarketSnapshot,
  ] =
    useState<MarketSnapshot | null>(
      null,
    );

  const [
    marketSnapshotLoading,
    setMarketSnapshotLoading,
  ] =
    useState(false);

  /*
   * Atlas display preferences.
   */
  const [
    summaryMode,
    setSummaryMode,
  ] =
    useState<SummaryMode>(
      "median",
    );

  const [
    areaUnit,
    setAreaUnit,
  ] =
    useState<AreaUnit>(
      "ft2",
    );

  const relatedChoices =
    relatedEntities.filter(
      (entity) =>
        entity.entityKy !==
        selectedEntity?.entityKy,
    );

  /*
   * ==========================================================
   * DEVELOPMENT CONTEXT
   * ==========================================================
   */

  const isDevelopment =
    Boolean(
      !isCustomMarket &&
        !popularAreaSelection &&
        selectedEntity &&
        isDevelopmentEntityType(
          selectedEntity.entityType,
        ),
    );

  /*
   * ==========================================================
   * MARKET SNAPSHOT SOURCES
   * ==========================================================
   */

  const hasPopularAreaMarketContext =
    Boolean(
      !isCustomMarket &&
        popularAreaSelection &&
        popularAreaSelection
          .boundaryKys
          .length > 0,
    );

  const hasDevelopmentMarketContext =
    Boolean(
      !isCustomMarket &&
        !popularAreaSelection &&
        selectedEntity &&
        isDevelopmentEntityType(
          selectedEntity.entityType,
        ),
    );

  const hasMlsMarketContext =
    Boolean(
      !isCustomMarket &&
        !popularAreaSelection &&
        !hasDevelopmentMarketContext &&
        selectedEntity &&
        ["CM", "AR"].includes(
          selectedEntity.entityType,
        ),
    );

  const hasBoundaryMarketContext =
    Boolean(
      !isCustomMarket &&
        !popularAreaSelection &&
        !hasDevelopmentMarketContext &&
        !hasMlsMarketContext &&
        selectedBoundary,
    );

  const hasSelectedAreaMarketContext =
    Boolean(
      isSelectAreas &&
        customBoundaries.length >
          0,
    );

  const hasDrawnMarketContext =
    Boolean(
      hasFinishedDrawing &&
        customDrawnGeometry,
    );

  const hasMarketContext =
    hasPopularAreaMarketContext ||
    hasDevelopmentMarketContext ||
    hasMlsMarketContext ||
    hasBoundaryMarketContext ||
    hasSelectedAreaMarketContext ||
    hasDrawnMarketContext;

  /*
   * ==========================================================
   * LOAD MARKET SNAPSHOT
   * ==========================================================
   */

  useEffect(() => {
    if (
      isDrawArea &&
      (
        customDrawActive ||
        !customDrawnGeometry
      )
    ) {
      setMarketSnapshot(
        null,
      );

      setMarketSnapshotLoading(
        false,
      );

      return;
    }

    if (
      isSelectAreas &&
      customBoundaries.length ===
        0
    ) {
      setMarketSnapshot(
        null,
      );

      setMarketSnapshotLoading(
        false,
      );

      return;
    }

    if (
      !hasMarketContext
    ) {
      setMarketSnapshot(
        null,
      );

      setMarketSnapshotLoading(
        false,
      );

      return;
    }

    const controller =
      new AbortController();

    async function loadMarketSnapshot() {
      setMarketSnapshotLoading(
        true,
      );

      setMarketSnapshot(
        null,
      );

      try {
        let response: Response;

        /*
         * ------------------------------------------------------
         * CUSTOM MARKET — DRAW AREA
         * ------------------------------------------------------
         */

        if (
          hasDrawnMarketContext &&
          customDrawnGeometry
        ) {
          response =
            await fetch(
              "/api/atlas/drawn-market-snapshot",
              {
                method:
                  "POST",

                cache:
                  "no-store",

                signal:
                  controller.signal,

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    geometry:
                      customDrawnGeometry,

                    propertyType:
                      propertyTypeFilter,

                    marketType:
                      marketTypeFilter,

                    bedroom:
                      bedroomFilter,
                  }),
              },
            );
        }

        /*
         * ------------------------------------------------------
         * POPULAR AREA
         * ------------------------------------------------------
         */

        else if (
          hasPopularAreaMarketContext &&
          popularAreaSelection
        ) {
          const params =
            new URLSearchParams();

          for (
            const boundaryKy of
              popularAreaSelection.boundaryKys
          ) {
            params.append(
              "boundaryKy",
              String(
                boundaryKy,
              ),
            );
          }

          params.set(
            "propertyType",
            propertyTypeFilter,
          );

          params.set(
            "marketType",
            marketTypeFilter,
          );

          params.set(
            "bedroom",
            bedroomFilter,
          );

          response =
            await fetch(
              `/api/atlas/custom-market-snapshot?${params.toString()}`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );
        }

        /*
         * ------------------------------------------------------
         * CUSTOM MARKET — SELECT AREAS
         * ------------------------------------------------------
         */

        else if (
          hasSelectedAreaMarketContext
        ) {
          const params =
            new URLSearchParams();

          for (
            const boundary of
              customBoundaries
          ) {
            params.append(
              "boundaryKy",
              String(
                boundary.boundaryKy,
              ),
            );
          }

          params.set(
            "propertyType",
            propertyTypeFilter,
          );

          params.set(
            "marketType",
            marketTypeFilter,
          );

          params.set(
            "bedroom",
            bedroomFilter,
          );

          response =
            await fetch(
              `/api/atlas/custom-market-snapshot?${params.toString()}`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );
        }

        /*
         * ------------------------------------------------------
         * DEVELOPMENT
         * ------------------------------------------------------
         */

        else if (
          hasDevelopmentMarketContext &&
          selectedEntity
        ) {
          const params =
            new URLSearchParams({
              entityKy:
                String(
                  selectedEntity.entityKy,
                ),

              propertyType:
                propertyTypeFilter,

              marketType:
                marketTypeFilter,

              bedroom:
                bedroomFilter,
            });

          response =
            await fetch(
              `/api/atlas/development-snapshot?${params.toString()}`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );
        }

        /*
         * ------------------------------------------------------
         * MLS AREA / COMMUNITY
         * ------------------------------------------------------
         */

        else if (
          hasMlsMarketContext &&
          selectedEntity
        ) {
          const params =
            new URLSearchParams({
              entityKy:
                String(
                  selectedEntity.entityKy,
                ),

              propertyType:
                propertyTypeFilter,

              marketType:
                marketTypeFilter,

              bedroom:
                bedroomFilter,
            });

          response =
            await fetch(
              `/api/atlas/market-snapshot?${params.toString()}`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );
        }

        /*
         * ------------------------------------------------------
         * GOVERNMENT LOCAL AREA
         * ------------------------------------------------------
         */

        else if (
          selectedBoundary
        ) {
          const params =
            new URLSearchParams({
              boundaryKy:
                String(
                  selectedBoundary.boundaryKy,
                ),

              propertyType:
                propertyTypeFilter,

              marketType:
                marketTypeFilter,

              bedroom:
                bedroomFilter,
            });

          response =
            await fetch(
              `/api/atlas/boundary-market-snapshot?${params.toString()}`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );
        }

        else {
          setMarketSnapshot(
            null,
          );

          setMarketSnapshotLoading(
            false,
          );

          return;
        }

        if (
          !response.ok
        ) {
          const errorData =
            await response
              .json()
              .catch(
                () => null,
              );

          throw new Error(
            errorData?.error ??
              "Unable to load market snapshot.",
          );
        }

        const data =
          (await response.json()) as MarketSnapshot;

        setMarketSnapshot(
          data,
        );
      } catch (
        error
      ) {
        if (
          error instanceof
            DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Atlas market snapshot error:",
          error,
        );

        setMarketSnapshot(
          null,
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setMarketSnapshotLoading(
            false,
          );
        }
      }
    }

    void loadMarketSnapshot();

    return () => {
      controller.abort();
    };
  }, [
    isSelectAreas,
    isDrawArea,

    customBoundaries,

    customDrawnGeometry,
    customDrawActive,

    hasMarketContext,
    hasPopularAreaMarketContext,
    hasDevelopmentMarketContext,
    hasSelectedAreaMarketContext,
    hasDrawnMarketContext,
    hasMlsMarketContext,

    popularAreaSelection,

    selectedEntity,
    selectedBoundary,

    propertyTypeFilter,
    marketTypeFilter,
    bedroomFilter,
  ]);

  /*
   * ==========================================================
   * TEMPORARY CURATED COMMUNITY CONTENT
   * ==========================================================
   */

  const isAmapas =
    !isCustomMarket &&
    !popularAreaSelection &&
    !isDevelopment &&
    selectedEntity
      ?.canonicalName
      ?.trim()
      .toLowerCase() ===
      "amapas";

  const communityTagline =
    isAmapas
      ? "Hillside living above Zona Romántica"
      : selectedEntity?.parentName
        ? `Explore ${selectedEntity.parentName}`
        : "Explore this part of Banderas Bay";

  const developmentLocation =
    [
      marketSnapshot
        ?.communityName,

      marketSnapshot
        ?.areaName,
    ]
      .filter(
        Boolean,
      )
      .join(
        " · ",
      );

  /*
   * ==========================================================
   * ACTIVE PRICING DISPLAY
   * ==========================================================
   */

  const displayedListPrice =
    summaryMode ===
    "avg"
      ? marketSnapshot
          ?.avgListPrice ??
        null
      : marketSnapshot
          ?.medianListPrice ??
        null;

  const displayedAreaPrice =
    areaUnit ===
    "m2"
      ? summaryMode ===
        "avg"
        ? marketSnapshot
            ?.avgListPriceM2 ??
          null
        : marketSnapshot
            ?.medianListPriceM2 ??
          null
      : summaryMode ===
          "avg"
        ? marketSnapshot
            ?.avgListPriceFt2 ??
          null
        : marketSnapshot
            ?.medianListPriceFt2 ??
          null;

  const listPriceLabel =
    summaryMode ===
    "avg"
      ? "Avg List"
      : "Median List";

  const areaPriceLabel =
    `${
      summaryMode ===
      "avg"
        ? "Avg"
        : "Median"
    } $/${
      areaUnit ===
      "m2"
        ? "m²"
        : "ft²"
    }`;

  /*
   * ==========================================================
   * COMPACT FILTER STYLING
   * ==========================================================
   */

  const filterLabelStyle = {
    width: 62,
    fontSize: 9,
    fontWeight: 750,
    letterSpacing:
      "0.09em",
    color:
      "#94a3b8",
    textTransform:
      "uppercase" as const,
    flexShrink: 0,
  };

  function filterButtonStyle(
    active: boolean,
  ) {
    return {
      border:
        active
          ? isCustomMarket
            ? "1px solid #0f766e"
            : "1px solid #a9792b"
          : "1px solid #e2e8f0",

      borderRadius:
        999,

      padding:
        "4px 8px",

      minHeight:
        26,

      background:
        active
          ? isCustomMarket
            ? "#ecfdf5"
            : "#fff8e8"
          : "#ffffff",

      color:
        active
          ? isCustomMarket
            ? "#115e59"
            : "#8a5a18"
          : "#64748b",

      fontSize:
        10,

      lineHeight:
        1,

      fontWeight:
        700,

      whiteSpace:
        "nowrap" as const,

      cursor:
        "pointer",
    };
  }

  return (
    <section
      style={{
        position:
          "absolute",

        left: 0,
        right: 0,
        bottom: 0,

        pointerEvents:
          "auto",

        background:
          "rgba(255,255,255,0.94)",

        borderRadius:
          "28px 28px 0 0",

        padding:
          "10px 20px 24px",

        boxShadow:
          "0 -10px 35px rgba(15,23,42,0.12)",

        backdropFilter:
          "blur(16px)",

        maxHeight:
          isFocused
            ? "82vh"
            : "44vh",

        overflowY:
          "auto",

        transition:
          "max-height 300ms ease",
      }}
    >
      {/* =====================================================
          SHEET HANDLE
          ===================================================== */}

      <button
        type="button"
        aria-label={
          isFocused
            ? "Collapse details"
            : "Expand details"
        }
        onClick={() =>
          setSheetState(
            isFocused
              ? "half"
              : "focused",
          )
        }
        style={{
          display:
            "block",

          width: 70,
          height: 20,

          padding: 0,

          margin:
            "0 auto 8px",

          border: 0,

          background:
            "transparent",

          cursor:
            "pointer",
        }}
      >
        <span
          style={{
            display:
              "block",

            width: 44,
            height: 5,

            borderRadius:
              999,

            background:
              "#cbd5e1",

            margin:
              "0 auto",
          }}
        />
      </button>

      <div
        style={{
          maxWidth:
            680,

          margin:
            "0 auto",
        }}
      >
        {/* =====================================================
            STICKY IDENTITY HEADER
            ===================================================== */}

        <div
          style={{
            position:
              "sticky",

            top: 0,

            zIndex: 10,

            margin:
              "0 -6px",

            padding:
              "2px 6px 10px",

            background:
              "rgba(255,255,255,0.94)",

            backdropFilter:
              "blur(16px)",

            WebkitBackdropFilter:
              "blur(16px)",

            borderBottom:
              "1px solid rgba(226,232,240,0.65)",
          }}
        >
          {isCustomMarket ? (
            <>
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.12em",

                  color:
                    "#0f766e",

                  textTransform:
                    "uppercase",
                }}
              >
                Custom Market
              </div>

              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    25,

                  lineHeight:
                    1.08,

                  fontWeight:
                    700,

                  color:
                    "#0f172a",
                }}
              >
                Your Selected Area
              </div>

              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    12,

                  color:
                    "#64748b",
                }}
              >
                Build your own real estate market.
              </div>
            </>
          ) : popularAreaSelection ? (
            <>
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.12em",

                  color:
                    "#a9792b",

                  textTransform:
                    "uppercase",
                }}
              >
                Atlas Area
              </div>

              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    25,

                  lineHeight:
                    1.08,

                  fontWeight:
                    700,

                  color:
                    "#0f172a",
                }}
              >
                {
                  popularAreaSelection.displayName
                }
              </div>

              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    12,

                  color:
                    "#64748b",
                }}
              >
                One of the area's most active resale markets.
              </div>
            </>
          ) : selectedEntity ? (
            <>
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.12em",

                  color:
                    "#a9792b",

                  textTransform:
                    "uppercase",
                }}
              >
                {entityTypeLabel(
                  selectedEntity.entityType,
                )}
              </div>

              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    25,

                  lineHeight:
                    1.08,

                  fontWeight:
                    700,

                  color:
                    "#0f172a",
                }}
              >
                {
                  selectedEntity.displayName
                }
              </div>

              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    12,

                  color:
                    "#64748b",
                }}
              >
                {isDevelopment
                  ? marketSnapshotLoading
                    ? "Loading development market…"
                    : developmentLocation ||
                      selectedEntity.parentName ||
                      "Development"
                  : communityTagline}
              </div>

              {!isDevelopment &&
              contextEntity &&
              analysisEntity &&
              Number(
                contextEntity.entityKy,
              ) !==
                Number(
                  analysisEntity.entityKy,
                ) ? (
                <button
                  type="button"
                  onClick={
                    resetAnalysisToContext
                  }
                  style={{
                    marginTop:
                      7,

                    border:
                      "1px solid #d6b56b",

                    borderRadius:
                      999,

                    padding:
                      "4px 9px",

                    background:
                      "#fffaf0",

                    color:
                      "#8a5a18",

                    fontSize:
                      10,

                    fontWeight:
                      700,

                    cursor:
                      "pointer",
                  }}
                >
                  All{" "}
                  {
                    contextEntity.displayName
                  }
                </button>
              ) : null}
            </>
          ) : selectedBoundary ? (
            <>
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  letterSpacing:
                    "0.12em",

                  color:
                    "#94a3b8",

                  textTransform:
                    "uppercase",
                }}
              >
                Local Area
              </div>

              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    24,

                  lineHeight:
                    1.08,

                  fontWeight:
                    700,

                  color:
                    "#0f172a",
                }}
              >
                {
                  selectedBoundary.boundaryName
                }
              </div>

              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    12,

                  color:
                    "#64748b",
                }}
              >
                {[
                  selectedBoundary.boundaryType,
                  selectedBoundary.districtName,
                  selectedBoundary.municipalityName,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " · ",
                  )}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  letterSpacing:
                    "0.12em",

                  color:
                    "#94a3b8",

                  textTransform:
                    "uppercase",
                }}
              >
                Explore the Bay
              </div>

              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    24,

                  fontWeight:
                    700,

                  color:
                    "#0f172a",
                }}
              >
                Banderas Bay
              </div>

              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    12,

                  color:
                    "#64748b",
                }}
              >
                Search, tap the map, or choose a popular area.
              </div>
            </>
          )}
        </div>

        {/* =====================================================
            CUSTOM MARKET CONTROLS
            ===================================================== */}

        {isCustomMarket ? (
          <>
            <div
              style={{
                display:
                  "inline-flex",

                marginTop:
                  10,

                overflow:
                  "hidden",

                border:
                  "1px solid #99f6e4",

                borderRadius:
                  999,

                background:
                  "#ffffff",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setCustomMarketMethod(
                    "select",
                  )
                }
                style={{
                  border:
                    0,

                  padding:
                    "6px 11px",

                  background:
                    isSelectAreas
                      ? "#0f766e"
                      : "#ffffff",

                  color:
                    isSelectAreas
                      ? "#ffffff"
                      : "#475569",

                  fontSize:
                    10,

                  fontWeight:
                    750,

                  cursor:
                    "pointer",
                }}
              >
                Select Areas
              </button>

              <button
                type="button"
                onClick={() =>
                  setCustomMarketMethod(
                    "draw",
                  )
                }
                style={{
                  border:
                    0,

                  borderLeft:
                    "1px solid #ccfbf1",

                  padding:
                    "6px 11px",

                  background:
                    isDrawArea
                      ? "#0f766e"
                      : "#ffffff",

                  color:
                    isDrawArea
                      ? "#ffffff"
                      : "#475569",

                  fontSize:
                    10,

                  fontWeight:
                    750,

                  cursor:
                    "pointer",
                }}
              >
                Draw Area
              </button>
            </div>

            {isSelectAreas ? (
              <>
                <div
                  style={{
                    marginTop:
                      8,

                    fontSize:
                      12,

                    lineHeight:
                      1.4,

                    color:
                      "#64748b",
                  }}
                >
                  {customBoundaries.length ===
                  0
                    ? "Tap government areas on the map to build your market."
                    : customBoundaries.length ===
                        1
                      ? "1 government area selected."
                      : `${customBoundaries.length} government areas selected.`}
                </div>

                {customBoundaries.length >
                0 ? (
                  <div
                    style={{
                      display:
                        "flex",

                      flexWrap:
                        "wrap",

                      gap: 6,

                      marginTop:
                        8,
                    }}
                  >
                    {customBoundaries.map(
                      (
                        boundary,
                      ) => (
                        <button
                          key={
                            boundary.boundaryKy
                          }
                          type="button"
                          onClick={() =>
                            toggleCustomBoundary(
                              boundary,
                            )
                          }
                          aria-label={`Remove ${boundary.boundaryName} from Custom Market`}
                          title={`Remove ${boundary.boundaryName}`}
                          style={{
                            display:
                              "inline-flex",

                            alignItems:
                              "center",

                            gap: 6,

                            borderRadius:
                              999,

                            padding:
                              "4px 7px 4px 8px",

                            background:
                              "#ecfdf5",

                            color:
                              "#115e59",

                            fontSize:
                              10,

                            fontWeight:
                              700,

                            border:
                              "1px solid #a7f3d0",

                            cursor:
                              "pointer",
                          }}
                        >
                          <span>
                            {
                              boundary.boundaryName
                            }
                          </span>

                          <span
                            aria-hidden="true"
                            style={{
                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              width:
                                15,

                              height:
                                15,

                              borderRadius:
                                999,

                              background:
                                "rgba(15,118,110,0.10)",

                              fontSize:
                                12,

                              lineHeight:
                                1,

                              fontWeight:
                                700,
                            }}
                          >
                            ×
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
              </>
            ) : null}

            {isDrawArea ? (
              <div
                style={{
                  marginTop:
                    10,

                  padding:
                    "11px 13px",

                  borderRadius:
                    14,

                  border:
                    hasFinishedDrawing
                      ? "1px solid #99f6e4"
                      : "1px dashed #99f6e4",

                  background:
                    "#f0fdfa",

                  color:
                    "#115e59",
                }}
              >
                <div
                  style={{
                    fontSize:
                      11,

                    fontWeight:
                      750,
                  }}
                >
                  {customDrawActive
                    ? "Drawing your market"
                    : customDrawnGeometry
                      ? "Custom area ready"
                      : "Draw your market"}
                </div>

                <div
                  style={{
                    marginTop:
                      4,

                    fontSize:
                      11,

                    lineHeight:
                      1.45,

                    color:
                      "#475569",
                  }}
                >
                  {customDrawActive
                    ? customDrawVertices.length ===
                      0
                      ? "Tap the map to place your first point."
                      : customDrawVertices.length <
                          3
                        ? `Keep adding points. ${customDrawVertices.length} selected so far.`
                        : "Your area is taking shape. Add more points or tap Finish Area on the map."
                    : customDrawnGeometry
                      ? "Atlas is calculating market statistics for the exact area you drew."
                      : "Use Start Drawing on the map, then tap around the area you want to analyze."}
                </div>
              </div>
            ) : null}

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: 7,

                marginTop:
                  9,
              }}
            >
              {isSelectAreas &&
              customBoundaries.length >
                0 ? (
                <button
                  type="button"
                  onClick={
                    clearCustomBoundaries
                  }
                  style={{
                    border:
                      "1px solid #cbd5e1",

                    borderRadius:
                      999,

                    padding:
                      "5px 9px",

                    background:
                      "#ffffff",

                    color:
                      "#475569",

                    fontSize:
                      10,

                    fontWeight:
                      700,

                    cursor:
                      "pointer",
                  }}
                >
                  Clear Areas
                </button>
              ) : null}

              <button
                type="button"
                onClick={
                  exitCustomMarket
                }
                style={{
                  border:
                    "1px solid #cbd5e1",

                  borderRadius:
                    999,

                  padding:
                    "5px 9px",

                  background:
                    "#ffffff",

                  color:
                    "#475569",

                  fontSize:
                    10,

                  fontWeight:
                    700,

                  cursor:
                    "pointer",
                }}
              >
                Exit Custom Market
              </button>
            </div>
          </>
        ) : null}

        {/* =====================================================
            MARKET FILTERS
            ===================================================== */}

        {hasMarketContext ? (
          <div
            style={{
              marginTop:
                12,

              paddingTop:
                10,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            {/* PROPERTY */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 6,
              }}
            >
              <div
                style={
                  filterLabelStyle
                }
              >
                Property:
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap: 4,

                  flexWrap:
                    "wrap",
                }}
              >
                {[
                  {
                    value:
                      "all",

                    label:
                      "All",
                  },

                  {
                    value:
                      "condo",

                    label:
                      "Condos",
                  },

                  {
                    value:
                      "house",

                    label:
                      "Houses",
                  },
                ].map(
                  (
                    option,
                  ) => {
                    const active =
                      propertyTypeFilter ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          setPropertyTypeFilter(
                            option.value as
                              | "all"
                              | "condo"
                              | "house",
                          )
                        }
                        style={
                          filterButtonStyle(
                            active,
                          )
                        }
                      >
                        {
                          option.label
                        }
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* MARKET */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 6,

                marginTop:
                  5,
              }}
            >
              <div
                style={
                  filterLabelStyle
                }
              >
                Market:
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap: 4,

                  flexWrap:
                    "wrap",
                }}
              >
                {[
                  {
                    value:
                      "all",

                    label:
                      "All",
                  },

                  {
                    value:
                      "resale",

                    label:
                      "Resale",
                  },

                  {
                    value:
                      "precon",

                    label:
                      "Pre-Con",
                  },
                ].map(
                  (
                    option,
                  ) => {
                    const active =
                      marketTypeFilter ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          setMarketTypeFilter(
                            option.value as
                              | "all"
                              | "resale"
                              | "precon",
                          )
                        }
                        style={
                          filterButtonStyle(
                            active,
                          )
                        }
                      >
                        {
                          option.label
                        }
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* BEDROOM */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 6,

                marginTop:
                  5,
              }}
            >
              <div
                style={
                  filterLabelStyle
                }
              >
                BR:
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap: 4,

                  flexWrap:
                    "wrap",
                }}
              >
                {[
                  {
                    value:
                      "all",

                    label:
                      "All",
                  },

                  {
                    value:
                      "0br",

                    label:
                      "Studio",
                  },

                  {
                    value:
                      "1br",

                    label:
                      "1BR",
                  },

                  {
                    value:
                      "2br",

                    label:
                      "2BR",
                  },

                  {
                    value:
                      "3br_plus",

                    label:
                      "3BR+",
                  },
                ].map(
                  (
                    option,
                  ) => {
                    const active =
                      bedroomFilter ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          setBedroomFilter(
                            option.value as
                              | "all"
                              | "0br"
                              | "1br"
                              | "2br"
                              | "3br_plus",
                          )
                        }
                        style={
                          filterButtonStyle(
                            active,
                          )
                        }
                      >
                        {
                          option.label
                        }
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* =====================================================
            SELECT AREAS EMPTY STATE
            ===================================================== */}

        {isSelectAreas &&
        customBoundaries.length ===
          0 ? (
          <div
            style={{
              marginTop:
                14,

              padding:
                "14px",

              borderRadius:
                14,

              border:
                "1px dashed #99f6e4",

              background:
                "#f0fdfa",

              color:
                "#115e59",

              fontSize:
                12,

              lineHeight:
                1.45,

              textAlign:
                "center",
            }}
          >
            Tap one or more government areas on the map. Atlas
            will combine them into one Custom Market and
            calculate the statistics automatically.
          </div>
        ) : null}

        {/* =====================================================
            LIVE MARKET SNAPSHOT
            ===================================================== */}

        {hasMarketContext ? (
          <>
            {/* ACTIVITY ROW */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",

                gap: 8,

                marginTop:
                  13,
              }}
            >
              {[
                {
                  label:
                    "Active",

                  value:
                    marketSnapshot
                      ?.activeCount,
                },

                {
                  label:
                    "Pending",

                  value:
                    marketSnapshot
                      ?.pendingCount,
                },

                {
                  label:
                    "Sold 12 Mo",

                  value:
                    marketSnapshot
                      ?.sales12Mo,
                },
              ].map(
                (
                  metric,
                ) => (
                  <button
                    key={
                      metric.label
                    }
                    type="button"
                    style={{
                      border:
                        "1px solid #e2e8f0",

                      padding:
                        "9px 10px",

                      borderRadius:
                        14,

                      background:
                        "#f8fafc",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          9,

                        fontWeight:
                          700,

                        letterSpacing:
                          "0.08em",

                        textTransform:
                          "uppercase",

                        color:
                          "#94a3b8",
                      }}
                    >
                      {
                        metric.label
                      }
                    </div>

                    <div
                      style={{
                        marginTop:
                          3,

                        fontSize:
                          19,

                        fontWeight:
                          750,

                        color:
                          "#0f172a",
                      }}
                    >
                      {marketSnapshotLoading
                        ? "…"
                        : metric.value ??
                          "—"}
                    </div>
                  </button>
                ),
              )}
            </div>

            {/* PRICING ROW */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",

                gap: 8,

                marginTop:
                  8,
              }}
            >
              {/* LIST PRICE */}

              <div
                style={{
                  padding:
                    "9px 10px 10px",

                  borderRadius:
                    14,

                  background:
                    "#f8fafc",
                }}
              >
                <div
                  style={{
                    display:
                      "inline-flex",

                    overflow:
                      "hidden",

                    borderRadius:
                      999,

                    border:
                      "1px solid #e2e8f0",

                    marginBottom:
                      8,
                  }}
                >
                  {[
                    {
                      value:
                        "median",

                      label:
                        "Med",
                    },

                    {
                      value:
                        "avg",

                      label:
                        "Avg",
                    },
                  ].map(
                    (
                      option,
                    ) => {
                      const active =
                        summaryMode ===
                        option.value;

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setSummaryMode(
                              option.value as SummaryMode,
                            )
                          }
                          style={{
                            border:
                              0,

                            padding:
                              "4px 8px",

                            background:
                              active
                                ? "#0f172a"
                                : "#ffffff",

                            color:
                              active
                                ? "#ffffff"
                                : "#64748b",

                            fontSize:
                              10,

                            fontWeight:
                              700,

                            cursor:
                              "pointer",
                          }}
                        >
                          {
                            option.label
                          }
                        </button>
                      );
                    },
                  )}
                </div>

                <div
                  style={{
                    fontSize:
                      9,

                    fontWeight:
                      700,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",

                    color:
                      "#94a3b8",
                  }}
                >
                  {
                    listPriceLabel
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      19,

                    fontWeight:
                      750,

                    color:
                      "#0f172a",
                  }}
                >
                  {marketSnapshotLoading
                    ? "…"
                    : formatPrice(
                        displayedListPrice,
                      )}
                </div>
              </div>

              {/* PRICE PER AREA */}

              <div
                style={{
                  padding:
                    "9px 10px 10px",

                  borderRadius:
                    14,

                  background:
                    "#f8fafc",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap: 5,

                    marginBottom:
                      8,

                    flexWrap:
                      "wrap",
                  }}
                >
                  <div
                    style={{
                      display:
                        "inline-flex",

                      overflow:
                        "hidden",

                      borderRadius:
                        999,

                      border:
                        "1px solid #e2e8f0",
                    }}
                  >
                    {[
                      {
                        value:
                          "median",

                        label:
                          "Med",
                      },

                      {
                        value:
                          "avg",

                        label:
                          "Avg",
                      },
                    ].map(
                      (
                        option,
                      ) => {
                        const active =
                          summaryMode ===
                          option.value;

                        return (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            onClick={() =>
                              setSummaryMode(
                                option.value as SummaryMode,
                              )
                            }
                            style={{
                              border:
                                0,

                              padding:
                                "4px 8px",

                              background:
                                active
                                  ? "#0f172a"
                                  : "#ffffff",

                              color:
                                active
                                  ? "#ffffff"
                                  : "#64748b",

                              fontSize:
                                10,

                              fontWeight:
                                700,

                              cursor:
                                "pointer",
                            }}
                          >
                            {
                              option.label
                            }
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "inline-flex",

                      overflow:
                        "hidden",

                      borderRadius:
                        999,

                      border:
                        "1px solid #e2e8f0",
                    }}
                  >
                    {[
                      {
                        value:
                          "ft2",

                        label:
                          "ft²",
                      },

                      {
                        value:
                          "m2",

                        label:
                          "m²",
                      },
                    ].map(
                      (
                        option,
                      ) => {
                        const active =
                          areaUnit ===
                          option.value;

                        return (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            onClick={() =>
                              setAreaUnit(
                                option.value as AreaUnit,
                              )
                            }
                            style={{
                              border:
                                0,

                              padding:
                                "4px 8px",

                              background:
                                active
                                  ? "#0f172a"
                                  : "#ffffff",

                              color:
                                active
                                  ? "#ffffff"
                                  : "#64748b",

                              fontSize:
                                10,

                              fontWeight:
                                700,

                              cursor:
                                "pointer",
                            }}
                          >
                            {
                              option.label
                            }
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize:
                      9,

                    fontWeight:
                      700,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",

                    color:
                      "#94a3b8",
                  }}
                >
                  {
                    areaPriceLabel
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      19,

                    fontWeight:
                      750,

                    color:
                      "#0f172a",
                  }}
                >
                  {marketSnapshotLoading
                    ? "…"
                    : displayedAreaPrice !==
                        null
                      ? `$${formatWholeNumber(
                          displayedAreaPrice,
                        )}`
                      : "—"}
                </div>
              </div>
            </div>

            {/* =================================================
                DEVELOPMENT MARKET DETAILS
                ================================================= */}

            {isDevelopment &&
            marketSnapshot ? (
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",

                  gap: 8,

                  marginTop:
                    8,
                }}
              >
                <div
                  style={{
                    padding:
                      "9px 10px",

                    borderRadius:
                      14,

                    background:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        9,

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.08em",

                      textTransform:
                        "uppercase",

                      color:
                        "#94a3b8",
                    }}
                  >
                    Avg DOM
                  </div>

                  <div
                    style={{
                      marginTop:
                        3,

                      fontSize:
                        17,

                      fontWeight:
                        750,

                      color:
                        "#0f172a",
                    }}
                  >
                    {marketSnapshot.currentAvgDom !==
                      null &&
                    marketSnapshot.currentAvgDom !==
                      undefined
                      ? formatWholeNumber(
                          marketSnapshot.currentAvgDom,
                        )
                      : "—"}
                  </div>
                </div>

                <div
                  style={{
                    padding:
                      "9px 10px",

                    borderRadius:
                      14,

                    background:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        9,

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.08em",

                      textTransform:
                        "uppercase",

                      color:
                        "#94a3b8",
                    }}
                  >
                    Months Inventory
                  </div>

                  <div
                    style={{
                      marginTop:
                        3,

                      fontSize:
                        17,

                      fontWeight:
                        750,

                      color:
                        "#0f172a",
                    }}
                  >
                    {marketSnapshot.monthsInventory !==
                      null &&
                    marketSnapshot.monthsInventory !==
                      undefined
                      ? Number(
                          marketSnapshot.monthsInventory,
                        ).toLocaleString(
                          "en-US",
                          {
                            maximumFractionDigits:
                              1,
                          },
                        )
                      : "—"}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {/* =====================================================
            TEMPORARY AMAPAS CONTENT
            ===================================================== */}

        {isAmapas ? (
          <>
            <div
              style={{
                marginTop:
                  13,

                fontSize:
                  13,

                lineHeight:
                  1.55,

                color:
                  "#475569",
              }}
            >
              Amapas climbs the hills just south of Zona
              Romántica, with a mix of established condos,
              newer developments and elevated homes known for
              views across Banderas Bay.
            </div>

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: 7,

                marginTop:
                  10,
              }}
            >
              {[
                "Ocean Views",
                "Condos",
                "Near Zona Romántica",
                "Hillside",
              ].map(
                (
                  label,
                ) => (
                  <span
                    key={
                      label
                    }
                    style={{
                      borderRadius:
                        999,

                      padding:
                        "5px 9px",

                      background:
                        "#f1f5f9",

                      color:
                        "#475569",

                      fontSize:
                        10,

                      fontWeight:
                        650,
                    }}
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </>
        ) : null}

        {/* =====================================================
            PRIMARY ACTIONS
            ===================================================== */}

        {!isCustomMarket &&
        hasMarketContext ? (
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",

              gap: 8,

              marginTop:
                13,
            }}
          >
            <button
              type="button"
              style={{
                border:
                  "1px solid #e2e8f0",

                borderRadius:
                  14,

                padding:
                  "9px 8px",

                background:
                  "#ffffff",

                color:
                  "#334155",

                fontSize:
                  11,

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              Market Stats
            </button>

            <button
              type="button"
              style={{
                border:
                  "1px solid #e2e8f0",

                borderRadius:
                  14,

                padding:
                  "9px 8px",

                background:
                  "#ffffff",

                color:
                  "#334155",

                fontSize:
                  11,

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              Nearby
            </button>
          </div>
        ) : null}

        {/* =====================================================
            CLICKED GOVERNMENT AREA INSIDE MLS CONTEXT
            ===================================================== */}

        {!isCustomMarket &&
        !isDevelopment &&
        selectedEntity &&
        selectedBoundary ? (
          <div
            style={{
              marginTop:
                14,

              paddingTop:
                10,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize:
                  9,

                fontWeight:
                  750,

                letterSpacing:
                  "0.10em",

                color:
                  "#94a3b8",

                textTransform:
                  "uppercase",
              }}
            >
              Local Government Area
            </div>

            <div
              style={{
                marginTop:
                  3,

                fontSize:
                  15,

                fontWeight:
                  650,

                color:
                  "#334155",
              }}
            >
              {
                selectedBoundary.boundaryName
              }
            </div>

            <div
              style={{
                marginTop:
                  2,

                fontSize:
                  11,

                color:
                  "#64748b",
              }}
            >
              {[
                selectedBoundary.boundaryType,
                selectedBoundary.districtName,
                selectedBoundary.municipalityName,
              ]
                .filter(
                  Boolean,
                )
                .join(
                  " · ",
                )}
            </div>
          </div>
        ) : null}

        {/* =====================================================
            RELATED MLS GEOGRAPHIES
            ===================================================== */}

        {!isCustomMarket &&
        !isDevelopment &&
        selectedBoundary &&
        relatedChoices.length >
          0 ? (
          <div
            style={{
              marginTop:
                12,

              paddingTop:
                10,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize:
                  9,

                fontWeight:
                  750,

                letterSpacing:
                  "0.10em",

                color:
                  "#94a3b8",

                textTransform:
                  "uppercase",
              }}
            >
              {selectedEntity
                ? "Also Part Of"
                : relatedChoices.length >
                    1
                  ? "Explore Real Estate Areas"
                  : "Real Estate Area"}
            </div>

            {!selectedEntity &&
            relatedChoices.length >
              1 ? (
              <div
                style={{
                  marginTop:
                    4,

                  fontSize:
                    11,

                  color:
                    "#64748b",
                }}
              >
                This local area overlaps more than one real
                estate community.
              </div>
            ) : null}

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: 7,

                marginTop:
                  7,
              }}
            >
              {relatedChoices.map(
                (
                  entity,
                ) => (
                  <button
                    key={
                      entity.entityKy
                    }
                    type="button"
                    onClick={() =>
                      selectGeography(
                        entity,
                        selectedBoundary,
                      )
                    }
                    style={{
                      border:
                        "1px solid #cbd5e1",

                      borderRadius:
                        999,

                      padding:
                        "6px 10px",

                      background:
                        "#ffffff",

                      color:
                        "#334155",

                      fontSize:
                        11,

                      fontWeight:
                        650,

                      cursor:
                        "pointer",
                    }}
                  >
                    {
                      entity.displayName
                    }

                    {entity.parentName
                      ? ` · ${entity.parentName}`
                      : ""}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}