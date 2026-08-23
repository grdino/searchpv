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
   */
  const fullBoundaryFeaturesRef =
    useRef<Map<number, any>>(new Map());

  const {
    contextEntity,
    analysisEntity,
    selectedBoundary,
    selectBoundary,

    popularAreaSelection,

    mode,

    customMarketMethod,

    customBoundaries,
    startCustomMarket,
    toggleCustomBoundary,
    clearCustomBoundaries,

    customDrawVertices,
    customDrawnGeometry,
    customDrawActive,

    startCustomDraw,
    addCustomDrawVertex,
    undoCustomDrawVertex,
    finishCustomDraw,
    clearCustomDraw,

    exitCustomMarket,
  } = useAtlasState();

  /*
   * ==========================================================
   * CURRENT REACT STATE FOR PERMANENT MAPBOX EVENT HANDLERS
   * ==========================================================
   *
   * Mapbox event handlers are registered once.
   * Refs allow those handlers to see current React state.
   */

  const selectBoundaryRef =
    useRef(selectBoundary);

  const modeRef =
    useRef(mode);

  const customMarketMethodRef =
    useRef(customMarketMethod);

  const customDrawActiveRef =
    useRef(customDrawActive);

  const toggleCustomBoundaryRef =
    useRef(toggleCustomBoundary);

  const addCustomDrawVertexRef =
    useRef(addCustomDrawVertex);

  useEffect(() => {
    selectBoundaryRef.current =
      selectBoundary;
  }, [selectBoundary]);

  useEffect(() => {
    modeRef.current =
      mode;
  }, [mode]);

  useEffect(() => {
    customMarketMethodRef.current =
      customMarketMethod;
  }, [customMarketMethod]);

  useEffect(() => {
    customDrawActiveRef.current =
      customDrawActive;
  }, [customDrawActive]);

  useEffect(() => {
    toggleCustomBoundaryRef.current =
      toggleCustomBoundary;
  }, [toggleCustomBoundary]);

  useEffect(() => {
    addCustomDrawVertexRef.current =
      addCustomDrawVertex;
  }, [addCustomDrawVertex]);

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
      requestAnimationFrame(() => {
        if (
          mapRef.current === map
        ) {
          map.resize();
        }
      });

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

          "fill-opacity-transition": {
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

          "line-opacity-transition": {
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
      // DEVELOPMENT POINT
      // ========================================================
      //
      // Developments do not have polygon footprints in Atlas.
      // The canonical longitude / latitude stored on geo.entity
      // is used as the development's map location.
      // ========================================================

      map.addSource(
        "atlas-development-selection",
        {
          type: "geojson",

          data: {
            type: "FeatureCollection",
            features: [],
          },
        },
      );

      /*
       * Soft outer halo.
       */
      map.addLayer({
        id: "atlas-development-selection-halo",

        type: "circle",

        source: "atlas-development-selection",

        slot: "top",

        paint: {
          "circle-radius": 13,

          "circle-color": "#ffffff",

          "circle-opacity": 0.9,

          "circle-stroke-color": "#925f17",

          "circle-stroke-width": 2,
        },
      });

      /*
       * Gold center point.
       */
      map.addLayer({
        id: "atlas-development-selection-point",

        type: "circle",

        source: "atlas-development-selection",

        slot: "top",

        paint: {
          "circle-radius": 7,

          "circle-color": "#c58b2a",

          "circle-stroke-color": "#713f12",

          "circle-stroke-width": 1.5,
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
      // 4. POPULAR AREA FOOTPRINT
      // ========================================================
      //
      // Popular Areas are exact Atlas geographic footprints.
      //
      // Examples:
      //
      // Emiliano Zapata -> [437]
      // Nuevo Nayarit   -> [626]
      // Las Glorias     -> [365, 366, 370]
      //
      // Keep this separate from MLS entity geometry so the
      // displayed name, highlighted geography and statistics all
      // describe the same physical footprint.
      // ========================================================

      map.addSource(
        "atlas-popular-area-selection",
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
          "atlas-popular-area-selection-fill",

        type: "fill",

        source:
          "atlas-popular-area-selection",

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
          "atlas-popular-area-selection-line",

        type: "line",

        source:
          "atlas-popular-area-selection",

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
      // 5. CUSTOM MARKET — SELECT AREAS
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
      // 6. CUSTOM MARKET — DRAW AREA
      // ========================================================
      //
      // One GeoJSON source contains:
      //
      // - completed / preview polygon
      // - developing line
      // - vertex points
      // ========================================================

      map.addSource(
        "atlas-custom-draw",
        {
          type: "geojson",

          data: {
            type:
              "FeatureCollection",

            features: [],
          },
        },
      );

      /*
       * Polygon fill.
       */
      map.addLayer({
        id:
          "atlas-custom-draw-fill",

        type: "fill",

        source:
          "atlas-custom-draw",

        slot: "top",

        filter: [
          "==",
          ["geometry-type"],
          "Polygon",
        ],

        paint: {
          "fill-color":
            "#0f766e",

          "fill-opacity":
            0.22,
        },
      });

      /*
       * Polygon outline.
       */
      map.addLayer({
        id:
          "atlas-custom-draw-polygon-line",

        type: "line",

        source:
          "atlas-custom-draw",

        slot: "top",

        filter: [
          "==",
          ["geometry-type"],
          "Polygon",
        ],

        paint: {
          "line-color":
            "#115e59",

          "line-width":
            3,

          "line-opacity":
            1,
        },
      });

      /*
       * Developing line while drawing.
       */
      map.addLayer({
        id:
          "atlas-custom-draw-line",

        type: "line",

        source:
          "atlas-custom-draw",

        slot: "top",

        filter: [
          "==",
          ["geometry-type"],
          "LineString",
        ],

        paint: {
          "line-color":
            "#0f766e",

          "line-width":
            3,

          "line-opacity":
            0.95,

          "line-dasharray": [
            1.5,
            1,
          ],
        },
      });

      /*
       * Vertex markers.
       */
      map.addLayer({
        id:
          "atlas-custom-draw-vertices",

        type: "circle",

        source:
          "atlas-custom-draw",

        slot: "top",

        filter: [
          "==",
          ["geometry-type"],
          "Point",
        ],

        paint: {
          "circle-radius":
            5,

          "circle-color":
            "#ffffff",

          "circle-stroke-color":
            "#0f766e",

          "circle-stroke-width":
            3,
        },
      });

      // ========================================================
      // 7. ALL GOVERNMENT BOUNDARIES
      // ========================================================

      fetch(
        "/api/atlas/boundaries",
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Unable to load government boundaries.",
            );
          }

          return response.json();
        })
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

                "line-width": [
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

                "line-opacity": [
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
                // CUSTOM MARKET
                // ==============================================

                if (
                  modeRef.current ===
                  "custom-select"
                ) {
                  /*
                   * SELECT AREAS
                   */
                  if (
                    customMarketMethodRef.current ===
                    "select"
                  ) {
                    toggleCustomBoundaryRef.current(
                      boundary,
                    );
                  }

                  /*
                   * DRAW AREA
                   *
                   * Do not toggle the government boundary.
                   *
                   * The generic map click handler registered
                   * below will capture the longitude / latitude
                   * and add the drawing vertex.
                   */
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
                if (
                  modeRef.current ===
                    "custom-select" &&
                  customMarketMethodRef.current ===
                    "draw" &&
                  customDrawActiveRef.current
                ) {
                  map.getCanvas().style.cursor =
                    "crosshair";

                  return;
                }

                map.getCanvas().style.cursor =
                  "pointer";
              },
            );

            map.on(
              "mouseleave",

              "atlas-boundaries-hit",

              () => {
                if (
                  modeRef.current ===
                    "custom-select" &&
                  customMarketMethodRef.current ===
                    "draw" &&
                  customDrawActiveRef.current
                ) {
                  map.getCanvas().style.cursor =
                    "crosshair";

                  return;
                }

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

      // ========================================================
      // GENERIC MAP CLICK — DRAW AREA
      // ========================================================
      //
      // This is independent of government polygons.
      //
      // A user can draw across any part of the map.
      // ========================================================

      map.on(
        "click",
        (
          event,
        ) => {
          if (
            modeRef.current !==
            "custom-select"
          ) {
            return;
          }

          if (
            customMarketMethodRef.current !==
            "draw"
          ) {
            return;
          }

          if (
            !customDrawActiveRef.current
          ) {
            return;
          }

          addCustomDrawVertexRef.current(
            [
              event.lngLat.lng,
              event.lngLat.lat,
            ],
          );
        },
      );
    });

    // ==========================================================
    // KEEP MAPBOX SYNCHRONIZED WITH CONTAINER SIZE
    // ==========================================================

    const resizeObserver =
      new ResizeObserver(() => {
        if (
          mapRef.current ===
          map
        ) {
          map.resize();
        }
      });

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
  // CUSTOM MARKET — SELECT AREAS DISPLAY
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
     * Only show the selected government polygons while
     * Select Areas is the active Custom Market method.
     *
     * The selection remains in React state when switching
     * to Draw Area and returns when switching back.
     */
    if (
      mode !==
        "custom-select" ||
      customMarketMethod !==
        "select"
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
        .filter(Boolean);

    customSource.setData({
      type:
        "FeatureCollection",

      features,
    });
  }, [
    mode,
    customMarketMethod,
    customBoundaries,
  ]);

  // ============================================================
  // CUSTOM MARKET — DRAW AREA DISPLAY
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const drawSource =
      map.getSource(
        "atlas-custom-draw",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (!drawSource) {
      return;
    }

    /*
     * Hide drawing while outside Draw Area.
     *
     * Geometry remains preserved in AtlasState and returns
     * when the user switches back to Draw Area.
     */
    if (
      mode !==
        "custom-select" ||
      customMarketMethod !==
        "draw"
    ) {
      drawSource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      return;
    }

    const features:
      any[] = [];

    /*
     * ----------------------------------------------------------
     * FINISHED POLYGON
     * ----------------------------------------------------------
     */

    if (
      customDrawnGeometry &&
      !customDrawActive
    ) {
      features.push({
        type:
          "Feature",

        properties: {
          drawingState:
            "finished",
        },

        geometry:
          customDrawnGeometry,
      });
    }

    /*
     * ----------------------------------------------------------
     * ACTIVE / IN-PROGRESS DRAWING
     * ----------------------------------------------------------
     */

    if (
      customDrawActive
    ) {
      /*
       * Vertex markers.
       */
      for (
        let index = 0;
        index <
        customDrawVertices.length;
        index += 1
      ) {
        features.push({
          type:
            "Feature",

          properties: {
            drawingState:
              "vertex",

            vertexIndex:
              index,
          },

          geometry: {
            type:
              "Point",

            coordinates:
              customDrawVertices[
                index
              ],
          },
        });
      }

      /*
       * Developing outline.
       */
      if (
        customDrawVertices.length >=
        2
      ) {
        features.push({
          type:
            "Feature",

          properties: {
            drawingState:
              "line",
          },

          geometry: {
            type:
              "LineString",

            coordinates:
              customDrawVertices,
          },
        });
      }

      /*
       * Once we have three vertices, show a live polygon
       * preview by temporarily closing the ring.
       */
      if (
        customDrawVertices.length >=
        3
      ) {
        const previewRing = [
          ...customDrawVertices,
          customDrawVertices[0],
        ];

        features.push({
          type:
            "Feature",

          properties: {
            drawingState:
              "preview",
          },

          geometry: {
            type:
              "Polygon",

            coordinates: [
              previewRing,
            ],
          },
        });
      }
    }

    drawSource.setData({
      type:
        "FeatureCollection",

      features,
    });
  }, [
    mode,
    customMarketMethod,
    customDrawVertices,
    customDrawnGeometry,
    customDrawActive,
  ]);

  // ============================================================
  // DRAWING CURSOR
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const canvas =
      map.getCanvas();

    if (
      mode ===
        "custom-select" &&
      customMarketMethod ===
        "draw" &&
      customDrawActive
    ) {
      canvas.style.cursor =
        "crosshair";

      return;
    }

    canvas.style.cursor =
      "";
  }, [
    mode,
    customMarketMethod,
    customDrawActive,
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
  // POPULAR AREA FOOTPRINT
  // ============================================================
  //
  // Popular Area shortcuts are based on exact government
  // boundary footprints rather than MLS entity identity.
  //
  // The complete boundary geometry is already loaded into
  // fullBoundaryFeaturesRef, so no additional geometry request
  // is necessary.
  // ============================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const popularAreaSource =
      map.getSource(
        "atlas-popular-area-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (!popularAreaSource) {
      return;
    }

    /*
    * ----------------------------------------------------------
    * CLEAR POPULAR AREA
    * ----------------------------------------------------------
    */

    if (
      !popularAreaSelection
    ) {
      popularAreaSource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      return;
    }

    /*
    * ----------------------------------------------------------
    * GET EXACT GOVERNMENT POLYGONS
    * ----------------------------------------------------------
    */

    const features =
      popularAreaSelection
        .boundaryKys
        .map(
          (
            boundaryKy,
          ) =>
            fullBoundaryFeaturesRef.current.get(
              Number(
                boundaryKy,
              ),
            ),
        )
        .filter(Boolean);

    if (
      features.length === 0
    ) {
      /*
      * The government-boundary request may still be finishing
      * when the selection first changes.
      *
      * The Popular Area buttons won't normally be available
      * until after page load, but don't display stale geometry
      * if this ever occurs.
      */
      popularAreaSource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      return;
    }

    /*
    * ----------------------------------------------------------
    * HIGHLIGHT EXACT FOOTPRINT
    * ----------------------------------------------------------
    */

    popularAreaSource.setData({
      type:
        "FeatureCollection",

      features,
    });

    /*
    * ----------------------------------------------------------
    * CALCULATE COMBINED BOUNDS
    * ----------------------------------------------------------
    *
    * We intentionally calculate this from the actual polygon
    * coordinates rather than from an MLS entity.
    * ----------------------------------------------------------
    */

    const bounds =
      new mapboxgl.LngLatBounds();

    function extendCoordinates(
      coordinates: any,
    ) {
      if (
        !Array.isArray(
          coordinates,
        )
      ) {
        return;
      }

      /*
      * Coordinate pair:
      *
      * [longitude, latitude]
      */
      if (
        coordinates.length >=
          2 &&
        typeof coordinates[0] ===
          "number" &&
        typeof coordinates[1] ===
          "number"
      ) {
        bounds.extend([
          coordinates[0],
          coordinates[1],
        ]);

        return;
      }

      /*
      * Polygon / MultiPolygon nesting.
      */
      for (
        const child of
        coordinates
      ) {
        extendCoordinates(
          child,
        );
      }
    }

    for (
      const feature of
      features
    ) {
      extendCoordinates(
        feature?.geometry
          ?.coordinates,
      );
    }

    if (
      bounds.isEmpty()
    ) {
      return;
    }

    /*
    * ----------------------------------------------------------
    * FIT MAP TO COMPLETE FOOTPRINT
    * ----------------------------------------------------------
    *
    * Match the same visual treatment used when Atlas navigates
    * to an MLS entity.
    * ----------------------------------------------------------
    */

    map.fitBounds(
      bounds,

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
  }, [
    popularAreaSelection,
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

    const entitySource =
      map.getSource(
        "atlas-entity-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    const developmentSource =
      map.getSource(
        "atlas-development-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    /*
     * ----------------------------------------------------------
     * NO CONTEXT
     * ----------------------------------------------------------
     */

    if (
      !contextEntity
    ) {
      entitySource?.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      developmentSource?.setData({
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

      if (!currentMap) {
        return;
      }

      const currentEntitySource =
        currentMap.getSource(
          "atlas-entity-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      const currentDevelopmentSource =
        currentMap.getSource(
          "atlas-development-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      /*
       * Map sources may not quite exist yet during initial load.
       */
      if (
        !currentEntitySource ||
        !currentDevelopmentSource
      ) {
        currentMap.once(
          "load",
          showContextEntity,
        );

        return;
      }

      /*
       * Always clear previous context geometry and previous
       * development marker before showing the new selection.
       */
      currentEntitySource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      currentDevelopmentSource.setData({
        type:
          "FeatureCollection",

        features: [],
      });

      if (
        currentMap.getLayer(
          "atlas-entity-selection-fill",
        )
      ) {
        currentMap.setPaintProperty(
          "atlas-entity-selection-fill",

          "fill-opacity",

          0,
        );
      }

      if (
        currentMap.getLayer(
          "atlas-entity-selection-line",
        )
      ) {
        currentMap.setPaintProperty(
          "atlas-entity-selection-line",

          "line-opacity",

          0,
        );
      }

      // ========================================================
      // DEVELOPMENT
      // ========================================================
      //
      // Development entities are represented by their canonical
      // Atlas point rather than a polygon footprint.
      //
      // Do this BEFORE attempting entity-geometry.
      // ========================================================

      if (
        entity.entityType ===
          "DV" &&
        Number.isFinite(
          entity.longitude,
        ) &&
        Number.isFinite(
          entity.latitude,
        )
      ) {
        const longitude =
          entity.longitude as number;

        const latitude =
          entity.latitude as number;

        currentDevelopmentSource.setData({
          type:
            "FeatureCollection",

          features: [
            {
              type:
                "Feature",

              properties: {
                entityKy:
                  entity.entityKy,

                entityName:
                  entity.displayName ??
                  entity.canonicalName,

                entityType:
                  entity.entityType,
              },

              geometry: {
                type:
                  "Point",

                coordinates: [
                  longitude,
                  latitude,
                ],
              },
            },
          ],
        });

        currentMap.flyTo({
          center: [
            longitude,
            latitude,
          ],

          zoom: 16,

          pitch: 45,

          duration: 1800,

          essential: true,
        });

        return;
      }

      // ========================================================
      // GEOGRAPHIC ENTITY
      // ========================================================

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

            currentEntitySource.setData(
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

      // ========================================================
      // GENERIC POINT FALLBACK
      // ========================================================
      //
      // Keep the existing fallback for any other Atlas entity
      // that has coordinates but no usable polygon geometry.
      // ========================================================

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

    if (
      !analysisSource
    ) {
      return;
    }

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
        type:
          "FeatureCollection",

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
              cache:
                "no-store",
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            "Unable to load analysis entity geometry.",
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
          !entityGeometry?.geometry
        ) {
          safeAnalysisSource.setData({
            type:
              "FeatureCollection",

            features: [],
          });

          return;
        }

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

        safeAnalysisSource.setData({
          type:
            "FeatureCollection",

          features: [
            feature as any,
          ],
        });
      } catch (
        error
      ) {
        console.error(
          "Atlas analysis geometry error:",
          error,
        );

        safeAnalysisSource.setData({
          type:
            "FeatureCollection",

          features: [],
        });
      }
    }

    void showAnalysisEntity();

    return () => {
      cancelled =
        true;
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

          top: 82,
          left: 16,

          zIndex: 20,

          pointerEvents:
            "auto",
        }}
      >
        {mode ===
        "explore" ? (
          /*
           * ----------------------------------------------------
           * ENTER CUSTOM MARKET
           * ----------------------------------------------------
           */
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
        ) : customMarketMethod ===
          "select" ? (
          /*
           * ----------------------------------------------------
           * SELECT AREAS CONTROLS
           * ----------------------------------------------------
           */
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
        ) : (
          /*
           * ----------------------------------------------------
           * DRAW AREA CONTROLS
           * ----------------------------------------------------
           */
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              flexWrap:
                "wrap",

              gap: 7,

              padding:
                "7px",

              maxWidth:
                "calc(100vw - 32px)",

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
            {/* NO DRAWING YET */}

            {!customDrawActive &&
            !customDrawnGeometry ? (
              <>
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
                  Draw Area
                </div>

                <button
                  type="button"
                  onClick={
                    startCustomDraw
                  }
                  style={{
                    border:
                      "1px solid #0f766e",

                    borderRadius:
                      999,

                    padding:
                      "6px 10px",

                    background:
                      "#0f766e",

                    color:
                      "#ffffff",

                    fontSize:
                      11,

                    fontWeight:
                      700,

                    cursor:
                      "pointer",
                  }}
                >
                  Start Drawing
                </button>
              </>
            ) : null}

            {/* ACTIVE DRAWING */}

            {customDrawActive ? (
              <>
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
                  {customDrawVertices.length ===
                  1
                    ? "1 point"
                    : `${customDrawVertices.length} points`}
                </div>

                {customDrawVertices.length >
                0 ? (
                  <button
                    type="button"
                    onClick={
                      undoCustomDrawVertex
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
                    Undo
                  </button>
                ) : null}

                {customDrawVertices.length >=
                3 ? (
                  <button
                    type="button"
                    onClick={
                      finishCustomDraw
                    }
                    style={{
                      border:
                        "1px solid #0f766e",

                      borderRadius:
                        999,

                      padding:
                        "6px 10px",

                      background:
                        "#0f766e",

                      color:
                        "#ffffff",

                      fontSize:
                        11,

                      fontWeight:
                        700,

                      cursor:
                        "pointer",
                    }}
                  >
                    Finish Area
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={
                    clearCustomDraw
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
              </>
            ) : null}

            {/* FINISHED DRAWING */}

            {!customDrawActive &&
            customDrawnGeometry ? (
              <>
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
                  Area drawn
                </div>

                <button
                  type="button"
                  onClick={
                    startCustomDraw
                  }
                  style={{
                    border:
                      "1px solid #0f766e",

                    borderRadius:
                      999,

                    padding:
                      "6px 10px",

                    background:
                      "#ffffff",

                    color:
                      "#115e59",

                    fontSize:
                      11,

                    fontWeight:
                      700,

                    cursor:
                      "pointer",
                  }}
                >
                  Redraw
                </button>

                <button
                  type="button"
                  onClick={
                    clearCustomDraw
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
              </>
            ) : null}

            {/* EXIT CUSTOM MARKET */}

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