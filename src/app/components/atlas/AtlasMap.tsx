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

  const {
    selectedEntity,
    selectedBoundary,
    selectBoundary,
  } = useAtlasState();

  // ============================================================
  // Create map
  // ============================================================

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    const token =
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      console.error(
        "Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
      );
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/standard",
      center: [-105.3, 20.66],
      zoom: 9.7,
      bearing: 0,
      pitch: 20,
      attributionControl: false,
    });

    mapRef.current = map;

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

    const resizeFrame = requestAnimationFrame(() => {
      if (mapRef.current === map) {
        map.resize();
      }
    });

    map.on("load", () => {
      map.resize();

      // ========================================================
      // 1. SEARCHPV ENTITY SELECTION
      //
      // Complete MLS Zone / Area / Community footprint returned
      // by geography_entity_geometry().
      // ========================================================

      map.addSource("atlas-entity-selection", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "atlas-entity-selection-fill",
        type: "fill",
        source: "atlas-entity-selection",
        slot: "top",
        paint: {
          "fill-color": "#d4a64a",
          "fill-opacity": 0,
          "fill-opacity-transition": {
            duration: 1000,
            delay: 0,
          },
        },
      });

      map.addLayer({
        id: "atlas-entity-selection-line",
        type: "line",
        source: "atlas-entity-selection",
        slot: "top",
        paint: {
          "line-color": "#a9792b",
          "line-width": 2.25,
          "line-opacity": 0,
          "line-opacity-transition": {
            duration: 1000,
            delay: 0,
          },
        },
      });

      // ========================================================
      // 2. INDIVIDUAL GOVERNMENT BOUNDARY SELECTION
      //
      // This sits on top of the complete SearchPV entity
      // footprint.
      // ========================================================

      map.addSource("atlas-boundary-selection", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "atlas-boundary-selection-fill",
        type: "fill",
        source: "atlas-boundary-selection",
        slot: "top",
        paint: {
          "fill-color": "#b7791f",
          "fill-opacity": 0.18,
        },
      });

      map.addLayer({
        id: "atlas-boundary-selection-line",
        type: "line",
        source: "atlas-boundary-selection",
        slot: "top",
        paint: {
          "line-color": "#8a5a18",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      });

      // ========================================================
      // 3. ALL GOVERNMENT BOUNDARIES
      // ========================================================

      fetch("/api/atlas/boundaries")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Unable to load government boundaries.",
            );
          }

          return response.json();
        })
        .then((boundaryData) => {
          console.log(
            "Government boundary features:",
            boundaryData.features.length,
          );

          if (map.getSource("atlas-boundaries")) {
            return;
          }

          // ====================================================
          // Keep the complete original feature for each boundary.
          //
          // IMPORTANT:
          // Mapbox's feature returned from a click can represent
          // only the rendered/tiled portion underneath the click.
          // We therefore use boundary_ky to get the complete
          // original GeoJSON feature when highlighting.
          // ====================================================

          const fullBoundaryFeatures =
            new Map<number, any>();

          for (
            const boundaryFeature of boundaryData.features
          ) {
            const boundaryKy = Number(
              boundaryFeature.properties?.boundary_ky,
            );

            if (Number.isFinite(boundaryKy)) {
              fullBoundaryFeatures.set(
                boundaryKy,
                boundaryFeature,
              );
            }
          }

          map.addSource("atlas-boundaries", {
            type: "geojson",
            data: boundaryData,
          });

          /*
           * Invisible fill used as the government-boundary
           * click target.
           */
          map.addLayer({
            id: "atlas-boundaries-hit",
            type: "fill",
            source: "atlas-boundaries",
            paint: {
              "fill-color": "#000000",
              "fill-opacity": 0.001,
            },
          });

          /*
           * Normal government-boundary outlines.
           */
          map.addLayer({
            id: "atlas-boundaries-line",
            type: "line",
            source: "atlas-boundaries",
            paint: {
              "line-color": "#475569",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                9, 0.5,
                12, 0.8,
                15, 1.1,
              ],
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                9, 0.12,
                12, 0.20,
                15, 0.28,
              ],
            },
          });

          // ====================================================
          // GOVERNMENT BOUNDARY CLICK
          //
          // Registered only after atlas-boundaries-hit exists.
          // ====================================================

          map.on(
            "click",
            "atlas-boundaries-hit",
            async (event) => {
              const clickedFeature =
                event.features?.[0] as any;

              if (!clickedFeature) {
                return;
              }

              const boundaryKy = Number(
                clickedFeature.properties
                  ?.boundary_ky,
              );

              if (!Number.isFinite(boundaryKy)) {
                return;
              }

              const boundaryName =
                clickedFeature.properties
                  ?.boundary_nm;

              /*
               * Get the COMPLETE original feature.
               *
               * Do not use clickedFeature as the selection
               * geometry because Mapbox may return only the
               * rendered portion underneath the click.
               */
              const fullBoundaryFeature =
                fullBoundaryFeatures.get(
                  boundaryKy,
                );

              const boundary = {
                boundaryKy,
                boundaryName,
                boundaryType:
                  clickedFeature.properties
                    ?.boundary_type_cd ??
                  undefined,
                municipalityName:
                  clickedFeature.properties
                    ?.municipality_nm ??
                  undefined,
                districtName:
                  clickedFeature.properties
                    ?.district_nm ??
                  undefined,
              };

              /*
               * Highlight the complete government polygon.
               */
              const boundarySelectionSource =
                map.getSource(
                  "atlas-boundary-selection",
                ) as
                  | mapboxgl.GeoJSONSource
                  | undefined;

              boundarySelectionSource?.setData({
                type: "FeatureCollection",
                features:
                  fullBoundaryFeature
                    ? [fullBoundaryFeature]
                    : [],
              });

              /*
               * Find every SearchPV MLS geography that uses
               * this government polygon.
               *
               * AtlasState decides whether the existing MLS
               * context should remain selected.
               */
              try {
                const response = await fetch(
                  `/api/atlas/boundary-entity?boundaryKy=${boundaryKy}`,
                  {
                    cache: "no-store",
                  },
                );

                if (!response.ok) {
                  throw new Error(
                    "Unable to load related MLS geographies.",
                  );
                }

                const entities =
                  await response.json();

                selectBoundary(
                  boundary,
                  Array.isArray(entities)
                    ? entities
                    : [],
                );
              } catch (error) {
                console.error(
                  "Atlas related geography lookup error:",
                  error,
                );

                selectBoundary(boundary, []);
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
              map.getCanvas().style.cursor = "";
            },
          );
        })
        .catch((error) => {
          console.error(
            "Atlas government boundary error:",
            error,
          );
        });
    });

    // Keep Mapbox synchronized with the container size.
    const resizeObserver =
      new ResizeObserver(() => {
        if (mapRef.current === map) {
          map.resize();
        }
      });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();

      if (mapRef.current === map) {
        mapRef.current = null;
      }

      map.remove();
    };
  }, []);

  // ============================================================
  // Clear individual government selection when state says there
  // is no selected boundary.
  //
  // This happens, for example, when a new SearchPV search result
  // is selected through selectEntity().
  // ============================================================

  useEffect(() => {
    if (selectedBoundary) return;

    const map = mapRef.current;

    if (!map) return;

    const boundarySelectionSource =
      map.getSource(
        "atlas-boundary-selection",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    boundarySelectionSource?.setData({
      type: "FeatureCollection",
      features: [],
    });
  }, [selectedBoundary]);

  // ============================================================
  // React when the selected SearchPV entity changes.
  // ============================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    /*
     * No SearchPV entity is selected.
     *
     * Clear the MLS footprint, but DO NOT clear the individual
     * government selection.
     */
    if (!selectedEntity) {
      const entitySource =
        map.getSource(
          "atlas-entity-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      entitySource?.setData({
        type: "FeatureCollection",
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

    const entity = selectedEntity;

    let cancelled = false;

    async function showSelectedEntity() {
      const currentMap = mapRef.current;

      if (!currentMap) return;

      const entitySource =
        currentMap.getSource(
          "atlas-entity-selection",
        ) as
          | mapboxgl.GeoJSONSource
          | undefined;

      if (!entitySource) {
        currentMap.once(
          "load",
          showSelectedEntity,
        );
        return;
      }

      /*
       * Clear the previous SearchPV entity geometry before
       * loading the new footprint.
       *
       * IMPORTANT:
       * Do NOT clear atlas-boundary-selection here.
       *
       * When a government polygon caused this entity change,
       * that polygon needs to remain highlighted on top.
       */
      entitySource.setData({
        type: "FeatureCollection",
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

      /*
       * ZN = Zone
       * AR = Area
       * CM = Community
       *
       * Reviewed geometry comes from
       * public.geography_entity_geometry().
       */
      if (entity.entityKy) {
        try {
          const response = await fetch(
            `/api/atlas/entity-geometry?entityKy=${entity.entityKy}`,
            {
              cache: "no-store",
            },
          );

          if (!response.ok) {
            throw new Error(
              "Unable to load entity geometry.",
            );
          }

          const entityGeometry =
            await response.json();

          if (cancelled) return;

          /*
           * Use the reviewed/derived polygon footprint when
           * geometry exists.
           */
          if (
            entityGeometry?.geometry &&
            Array.isArray(
              entityGeometry?.bbox,
            ) &&
            entityGeometry.bbox.length === 4
          ) {
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

            entitySource.setData({
              type: "FeatureCollection",
              features: [feature as any],
            });

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
                [west, south],
                [east, north],
              ],
              {
                padding: {
                  top: 110,
                  right: 40,
                  bottom: Math.round(
                    window.innerHeight * 0.46,
                  ),
                  left: 40,
                },
                pitch: 45,
                duration: 1800,
                essential: true,
              },
            );

            /*
             * Fade in the complete SearchPV footprint.
             */
            window.setTimeout(() => {
              if (cancelled) return;
              if (!mapRef.current) return;

              mapRef.current.setPaintProperty(
                "atlas-entity-selection-fill",
                "fill-opacity",
                0.12,
              );

              mapRef.current.setPaintProperty(
                "atlas-entity-selection-line",
                "line-opacity",
                1,
              );
            }, 1200);

            return;
          }
        } catch (error) {
          console.error(
            "Atlas entity geometry error:",
            error,
          );
        }
      }

      /*
       * No polygon geometry exists.
       *
       * Fall back to longitude / latitude for developments,
       * buildings, Nayarit entities without polygons, etc.
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

    void showSelectedEntity();

    return () => {
      cancelled = true;
    };
  }, [selectedEntity]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}