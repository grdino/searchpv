"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useAtlasState,
  type AtlasPopularArea,
} from "@/lib/atlas/state/AtlasState";

type AtlasSearchCandidate = {
  entityKey: number;
  entityType: string;
  canonicalName: string;
  matchedVariant: string | null;
  identifier: string;
  confidence: number;

  hierarchy?: {
    zone?: {
      entityKey: number;
      identifier: string;
      name: string;
    };

    area?: {
      entityKey: number;
      identifier: string;
      name: string;
    };

    community?: {
      entityKey: number;
      identifier: string;
      name: string;
    };
  };
};

type PopularAreasResponse = {
  areas?: AtlasPopularArea[];
};

export default function AtlasSearch() {
  const {
    selectEntity,
    selectPopularArea,
  } = useAtlasState();

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    results,
    setResults,
  ] =
    useState<AtlasSearchCandidate[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  /*
   * ==========================================================
   * POPULAR AREAS
   * ==========================================================
   */

  const [
    popularAreas,
    setPopularAreas,
  ] =
    useState<AtlasPopularArea[]>(
      [],
    );

  const [
    popularAreasLoading,
    setPopularAreasLoading,
  ] =
    useState(true);

  const [
    showPopularInfo,
    setShowPopularInfo,
  ] =
    useState(false);

  /*
   * Load the three current Popular Areas once when Atlas opens.
   *
   * The API definition is:
   *
   * - trailing 6 months
   * - resale only
   * - Condos + Houses
   * - ranked by closed sales
   * - unique Atlas geographic footprints
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPopularAreas() {
      setPopularAreasLoading(
        true,
      );

      try {
        const response =
          await fetch(
            "/api/atlas/popular-areas",
            {
              cache:
                "no-store",

              signal:
                controller.signal,
            },
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load Popular Areas.",
          );
        }

        const data =
          (await response.json()) as PopularAreasResponse;

        setPopularAreas(
          Array.isArray(
            data.areas,
          )
            ? data.areas
            : [],
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Atlas Popular Areas failed:",
          error,
        );

        setPopularAreas(
          [],
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setPopularAreasLoading(
            false,
          );
        }
      }
    }

    void loadPopularAreas();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  useEffect(() => {
    const trimmed =
      query.trim();

    if (
      trimmed.length <
      2
    ) {
      setResults([]);

      setLoading(
        false,
      );

      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          setLoading(
            true,
          );

          try {
            const response =
              await fetch(
                `/api/atlas/search?q=${encodeURIComponent(
                  trimmed,
                )}`,
              );

            const data =
              await response.json();

            setResults(
              data.candidates ??
                [],
            );
          } catch (error) {
            console.error(
              "Atlas search failed:",
              error,
            );

            setResults(
              [],
            );
          } finally {
            setLoading(
              false,
            );
          }
        },
        250,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    query,
  ]);

  /*
   * Popular Areas disappear as soon as someone begins typing.
   *
   * This keeps the search interface vertically compact and
   * avoids competing with actual search results.
   */
  const showPopularAreas =
    query.trim().length ===
      0 &&
    popularAreas.length >
      0;

  return (
    <div
      style={{
        position:
          "absolute",

        top: 16,
        left: 16,
        right: 16,

        pointerEvents:
          "none",
      }}
    >
      <div
        style={{
          maxWidth:
            560,

          margin:
            "0 auto",

          position:
            "relative",

          pointerEvents:
            "auto",
        }}
      >
        {/* =====================================================
            SEARCH BOX
            ===================================================== */}

        <div
          style={{
            background:
              "rgba(255,255,255,0.92)",

            borderRadius:
              18,

            padding:
              "14px 16px",

            boxShadow:
              "0 8px 30px rgba(15,23,42,0.14)",

            backdropFilter:
              "blur(14px)",
          }}
        >
          <input
            type="text"
            value={
              query
            }
            onChange={(
              event,
            ) => {
              setQuery(
                event.target
                  .value,
              );

              /*
               * Close the mobile Popular Areas explanation
               * once someone begins interacting with search.
               */
              setShowPopularInfo(
                false,
              );
            }}
            placeholder="Search places, communities, developments…"
            style={{
              width:
                "100%",

              border:
                0,

              outline:
                "none",

              background:
                "transparent",

              color:
                "#0f172a",

              fontSize:
                14,
            }}
          />
        </div>

        {/* =====================================================
            POPULAR AREAS
            ===================================================== */}

        {showPopularAreas ? (
          <div
            style={{
              marginTop:
                7,
            }}
          >
            {/* SMALL LABEL ROW */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 4,

                padding:
                  "0 3px 4px",
              }}
            >
              <span
                style={{
                  fontSize:
                    9,

                  lineHeight:
                    1,

                  fontWeight:
                    750,

                  letterSpacing:
                    "0.09em",

                  color:
                    "#64748b",

                  textTransform:
                    "uppercase",
                }}
              >
                Popular Areas
              </span>

              <button
                type="button"
                aria-label="About Popular Areas"
                title="Based on closed resale condo and house sales during the past 6 months."
                onClick={() =>
                  setShowPopularInfo(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  width:
                    16,

                  height:
                    16,

                  padding:
                    0,

                  border:
                    0,

                  borderRadius:
                    999,

                  background:
                    "rgba(255,255,255,0.78)",

                  color:
                    "#64748b",

                  fontSize:
                    11,

                  fontWeight:
                    750,

                  lineHeight:
                    1,

                  cursor:
                    "pointer",
                }}
              >
                ⓘ
              </button>
            </div>

            {/* THREE EQUAL BUTTONS */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",

                gap:
                  6,
              }}
            >
              {popularAreas.map(
                (
                  area,
                ) => (
                  <button
                    key={
                      area.footprintKey
                    }
                    type="button"
                    onClick={() => {
                      selectPopularArea(
                        area,
                      );

                      setQuery(
                        "",
                      );

                      setResults(
                        [],
                      );

                      setShowPopularInfo(
                        false,
                      );
                    }}
                    title={`${area.displayName} — one of the most active resale areas by closed condo and house sales during the past 6 months.`}
                    style={{
                      minWidth:
                        0,

                      height:
                        30,

                      border:
                        "1px solid rgba(15,23,42,0.11)",

                      borderRadius:
                        10,

                      padding:
                        "0 7px",

                      background:
                        "rgba(255,255,255,0.92)",

                      boxShadow:
                        "0 4px 14px rgba(15,23,42,0.08)",

                      backdropFilter:
                        "blur(12px)",

                      color:
                        "#334155",

                      fontSize:
                        10.5,

                      fontWeight:
                        700,

                      lineHeight:
                        1.1,

                      whiteSpace:
                        "nowrap",

                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",

                      cursor:
                        "pointer",
                    }}
                  >
                    {
                      area.displayName
                    }
                  </button>
                ),
              )}
            </div>

            {/* MOBILE / CLICK INFO */}

            {showPopularInfo ? (
              <div
                style={{
                  marginTop:
                    5,

                  padding:
                    "7px 9px",

                  borderRadius:
                    10,

                  background:
                    "rgba(255,255,255,0.94)",

                  boxShadow:
                    "0 5px 16px rgba(15,23,42,0.08)",

                  color:
                    "#64748b",

                  fontSize:
                    10,

                  lineHeight:
                    1.4,
                }}
              >
                Based on closed resale
                condo and house sales
                during the past 6
                months.
              </div>
            ) : null}
          </div>
        ) : null}

        {/* =====================================================
            OPTIONAL VERY SMALL LOADING STATE
            =====================================================
            
            Deliberately invisible text-wise so the page does
            not jump while Popular Areas load.
        */}

        {popularAreasLoading &&
        query.trim().length ===
          0 ? (
          <div
            aria-hidden="true"
            style={{
              height:
                0,

              overflow:
                "hidden",
            }}
          />
        ) : null}

        {/* =====================================================
            SEARCH RESULTS
            ===================================================== */}

        {(loading ||
          results.length >
            0) && (
          <div
            style={{
              marginTop:
                8,

              overflow:
                "hidden",

              borderRadius:
                18,

              background:
                "rgba(255,255,255,0.96)",

              boxShadow:
                "0 12px 35px rgba(15,23,42,0.16)",

              backdropFilter:
                "blur(16px)",
            }}
          >
            {loading && (
              <div
                style={{
                  padding:
                    "12px 16px",

                  color:
                    "#64748b",

                  fontSize:
                    13,
                }}
              >
                Searching…
              </div>
            )}

            {!loading &&
              results.map(
                (
                  candidate,
                ) => {
                  const entityTypeLabel =
                    candidate.entityType
                      .charAt(0)
                      .toUpperCase() +
                    candidate.entityType.slice(
                      1,
                    );

                  const hierarchyText =
                    [
                      entityTypeLabel,

                      candidate.entityType !==
                      "community"
                        ? candidate
                            .hierarchy
                            ?.community
                            ?.name
                        : undefined,

                      candidate.entityType !==
                      "area"
                        ? candidate
                            .hierarchy
                            ?.area
                            ?.name
                        : undefined,

                      candidate.entityType !==
                      "zone"
                        ? candidate
                            .hierarchy
                            ?.zone
                            ?.name
                        : undefined,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        " · ",
                      );

                  return (
                    <button
                      key={
                        candidate.entityKey
                      }
                      type="button"
                      onClick={async () => {
                        try {
                          const response =
                            await fetch(
                              `/api/atlas/entity/${candidate.entityKey}`,
                            );

                          if (
                            !response.ok
                          ) {
                            throw new Error(
                              "Unable to load entity details.",
                            );
                          }

                          const detail =
                            await response.json();

                          const zonaRomanticaDisplayName =
                            detail.variants?.find(
                              (
                                variant: {
                                  language_cd: string;
                                  variant_type_cd: string;
                                  entity_variant_nm: string;
                                },
                              ) =>
                                variant.language_cd ===
                                  "ES" &&
                                variant.variant_type_cd ===
                                  "CO",
                            )
                              ?.entity_variant_nm;

                          selectEntity({
                            entityKy:
                              detail
                                .entity
                                .entity_ky,

                            entityType:
                              detail
                                .entity
                                .entity_type_cd,

                            canonicalName:
                              detail
                                .canonical
                                ?.entity_variant_nm ??
                              candidate.canonicalName,

                            displayName:
                              zonaRomanticaDisplayName ??
                              candidate.matchedVariant ??
                              detail
                                .canonical
                                ?.entity_variant_nm ??
                              candidate.canonicalName,

                            longitude:
                              detail
                                .entity
                                .longitude_nb,

                            latitude:
                              detail
                                .entity
                                .latitude_nb,

                            parentName:
                              detail
                                .parent
                                ?.canonical_nm,

                            boundary:
                              detail.boundary ??
                              null,
                          });

                          setQuery(
                            "",
                          );

                          setResults(
                            [],
                          );

                          setShowPopularInfo(
                            false,
                          );
                        } catch (error) {
                          console.error(
                            "Atlas entity selection failed:",
                            error,
                          );
                        }
                      }}
                      style={{
                        display:
                          "block",

                        width:
                          "100%",

                        border:
                          0,

                        borderBottom:
                          "1px solid #e2e8f0",

                        background:
                          "transparent",

                        padding:
                          "12px 16px",

                        textAlign:
                          "left",

                        cursor:
                          "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            14,

                          fontWeight:
                            650,

                          color:
                            "#0f172a",
                        }}
                      >
                        {candidate.matchedVariant ??
                          candidate.canonicalName}
                      </div>

                      <div
                        style={{
                          marginTop:
                            2,

                          fontSize:
                            12,

                          color:
                            "#64748b",
                        }}
                      >
                        {
                          hierarchyText
                        }
                      </div>
                    </button>
                  );
                },
              )}
          </div>
        )}
      </div>
    </div>
  );
}