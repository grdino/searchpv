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

type MarketSnapshot = {
  snapshotDate: string | null;
  activeCount: number;
  pendingCount: number;
  medianListPrice: number | null;
  avgListPriceFt2: number | null;
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
    return `$${Math.round(value / 1_000).toLocaleString(
      "en-US",
    )}K`;
  }

  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatWholeNumber(value: number | null) {
  if (value === null) return "—";

  return Math.round(value).toLocaleString("en-US");
}

export default function AtlasBottomSheet() {
  const {
    selectedEntity,
    selectedBoundary,
    relatedEntities,
    propertyTypeFilter,
    marketTypeFilter,
    sheetState,
    setSheetState,
    setPropertyTypeFilter,
    setMarketTypeFilter,
    selectGeography,
  } = useAtlasState();

  const isFocused = sheetState === "focused";

  const [marketSnapshot, setMarketSnapshot] =
    useState<MarketSnapshot | null>(null);

  const [marketSnapshotLoading, setMarketSnapshotLoading] =
    useState(false);

  const relatedChoices = relatedEntities.filter(
    (entity) =>
      entity.entityKy !== selectedEntity?.entityKy,
  );

  useEffect(() => {
    /*
     * Market snapshots currently exist for MLS Communities.
     *
     * Clear any previous statistics immediately when the
     * geography or filters change so stale numbers are never
     * shown for a new selection.
     */
    if (
      !selectedEntity ||
      selectedEntity.entityType !== "CM"
    ) {
      setMarketSnapshot(null);
      setMarketSnapshotLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadMarketSnapshot() {
      setMarketSnapshotLoading(true);
      setMarketSnapshot(null);

      try {
        const params = new URLSearchParams({
          entityKy: String(selectedEntity.entityKy),
          propertyType: propertyTypeFilter,
          marketType: marketTypeFilter,
        });

        const response = await fetch(
          `/api/atlas/market-snapshot?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

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
        if (!controller.signal.aborted) {
          setMarketSnapshotLoading(false);
        }
      }
    }

    loadMarketSnapshot();

    return () => {
      controller.abort();
    };
  }, [
    selectedEntity,
    propertyTypeFilter,
    marketTypeFilter,
  ]);

  /*
   * TEMPORARY CURATED COMMUNITY CONTENT
   *
   * The market statistics are now live.
   *
   * The tagline, story and character tags are still prototype
   * content for Amapas only. We can move these into a curated
   * content source later.
   */
  const isAmapas =
    selectedEntity?.canonicalName
      ?.trim()
      .toLowerCase() === "amapas";

  const communityTagline = isAmapas
    ? "Hillside living above Zona Romántica"
    : selectedEntity?.parentName
      ? `Explore ${selectedEntity.parentName}`
      : "Explore this part of Banderas Bay";

  return (
    <section
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "auto",
        background: "rgba(255,255,255,0.94)",
        borderRadius: "28px 28px 0 0",
        padding: "10px 20px 24px",
        boxShadow:
          "0 -10px 35px rgba(15,23,42,0.12)",
        backdropFilter: "blur(16px)",

        maxHeight: isFocused ? "82vh" : "44vh",
        overflowY: "auto",

        transition: "max-height 300ms ease",
      }}
    >
      {/* Sheet expand / collapse handle */}
      <button
        type="button"
        aria-label={
          isFocused
            ? "Collapse details"
            : "Expand details"
        }
        onClick={() =>
          setSheetState(
            isFocused ? "half" : "focused",
          )
        }
        style={{
          display: "block",
          width: 70,
          height: 20,
          padding: 0,
          margin: "0 auto 8px",
          border: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "block",
            width: 44,
            height: 5,
            borderRadius: 999,
            background: "#cbd5e1",
            margin: "0 auto",
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
            MLS / SEARCHPV ENTITY SELECTED
            ===================================================== */}

        {selectedEntity ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    letterSpacing: "0.12em",
                    color: "#a9792b",
                    textTransform: "uppercase",
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
                    lineHeight: 1.08,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {selectedEntity.displayName}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 14,
                    color: "#64748b",
                  }}
                >
                  {communityTagline}
                </div>
              </div>
            </div>

            {/* ================================================
                MARKET FILTERS
                ================================================ */}

            <div
              style={{
                marginTop: 16,
                paddingTop: 13,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {/* Property type */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 78,
                    fontSize: 10,
                    fontWeight: 750,
                    letterSpacing: "0.10em",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Property:
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {[
                    { value: "all", label: "All" },
                    {
                      value: "condo",
                      label: "Condos",
                    },
                    {
                      value: "house",
                      label: "Houses",
                    },
                  ].map((option) => {
                    const active =
                      propertyTypeFilter === option.value;

                    return (
                      <button
                        key={option.value}
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
                          border: active
                            ? "1px solid #a9792b"
                            : "1px solid #e2e8f0",
                          borderRadius: 999,
                          padding: "6px 11px",
                          background: active
                            ? "#fff8e8"
                            : "#ffffff",
                          color: active
                            ? "#8a5a18"
                            : "#64748b",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Market type */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: 78,
                    fontSize: 10,
                    fontWeight: 750,
                    letterSpacing: "0.10em",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Market:
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {[
                    { value: "all", label: "All" },
                    {
                      value: "resale",
                      label: "Resale",
                    },
                    {
                      value: "precon",
                      label: "Pre-Con",
                    },
                  ].map((option) => {
                    const active =
                      marketTypeFilter === option.value;

                    return (
                      <button
                        key={option.value}
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
                          border: active
                            ? "1px solid #a9792b"
                            : "1px solid #e2e8f0",
                          borderRadius: 999,
                          padding: "6px 11px",
                          background: active
                            ? "#fff8e8"
                            : "#ffffff",
                          color: active
                            ? "#8a5a18"
                            : "#64748b",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ================================================
                LIVE MARKET SNAPSHOT
                ================================================ */}

            {selectedEntity.entityType === "CM" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                {/* Active */}
                <div
                  style={{
                    padding: "11px 12px",
                    borderRadius: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    Active
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {marketSnapshotLoading
                      ? "…"
                      : marketSnapshot?.activeCount ??
                        "—"}
                  </div>
                </div>

                {/* Pending */}
                <div
                  style={{
                    padding: "11px 12px",
                    borderRadius: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    Pending
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {marketSnapshotLoading
                      ? "…"
                      : marketSnapshot?.pendingCount ??
                        "—"}
                  </div>
                </div>

                {/* Median Ask */}
                <div
                  style={{
                    padding: "11px 12px",
                    borderRadius: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    Median Ask
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {marketSnapshotLoading
                      ? "…"
                      : formatPrice(
                          marketSnapshot?.medianListPrice ??
                            null,
                        )}
                  </div>
                </div>

                {/* Average asking price per square foot */}
                <div
                  style={{
                    padding: "11px 12px",
                    borderRadius: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    Avg $/ft²
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {marketSnapshotLoading
                      ? "…"
                      : marketSnapshot?.avgListPriceFt2 !==
                            null &&
                          marketSnapshot?.avgListPriceFt2 !==
                            undefined
                        ? `$${formatWholeNumber(
                            marketSnapshot.avgListPriceFt2,
                          )}`
                        : "—"}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ================================================
                COMMUNITY STORY
                ================================================ */}

            {isAmapas ? (
              <div
                style={{
                  marginTop: 15,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "#475569",
                }}
              >
                Amapas climbs the hills just south of Zona
                Romántica, with a mix of established condos,
                newer developments and elevated homes known
                for views across Banderas Bay.
              </div>
            ) : null}

            {/* ================================================
                QUICK CHARACTER TAGS
                ================================================ */}

            {isAmapas ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 7,
                  marginTop: 12,
                }}
              >
                {[
                  "Ocean Views",
                  "Condos",
                  "Near Zona Romántica",
                  "Hillside",
                ].map((label) => (
                  <span
                    key={label}
                    style={{
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: 11,
                      fontWeight: 650,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            {/* ================================================
                PRIMARY ACTIONS
                ================================================ */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                style={{
                  border: 0,
                  borderRadius: 14,
                  padding: "11px 8px",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Homes for Sale
              </button>

              <button
                type="button"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "11px 8px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Market Stats
              </button>

              <button
                type="button"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "11px 8px",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Nearby
              </button>
            </div>
          </>
        ) : selectedBoundary ? (
          /* ===================================================
             GOVERNMENT BOUNDARY ONLY
             =================================================== */
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              Local Area
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 25,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {selectedBoundary.boundaryName}
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#64748b",
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
                letterSpacing: "0.12em",
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              Explore the Bay
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 25,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Banderas Bay
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Tap the map or search for a place to start
              exploring.
            </div>
          </>
        )}

        {/* =====================================================
            CLICKED GOVERNMENT AREA
            ===================================================== */}

        {selectedEntity && selectedBoundary ? (
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: "0.10em",
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              Local Government Area
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 15,
                fontWeight: 650,
                color: "#334155",
              }}
            >
              {selectedBoundary.boundaryName}
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: "#64748b",
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
            AMBIGUOUS / RELATED MLS FOOTPRINTS
            ===================================================== */}

        {selectedBoundary &&
        relatedChoices.length > 0 ? (
          <div
            style={{
              marginTop: 13,
              paddingTop: 12,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: "0.10em",
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              {selectedEntity
                ? "Also Part Of"
                : relatedChoices.length > 1
                  ? "Explore Real Estate Areas"
                  : "Real Estate Area"}
            </div>

            {!selectedEntity &&
            relatedChoices.length > 1 ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                This local area overlaps more than one real
                estate community.
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {relatedChoices.map((entity) => (
                <button
                  key={entity.entityKy}
                  type="button"
                  onClick={() =>
                    selectGeography(
                      entity,
                      selectedBoundary,
                    )
                  }
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 999,
                    padding: "7px 12px",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  {entity.displayName}

                  {entity.parentName
                    ? ` · ${entity.parentName}`
                    : ""}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}