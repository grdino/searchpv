"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useAtlasState } from "@/lib/atlas/state/AtlasState";

export default function AtlasMap() {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  /*
   * Keep the complete government-boundary features available
   * outside the one-time Mapbox load callback.
   *
   * Custom Market highlighting uses these full geometries.
   */
  const fullBoundaryFeaturesRef =
    useRef<Map<number, any>>(
      new Map(),
    );

  const {
    contextEntity,
    analysisEntity,
    selectedBoundary,
    selectBoundary,

    mode,
    customBoundaries,
    startCustomMarket,
    toggleCustomBoundary,
    clearCustomBoundaries,
    exitCustomMarket,
  } = useAtlasState();

  /*
   * ==========================================================
   * CURRENT REACT STATE FOR PERMANENT MAPBOX EVENT HANDLERS
   * ==========================================================
   *
   * Mapbox handlers are registered once.
   *
   * Refs ensure those handlers always see current React state.
   */

  const selectBoundaryRef =
    useRef(selectBoundary);

  const modeRef =
    useRef(mode);

  const toggleCustomBoundaryRef =
    useRef(toggleCustomBoundary);

  useEffect(() => {
    selectBoundaryRef.current =
      selectBoundary;
  }, [selectBoundary]);

  useEffect(() => {
    modeRef.current =
      mode;
  }, [mode]);

  useEffect(() => {
    toggleCustomBoundaryRef.current =
      toggleCustomBoundary;
  }, [toggleCustomBoundary]);

  // ============================================================
  // CREATE MAP
  // ============================================================

  useEffect(() => {
    const container =
      mapContainerRef.current;

    if (
      !container ||
      mapRef.current
    ) {
      return;
    }

    const token =
      process.env
        .NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      console.error(
        "Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
      );

      return;
    }

    mapboxgl.accessToken =
      token;

    const map =
      new mapboxgl.Map({
        container,

        style:
          "mapbox://styles/mapbox/standard",

        center: [
          -105.3,
          20.66,
        ],

        zoom: 9.7,
        bearing: 0,
        pitch: 20,

        attributionControl:
          false,
      });

    mapRef.current =
      map;

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right",
    );

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );

    const resizeFrame =
      requestAnimationFrame(
        () => {
          if (
            mapRef.current ===
            map
          ) {
            map.resize();
          }
        },
      );

    map.on("load", () => {
      map.resize();

      // ========================================================
      // 1. BROADER SEARCHPV / MLS CONTEXT
      // ========================================================

      map.addSource(
        "atlas-entity-selection",
        {
          type: "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        },
      );

      map.addLayer({
        id:
          "atlas-entity-selection-fill",

        type: "fill",

        source:
          "atlas-entity-selection",

        slot: "top",

        paint: {
          "fill-color":
            "#d4a64a",

          "fill-opacity": 0,

          "fill-opacity-transition":
            {
              duration: 800,
              delay: 0,
            },
        },
      });

      map.addLayer({
        id:
          "atlas-entity-selection-line",

        type: "line",

        source:
          "atlas-entity-selection",

        slot: "top",

        paint: {
          "line-color":
            "#b78a36",

          "line-width":
            1.75,

          "line-opacity":
            0,

          "line-opacity-transition":
            {
              duration: 800,
              delay: 0,
            },
        },
      });

      // ========================================================
      // 2. ANALYSIS GEOGRAPHY
      // ========================================================

      map.addSource(
        "atlas-analysis-selection",
        {
          type: "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        },
      );

      map.addLayer({
        id:
          "atlas-analysis-selection-fill",

        type: "fill",

        source:
          "atlas-analysis-selection",

        slot: "top",

        paint: {
          "fill-color":
            "#c58b2a",

          "fill-opacity":
            0.22,
        },
      });

      map.addLayer({
        id:
          "atlas-analysis-selection-line",

        type: "line",

        source:
          "atlas-analysis-selection",

        slot: "top",

        paint: {
          "line-color":
            "#925f17",

          "line-width":
            2.5,

          "line-opacity":
            0.95,
        },
      });

      // ========================================================
      // 3. FOCUSED GOVERNMENT BOUNDARY
      // ========================================================

      map.addSource(
        "atlas-boundary-selection",
        {
          type: "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        },
      );

      map.addLayer({
        id:
          "atlas-boundary-selection-fill",

        type: "fill",

        source:
          "atlas-boundary-selection",

        slot: "top",

        paint: {
          "fill-color":
            "#a86613",

          "fill-opacity":
            0.36,
        },
      });

      map.addLayer({
        id:
          "atlas-boundary-selection-line",

        type: "line",

        source:
          "atlas-boundary-selection",

        slot: "top",

        paint: {
          "line-color":
            "#713f12",

          "line-width":
            3,

          "line-opacity":
            1,
        },
      });

      // ========================================================
      // 4. CUSTOM MARKET SELECTION
      //
      // Completely independent from Context / Analysis / Focus.
      //
      // Multiple government polygons can be displayed here.
      // ========================================================

      map.addSource(
        "atlas-custom-market-selection",
        {
          type: "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        },
      );

      map.addLayer({
        id:
          "atlas-custom-market-selection-fill",

        type: "fill",

        source:
          "atlas-custom-market-selection",

        slot: "top",

        paint: {
          /*
           * Deliberately different from normal Explore focus.
           */
          "fill-color":
            "#0f766e",

          "fill-opacity":
            0.28,
        },
      });

      map.addLayer({
        id:
          "atlas-custom-market-selection-line",

        type: "line",

        source:
          "atlas-custom-market-selection",

        slot: "top",

        paint: {
          "line-color":
            "#115e59",

          "line-width":
            3,

          "line-opacity":
            1,
        },
      });

      // ========================================================
      // 5. ALL GOVERNMENT BOUNDARIES
      // ========================================================

      fetch(
        "/api/atlas/boundaries",
      )
        .then(
          (
            response,
          ) => {
            if (
              !response.ok
            ) {
              throw new Error(
                "Unable to load government boundaries.",
              );
            }

            return response.json();
          },
        )
        .then(
          (
            boundaryData,
          ) => {
            console.log(
              "Government boundary features:",
              boundaryData
                .features
                .length,
            );

            if (
              map.getSource(
                "atlas-boundaries",
              )
            ) {
              return;
            }

            /*
             * Keep COMPLETE original geometry for every
             * government polygon.
             */
            const fullBoundaryFeatures =
              new Map<
                number,
                any
              >();

            for (
              const boundaryFeature of
              boundaryData.features
            ) {
              const boundaryKy =
                Number(
                  boundaryFeature
                    .properties
                    ?.boundary_ky,
                );

              if (
                Number.isFinite(
                  boundaryKy,
                )
              ) {
                fullBoundaryFeatures.set(
                  boundaryKy,
                  boundaryFeature,
                );
              }
            }

            /*
             * Make complete geometry available to React effects.
             */
            fullBoundaryFeaturesRef.current =
              fullBoundaryFeatures;

            map.addSource(
              "atlas-boundaries",
              {
                type: "geojson",
                data: boundaryData,
              },
            );

            /*
             * Invisible click target.
             */
            map.addLayer({
              id:
                "atlas-boundaries-hit",

              type: "fill",

              source:
                "atlas-boundaries",

              paint: {
                "fill-color":
                  "#000000",

                "fill-opacity":
                  0.001,
              },
            });

            /*
             * Quiet normal government-boundary outlines.
             */
            map.addLayer({
              id:
                "atlas-boundaries-line",

              type: "line",

              source:
                "atlas-boundaries",

              paint: {
                "line-color":
                  "#475569",

                "line-width":
                  [
                    "interpolate",
                    [
                      "linear",
                    ],
                    ["zoom"],
                    9,
                    0.5,
                    12,
                    0.8,
                    15,
                    1.1,
                  ],

                "line-opacity":
                  [
                    "interpolate",
                    [
                      "linear",
                    ],
                    ["zoom"],
                    9,
                    0.12,
                    12,
                    0.2,
                    15,
                    0.28,
                  ],
              },
            });

            // ==================================================
            // GOVERNMENT BOUNDARY CLICK
            // ==================================================

            map.on(
              "click",

              "atlas-boundaries-hit",

              async (
                event,
              ) => {
                const clickedFeature =
                  event
                    .features?.[0] as any;

                if (
                  !clickedFeature
                ) {
                  return;
                }

                const boundaryKy =
                  Number(
                    clickedFeature
                      .properties
                      ?.boundary_ky,
                  );

                if (
                  !Number.isFinite(
                    boundaryKy,
                  )
                ) {
                  return;
                }

                const boundaryName =
                  clickedFeature
                    .properties
                    ?.boundary_nm;

                const fullBoundaryFeature =
                  fullBoundaryFeatures.get(
                    boundaryKy,
                  );

                const boundary = {
                  boundaryKy,

                  boundaryName,

                  boundaryType:
                    clickedFeature
                      .properties
                      ?.boundary_type_cd ??
                    undefined,

                  municipalityName:
                    clickedFeature
                      .properties
                      ?.municipality_nm ??
                    undefined,

                  districtName:
                    clickedFeature
                      .properties
                      ?.district_nm ??
                    undefined,
                };

                // ==============================================
                // CUSTOM MARKET MODE
                // ==============================================
                //
                // This is intentionally checked BEFORE any
                // normal Explore behavior.
                //
                // No MLS geography lookup.
                // No focus change.
                // No context change.
                // No analysis change.
                //
                // Just toggle this polygon.
                // ==============================================

                if (
                  modeRef.current ===
                  "custom-select"
                ) {
                  toggleCustomBoundaryRef.current(
                    boundary,
                  );

                  return;
                }

                // ==============================================
                // NORMAL EXPLORE MODE
                // ==============================================

                const boundarySelectionSource =
                  map.getSource(
                    "atlas-boundary-selection",
                  ) as
                    | mapboxgl.GeoJSONSource
                    | undefined;

                boundarySelectionSource?.setData(
                  {
                    type:
                      "FeatureCollection",

                    features:
                      fullBoundaryFeature
                        ? [
                            fullBoundaryFeature,
                          ]
                        : [],
                  },
                );

                /*
                 * Resolve related real-estate geographies.
                 */
                try {
                  const response =
                    await fetch(
                      `/api/atlas/boundary-entity?boundaryKy=${boundaryKy}`,
                      {
                        cache:
                          "no-store",
                      },
                    );

                  if (
                    !response.ok
                  ) {
                    throw new Error(
                      "Unable to load related MLS geographies.",
                    );
                  }

                  const entities =
                    await response.json();

                  selectBoundaryRef.current(
                    boundary,

                    Array.isArray(
                      entities,
                    )
                      ? entities
                      : [],
                  );
                } catch (
                  error
                ) {
                  console.error(
                    "Atlas related geography lookup error:",
                    error,
                  );

                  selectBoundaryRef.current(
                    boundary,
                    [],
                  );
                }
              },
            );

            /*
             * Desktop pointer feedback.
             */
            map.on(
              "mouseenter",

              "atlas-boundaries-hit",

              () => {
                map.getCanvas().style.cursor =
                  "pointer";
              },
            );

            map.on(
              "mouseleave",

              "atlas-boundaries-hit",

              () => {
                map.getCanvas().style.cursor =
                  "";
              },
            );
          },
        )
        .catch(
          (
            error,
          ) => {
            console.error(
              "Atlas government boundary error:",
              error,
            );
          },
        );
    });

    // ==========================================================
    // KEEP MAPBOX SYNCHRONIZED WITH CONTAINER SIZE
    // ==========================================================

    const resizeObserver =
      new ResizeObserver(
        () => {
          if (
            mapRef.current ===
            map
          ) {
            map.resize();
          }
        },
      );

    resizeObserver.observe(
      container,
    );

    return () => {
      cancelAnimationFrame(
        resizeFrame,
      );

      resizeObserver.disconnect();

      if (
        mapRef.current ===
        map
      ) {
        mapRef.current =
          null;
      }

      map.remove();
    };
  }, []);

  // ============================================================
  // CUSTOM MARKET MAP DISPLAY
  // ============================================================
  //
  // React state contains AtlasBoundary objects.
  //
  // Here we translate their keys back into the complete GeoJSON
  // features loaded from /api/atlas/boundaries.
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const customSource =
      map.getSource(
        "atlas-custom-market-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (!customSource) {
      return;
    }

    /*
     * Outside Custom Market mode, show no custom selection.
     */
    if (
      mode !==
      "custom-select"
    ) {
      customSource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      return;
    }

    const features =
      customBoundaries
        .map(
          (
            boundary,
          ) =>
            fullBoundaryFeaturesRef.current.get(
              Number(
                boundary.boundaryKy,
              ),
            ),
        )
        .filter(
          Boolean,
        );

    customSource.setData({
      type:
        "FeatureCollection",

      features,
    });
  }, [
    mode,
    customBoundaries,
  ]);

  // ============================================================
  // CLEAR FOCUSED GOVERNMENT POLYGON
  // ============================================================

  useEffect(() => {
    if (
      selectedBoundary
    ) {
      return;
    }

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const boundarySelectionSource =
      map.getSource(
        "atlas-boundary-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    boundarySelectionSource?.setData(
      {
        type:
          "FeatureCollection",

        features: [],
      },
    );
  }, [
    selectedBoundary,
  ]);

  // ============================================================
  // BROADER SEARCHPV CONTEXT
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    /*
     * No broader context.
     */
    if (
      !contextEntity
    ) {
      const entitySource =
        map.getSource(
          "atlas-entity-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      entitySource?.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      if (
        map.getLayer(
          "atlas-entity-selection-fill",
        )
      ) {
        map.setPaintProperty(
          "atlas-entity-selection-fill",

          "fill-opacity",

          0,
        );
      }

      if (
        map.getLayer(
          "atlas-entity-selection-line",
        )
      ) {
        map.setPaintProperty(
          "atlas-entity-selection-line",

          "line-opacity",

          0,
        );
      }

      return;
    }

    const entity =
      contextEntity;

    let cancelled =
      false;

    async function showContextEntity() {
      const currentMap =
        mapRef.current;

      if (
        !currentMap
      ) {
        return;
      }

      const entitySource =
        currentMap.getSource(
          "atlas-entity-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      if (
        !entitySource
      ) {
        currentMap.once(
          "load",
          showContextEntity,
        );

        return;
      }

      /*
       * Clear only previous CONTEXT geometry.
       */
      entitySource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      currentMap.setPaintProperty(
        "atlas-entity-selection-fill",

        "fill-opacity",

        0,
      );

      currentMap.setPaintProperty(
        "atlas-entity-selection-line",

        "line-opacity",

        0,
      );

      if (
        entity.entityKy
      ) {
        try {
          const response =
            await fetch(
              `/api/atlas/entity-geometry?entityKy=${entity.entityKy}`,
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              "Unable to load entity geometry.",
            );
          }

          const entityGeometry =
            await response.json();

          if (
            cancelled
          ) {
            return;
          }

          if (
            entityGeometry?.geometry &&
            Array.isArray(
              entityGeometry?.bbox,
            ) &&
            entityGeometry
              .bbox
              .length ===
              4
          ) {
            const feature = {
              type:
                "Feature",

              properties: {
                entityKy:
                  entityGeometry.entityKy,

                entityName:
                  entityGeometry.entityName,

                entityType:
                  entityGeometry.entityType,
              },

              geometry:
                entityGeometry.geometry,
            };

            entitySource.setData(
              {
                type:
                  "FeatureCollection",

                features: [
                  feature as any,
                ],
              },
            );

            const [
              west,
              south,
              east,
              north,
            ] =
              entityGeometry.bbox.map(
                Number,
              );

            currentMap.fitBounds(
              [
                [
                  west,
                  south,
                ],

                [
                  east,
                  north,
                ],
              ],

              {
                padding: {
                  top: 110,
                  right: 40,

                  bottom:
                    Math.round(
                      window.innerHeight *
                        0.46,
                    ),

                  left: 40,
                },

                pitch: 45,

                duration:
                  1800,

                essential:
                  true,
              },
            );

            window.setTimeout(
              () => {
                if (
                  cancelled
                ) {
                  return;
                }

                if (
                  !mapRef.current
                ) {
                  return;
                }

                mapRef.current.setPaintProperty(
                  "atlas-entity-selection-fill",

                  "fill-opacity",

                  0.1,
                );

                mapRef.current.setPaintProperty(
                  "atlas-entity-selection-line",

                  "line-opacity",

                  0.85,
                );
              },
              1100,
            );

            return;
          }
        } catch (
          error
        ) {
          console.error(
            "Atlas entity geometry error:",
            error,
          );
        }
      }

      /*
       * Development / Building / Point fallback.
       */
      if (
        Number.isFinite(
          entity.longitude,
        ) &&
        Number.isFinite(
          entity.latitude,
        )
      ) {
        currentMap.flyTo({
          center: [
            entity.longitude as number,
            entity.latitude as number,
          ],

          zoom: 15,
          pitch: 45,

          duration: 1800,

          essential: true,
        });
      }
    }

    void showContextEntity();

    return () => {
      cancelled =
        true;
    };
  }, [
    contextEntity,
  ]);

  // ============================================================
  // ANALYSIS GEOGRAPHY
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const analysisSource =
      map.getSource(
        "atlas-analysis-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (!analysisSource) {
      return;
    }

    /*
     * Give the async function a permanently narrowed reference.
     *
     * TypeScript otherwise considers analysisSource potentially
     * undefined after crossing the async function boundary.
     */
    const safeAnalysisSource =
      analysisSource;

    if (
      !analysisEntity ||
      (
        contextEntity &&
        Number(
          analysisEntity.entityKy,
        ) ===
          Number(
            contextEntity.entityKy,
          )
      )
    ) {
      safeAnalysisSource.setData({
        type: "FeatureCollection",
        features: [],
      });

      return;
    }

    const entity =
      analysisEntity;

    let cancelled =
      false;

    async function showAnalysisEntity() {
      try {
        const response =
          await fetch(
            `/api/atlas/entity-geometry?entityKy=${entity.entityKy}`,
            {
              cache: "no-store",
            },
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load analysis entity geometry.",
          );
        }

        const entityGeometry =
          await response.json();

        if (cancelled) {
          return;
        }

        if (!entityGeometry?.geometry) {
          safeAnalysisSource.setData({
            type: "FeatureCollection",
            features: [],
          });

          return;
        }

        const feature = {
          type: "Feature",

          properties: {
            entityKy:
              entityGeometry.entityKy,

            entityName:
              entityGeometry.entityName,

            entityType:
              entityGeometry.entityType,
          },

          geometry:
            entityGeometry.geometry,
        };

        safeAnalysisSource.setData({
          type: "FeatureCollection",
          features: [
            feature as any,
          ],
        });
      } catch (error) {
        console.error(
          "Atlas analysis geometry error:",
          error,
        );

        safeAnalysisSource.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }

    void showAnalysisEntity();

    return () => {
      cancelled = true;
    };
  }, [
    analysisEntity,
    contextEntity,
  ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div
        ref={
          mapContainerRef
        }
        className="absolute inset-0 h-full w-full"
      />

      {/* ======================================================
          CUSTOM MARKET CONTROL
          ====================================================== */}

      <div
        style={{
          position:
            "absolute",

          /*
           * Keep this below the search control and away from
           * Mapbox navigation.
           */
          top: 82,
          left: 16,

          zIndex: 20,

          pointerEvents:
            "auto",
        }}
      >
        {mode ===
        "explore" ? (
          <button
            type="button"
            onClick={
              startCustomMarket
            }
            style={{
              border:
                "1px solid rgba(15,23,42,0.14)",

              borderRadius:
                999,

              padding:
                "9px 14px",

              background:
                "rgba(255,255,255,0.94)",

              boxShadow:
                "0 5px 18px rgba(15,23,42,0.12)",

              backdropFilter:
                "blur(12px)",

              color:
                "#334155",

              fontSize: 12,

              fontWeight:
                750,

              cursor:
                "pointer",
            }}
          >
            Custom Market
          </button>
        ) : (
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: 7,

              padding:
                "7px",

              border:
                "1px solid rgba(15,118,110,0.28)",

              borderRadius:
                16,

              background:
                "rgba(255,255,255,0.96)",

              boxShadow:
                "0 5px 18px rgba(15,23,42,0.14)",

              backdropFilter:
                "blur(12px)",
            }}
          >
            <div
              style={{
                padding:
                  "0 5px",

                color:
                  "#115e59",

                fontSize:
                  12,

                fontWeight:
                  750,

                whiteSpace:
                  "nowrap",
              }}
            >
              {customBoundaries.length ===
              1
                ? "1 area selected"
                : `${customBoundaries.length} areas selected`}
            </div>

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

                  borderRadius:
                    999,

                  padding:
                    "6px 9px",

                  background:
                    "#ffffff",

                  color:
                    "#475569",

                  fontSize:
                    11,

                  fontWeight:
                    700,

                  cursor:
                    "pointer",
                }}
              >
                Clear
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
                  "6px 9px",

                background:
                  "#ffffff",

                color:
                  "#475569",

                fontSize:
                  11,

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}