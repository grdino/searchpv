"use client";

import { useEffect, useState } from "react";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";

function entityTypeLabel(entityType: string) {
  switch (entityType) {
    case "ZN":
      return "MLS Zone";

    case "AR":
      return "MLS Area";

    case "CM":
      return "MLS Community";

    default:
      return "MLS Geography";
  }
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

  boundaryCount?: number;
  boundaryKys?: number[];
};

function formatPrice(value: number | null) {
  if (value === null) return "—";

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;

    return `$${millions.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(
      value / 1_000,
    ).toLocaleString("en-US")}K`;
  }

  return `$${Math.round(value).toLocaleString(
    "en-US",
  )}`;
}

function formatWholeNumber(
  value: number | null,
) {
  if (value === null) return "—";

  return Math.round(value).toLocaleString(
    "en-US",
  );
}

export default function AtlasBottomSheet() {
  const {
    contextEntity,
    analysisEntity,

    selectedEntity,
    selectedBoundary,
    relatedEntities,

    mode,
    customBoundaries,
    toggleCustomBoundary,
    clearCustomBoundaries,
    exitCustomMarket,

    propertyTypeFilter,
    marketTypeFilter,

    sheetState,
    setSheetState,

    setPropertyTypeFilter,
    setMarketTypeFilter,

    selectGeography,
    resetAnalysisToContext,
  } = useAtlasState();

  const isFocused =
    sheetState === "focused";

  const isCustomMarket =
    mode === "custom-select";

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
  ] = useState(false);

  /*
   * Atlas display preferences.
   *
   * These apply to:
   *
   * - MLS Areas / Communities
   * - Government Local Areas
   * - Custom Markets
   */
  const [
    summaryMode,
    setSummaryMode,
  ] =
    useState<SummaryMode>("median");

  const [
    areaUnit,
    setAreaUnit,
  ] =
    useState<AreaUnit>("ft2");

  /*
   * Related MLS geographies for the currently
   * focused government polygon.
   */
  const relatedChoices =
    relatedEntities.filter(
      (entity) =>
        entity.entityKy !==
        selectedEntity?.entityKy,
    );

  /*
   * ==========================================================
   * MARKET SNAPSHOT SOURCE
   * ==========================================================
   *
   * Atlas now supports:
   *
   * 1. MLS Community / Area statistics
   * 2. Government Local Area statistics
   * 3. Custom Market statistics
   */

  const hasMlsMarketContext =
    Boolean(
      !isCustomMarket &&
        selectedEntity &&
        ["CM", "AR"].includes(
          selectedEntity.entityType,
        ),
    );

  const hasBoundaryMarketContext =
    Boolean(
      !isCustomMarket &&
        !hasMlsMarketContext &&
        selectedBoundary,
    );

  const hasCustomMarketContext =
    Boolean(
      isCustomMarket &&
        customBoundaries.length > 0,
    );

  const hasMarketContext =
    hasMlsMarketContext ||
    hasBoundaryMarketContext ||
    hasCustomMarketContext;

  useEffect(() => {
    /*
     * Custom Market with zero selected polygons is valid,
     * but there are no statistics to calculate yet.
     */
    if (
      isCustomMarket &&
      customBoundaries.length === 0
    ) {
      setMarketSnapshot(null);
      setMarketSnapshotLoading(false);
      return;
    }

    if (!hasMarketContext) {
      setMarketSnapshot(null);
      setMarketSnapshotLoading(false);
      return;
    }

    const controller =
      new AbortController();

    async function loadMarketSnapshot() {
      setMarketSnapshotLoading(true);
      setMarketSnapshot(null);

      try {
        let url: string;

        /*
         * ------------------------------------------------------
         * CUSTOM MARKET
         * ------------------------------------------------------
         */

        if (hasCustomMarketContext) {
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

          url =
            `/api/atlas/custom-market-snapshot?${params.toString()}`;
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
              entityKy: String(
                selectedEntity.entityKy,
              ),

              propertyType:
                propertyTypeFilter,

              marketType:
                marketTypeFilter,
            });

          url =
            `/api/atlas/market-snapshot?${params.toString()}`;
        }

        /*
         * ------------------------------------------------------
         * GOVERNMENT LOCAL AREA
         * ------------------------------------------------------
         */

        else if (selectedBoundary) {
          const params =
            new URLSearchParams({
              boundaryKy: String(
                selectedBoundary.boundaryKy,
              ),

              propertyType:
                propertyTypeFilter,

              marketType:
                marketTypeFilter,
            });

          url =
            `/api/atlas/boundary-market-snapshot?${params.toString()}`;
        }

        /*
         * Defensive fallback.
         */

        else {
          setMarketSnapshot(null);
          setMarketSnapshotLoading(false);
          return;
        }

        const response =
          await fetch(url, {
            cache: "no-store",
            signal: controller.signal,
          });

        if (!response.ok) {
          throw new Error(
            "Unable to load market snapshot.",
          );
        }

        const data =
          (await response.json()) as MarketSnapshot;

        setMarketSnapshot(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Atlas market snapshot error:",
          error,
        );

        setMarketSnapshot(null);
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setMarketSnapshotLoading(false);
        }
      }
    }

    void loadMarketSnapshot();

    return () => {
      controller.abort();
    };
  }, [
    isCustomMarket,
    customBoundaries,
    hasMarketContext,
    hasCustomMarketContext,
    hasMlsMarketContext,
    selectedEntity,
    selectedBoundary,
    propertyTypeFilter,
    marketTypeFilter,
  ]);

  /*
   * ==========================================================
   * TEMPORARY CURATED COMMUNITY CONTENT
   * ==========================================================
   */

  const isAmapas =
    !isCustomMarket &&
    selectedEntity?.canonicalName
      ?.trim()
      .toLowerCase() === "amapas";

  const communityTagline =
    isAmapas
      ? "Hillside living above Zona Romántica"
      : selectedEntity?.parentName
        ? `Explore ${selectedEntity.parentName}`
        : "Explore this part of Banderas Bay";

  /*
   * ==========================================================
   * ACTIVE PRICING DISPLAY
   * ==========================================================
   *
   * Pricing represents ACTIVE inventory only.
   */

  const displayedListPrice =
    summaryMode === "avg"
      ? marketSnapshot?.avgListPrice ??
        null
      : marketSnapshot?.medianListPrice ??
        null;

  const displayedAreaPrice =
    areaUnit === "m2"
      ? summaryMode === "avg"
        ? marketSnapshot?.avgListPriceM2 ??
          null
        : marketSnapshot?.medianListPriceM2 ??
          null
      : summaryMode === "avg"
        ? marketSnapshot?.avgListPriceFt2 ??
          null
        : marketSnapshot?.medianListPriceFt2 ??
          null;

  const listPriceLabel =
    summaryMode === "avg"
      ? "Avg List"
      : "Median List";

  const areaPriceLabel =
    `${summaryMode === "avg" ? "Avg" : "Median"} $/${
      areaUnit === "m2"
        ? "m²"
        : "ft²"
    }`;

  return (
    <section
      style={{
        position: "absolute",

        left: 0,
        right: 0,
        bottom: 0,

        pointerEvents: "auto",

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

        overflowY: "auto",

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
          display: "block",

          width: 70,
          height: 20,

          padding: 0,

          margin:
            "0 auto 8px",

          border: 0,

          background:
            "transparent",

          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "block",

            width: 44,
            height: 5,

            borderRadius: 999,

            background:
              "#cbd5e1",

            margin:
              "0 auto",
          }}
        />
      </button>

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            CUSTOM MARKET HEADING
            ===================================================== */}

        {isCustomMarket ? (
          <>
            <div
              style={{
                fontSize: 11,

                fontWeight: 750,

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
                marginTop: 3,

                fontSize: 27,

                lineHeight: 1.08,

                fontWeight: 700,

                color:
                  "#0f172a",
              }}
            >
              Your Selected Area
            </div>

            <div
              style={{
                marginTop: 5,

                fontSize: 13,

                lineHeight: 1.45,

                color:
                  "#64748b",
              }}
            >
              {customBoundaries.length === 0
                ? "Tap government areas on the map to build your market."
                : customBoundaries.length === 1
                  ? "1 government area selected."
                  : `${customBoundaries.length} government areas selected.`}
            </div>

            {customBoundaries.length >
            0 ? (
              <div
                style={{
                  display: "flex",

                  flexWrap: "wrap",

                  gap: 6,

                  marginTop: 10,
                }}
              >
                {customBoundaries.map(
                  (boundary) => (
                    <button
                      key={boundary.boundaryKy}
                      type="button"
                      onClick={() =>
                        toggleCustomBoundary(boundary)
                      }
                      aria-label={`Remove ${boundary.boundaryName} from Custom Market`}
                      title={`Remove ${boundary.boundaryName}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,

                        borderRadius: 999,

                        padding: "5px 8px 5px 9px",

                        background: "#ecfdf5",

                        color: "#115e59",

                        fontSize: 10,
                        fontWeight: 700,

                        border:
                          "1px solid #a7f3d0",

                        cursor: "pointer",
                      }}
                    >
                      <span>
                        {boundary.boundaryName}
                      </span>

                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",

                          width: 16,
                          height: 16,

                          borderRadius: 999,

                          background:
                            "rgba(15,118,110,0.10)",

                          fontSize: 13,
                          lineHeight: 1,

                          fontWeight: 700,
                        }}
                      >
                        ×
                      </span>
                    </button>
                  ),
                )}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",

                gap: 8,

                marginTop: 12,
              }}
            >
              {customBoundaries.length >
              0 ? (
                <button
                  type="button"
                  onClick={
                    clearCustomBoundaries
                  }
                  style={{
                    border:
                      "1px solid #cbd5e1",

                    borderRadius: 999,

                    padding:
                      "7px 11px",

                    background:
                      "#ffffff",

                    color:
                      "#475569",

                    fontSize: 11,

                    fontWeight: 700,

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

                  borderRadius: 999,

                  padding:
                    "7px 11px",

                  background:
                    "#ffffff",

                  color:
                    "#475569",

                  fontSize: 11,

                  fontWeight: 700,

                  cursor:
                    "pointer",
                }}
              >
                Exit Custom Market
              </button>
            </div>
          </>
        ) : selectedEntity ? (
          /* ===================================================
             MLS / SEARCHPV GEOGRAPHY
             =================================================== */
          <>
            <div>
              <div
                style={{
                  fontSize: 11,

                  fontWeight: 750,

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
                  marginTop: 3,

                  fontSize: 27,

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
                  marginTop: 5,

                  fontSize: 14,

                  color:
                    "#64748b",
                }}
              >
                {communityTagline}
              </div>

              {contextEntity &&
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
                    marginTop: 8,

                    border:
                      "1px solid #d6b56b",

                    borderRadius:
                      999,

                    padding:
                      "6px 10px",

                    background:
                      "#fffaf0",

                    color:
                      "#8a5a18",

                    fontSize:
                      11,

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
            </div>
          </>
        ) : selectedBoundary ? (
          /* ===================================================
             GOVERNMENT LOCAL AREA
             =================================================== */
          <>
            <div
              style={{
                fontSize: 11,

                fontWeight: 700,

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
                marginTop: 3,

                fontSize: 25,

                fontWeight: 700,

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
                marginTop: 5,

                fontSize: 13,

                color:
                  "#64748b",
              }}
            >
              {[
                selectedBoundary.boundaryType,

                selectedBoundary.districtName,

                selectedBoundary.municipalityName,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </>
        ) : (
          /* ===================================================
             NOTHING SELECTED
             =================================================== */
          <>
            <div
              style={{
                fontSize: 11,

                fontWeight: 700,

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
                marginTop: 3,

                fontSize: 25,

                fontWeight: 700,

                color:
                  "#0f172a",
              }}
            >
              Banderas Bay
            </div>

            <div
              style={{
                marginTop: 5,

                fontSize: 13,

                color:
                  "#64748b",
              }}
            >
              Tap the map or search for a place
              to start exploring.
            </div>
          </>
        )}

        {/* =====================================================
            MARKET FILTERS
            ===================================================== */}

        {hasMarketContext ? (
          <div
            style={{
              marginTop: 16,

              paddingTop: 13,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            {/* PROPERTY TYPE */}

            <div
              style={{
                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "flex-start",

                gap: 8,
              }}
            >
              <div
                style={{
                  width: 78,

                  fontSize:
                    10,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.10em",

                  color:
                    "#94a3b8",

                  textTransform:
                    "uppercase",

                  flexShrink: 0,
                }}
              >
                Property:
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap: 5,
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
                        style={{
                          border:
                            active
                              ? isCustomMarket
                                ? "1px solid #0f766e"
                                : "1px solid #a9792b"
                              : "1px solid #e2e8f0",

                          borderRadius:
                            999,

                          padding:
                            "6px 11px",

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
                            11,

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

            {/* MARKET TYPE */}

            <div
              style={{
                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "flex-start",

                gap: 8,

                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 78,

                  fontSize:
                    10,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.10em",

                  color:
                    "#94a3b8",

                  textTransform:
                    "uppercase",

                  flexShrink: 0,
                }}
              >
                Market:
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap: 5,
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
                        style={{
                          border:
                            active
                              ? isCustomMarket
                                ? "1px solid #0f766e"
                                : "1px solid #a9792b"
                              : "1px solid #e2e8f0",

                          borderRadius:
                            999,

                          padding:
                            "6px 11px",

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
                            11,

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
          </div>
        ) : null}

        {/* =====================================================
            CUSTOM MARKET EMPTY STATE
            ===================================================== */}

        {isCustomMarket &&
        customBoundaries.length === 0 ? (
          <div
            style={{
              marginTop: 18,

              padding:
                "18px 16px",

              borderRadius: 16,

              border:
                "1px dashed #99f6e4",

              background:
                "#f0fdfa",

              color:
                "#115e59",

              fontSize: 13,

              lineHeight: 1.5,

              textAlign: "center",
            }}
          >
            Tap one or more government areas on
            the map. Atlas will combine them into
            one Custom Market and calculate the
            statistics automatically.
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
                  16,
              }}
            >
              {/* ACTIVE */}

              <button
                type="button"
                aria-label="View active listings"
                style={{
                  border:
                    "1px solid #e2e8f0",

                  padding:
                    "11px 12px",

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
                      10,

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
                  Active
                </div>

                <div
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      20,

                    fontWeight:
                      750,

                    color:
                      "#0f172a",
                  }}
                >
                  {marketSnapshotLoading
                    ? "…"
                    : marketSnapshot
                        ?.activeCount ??
                      "—"}
                </div>
              </button>

              {/* PENDING */}

              <button
                type="button"
                aria-label="View pending listings"
                style={{
                  border:
                    "1px solid #e2e8f0",

                  padding:
                    "11px 12px",

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
                      10,

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
                  Pending
                </div>

                <div
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      20,

                    fontWeight:
                      750,

                    color:
                      "#0f172a",
                  }}
                >
                  {marketSnapshotLoading
                    ? "…"
                    : marketSnapshot
                        ?.pendingCount ??
                      "—"}
                </div>
              </button>

              {/* SOLD */}

              <button
                type="button"
                aria-label="View sold listings from the last 12 months"
                style={{
                  border:
                    "1px solid #e2e8f0",

                  padding:
                    "11px 12px",

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
                      10,

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
                  Sold 12 Mo
                </div>

                <div
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      20,

                    fontWeight:
                      750,

                    color:
                      "#0f172a",
                  }}
                >
                  {marketSnapshotLoading
                    ? "…"
                    : marketSnapshot
                        ?.sales12Mo ??
                      "—"}
                </div>
              </button>
            </div>

            {/* ================================================
                PRICING ROW
                ================================================ */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",

                gap: 8,

                marginTop: 8,
              }}
            >
              {/* LIST PRICE */}

              <div
                style={{
                  padding:
                    "10px 12px 11px",

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
                      10,
                  }}
                >
                  {[
                    {
                      value:
                        "median",
                      label:
                        "Median",
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
                              "5px 9px",

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
                      10,

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
                      20,

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
                    "10px 12px 11px",

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

                    justifyContent:
                      "flex-start",

                    gap: 7,

                    marginBottom:
                      10,
                  }}
                >
                  {/* MEDIAN / AVG */}

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
                          "Median",
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
                                "5px 9px",

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

                  {/* FT² / M² */}

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
                                "5px 9px",

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
                      10,

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
                      20,

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
          </>
        ) : null}

        {/* =====================================================
            TEMPORARY AMAPAS CONTENT
            ===================================================== */}

        {isAmapas ? (
          <>
            <div
              style={{
                marginTop: 15,

                fontSize: 13,

                lineHeight:
                  1.55,

                color:
                  "#475569",
              }}
            >
              Amapas climbs the hills just south of
              Zona Romántica, with a mix of
              established condos, newer developments
              and elevated homes known for views
              across Banderas Bay.
            </div>

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: 7,

                marginTop:
                  12,
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
                        "6px 10px",

                      background:
                        "#f1f5f9",

                      color:
                        "#475569",

                      fontSize:
                        11,

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
                16,
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
                  "11px 8px",

                background:
                  "#ffffff",

                color:
                  "#334155",

                fontSize:
                  12,

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
                  "11px 8px",

                background:
                  "#ffffff",

                color:
                  "#334155",

                fontSize:
                  12,

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
        selectedEntity &&
        selectedBoundary ? (
          <div
            style={{
              marginTop:
                16,

              paddingTop:
                12,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize:
                  10,

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
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        ) : null}

        {/* =====================================================
            RELATED MLS GEOGRAPHIES
            ===================================================== */}

        {!isCustomMarket &&
        selectedBoundary &&
        relatedChoices.length >
          0 ? (
          <div
            style={{
              marginTop:
                13,

              paddingTop:
                12,

              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize:
                  10,

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
                    12,

                  color:
                    "#64748b",
                }}
              >
                This local area overlaps more than one
                real estate community.
              </div>
            ) : null}

            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: 8,

                marginTop:
                  8,
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
                        "7px 12px",

                      background:
                        "#ffffff",

                      color:
                        "#334155",

                      fontSize:
                        12,

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