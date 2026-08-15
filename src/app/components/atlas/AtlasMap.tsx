"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";

export default function AtlasMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const {
    selectedEntity,
    selectBoundary,
  } = useAtlasState();

// Create map
  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      console.error("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/standard",
      center: [-105.3, 20.66],
      zoom: 9.7,
      bearing: 0,
      pitch: 35,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
      "bottom-right"
    );

    // Resize once the browser has completed layout.
    requestAnimationFrame(() => {
      map.resize();
    });

    // Resize again once the map style has loaded.
    map.on("load", () => {
      map.resize();

    // All government boundaries
    fetch("/api/atlas/boundaries")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load government boundaries.");
        }

        return response.json();
      })
      .then((boundaryData) => {
        console.log(
          "Government boundary features:",
          boundaryData.features.length
        );

        if (map.getSource("atlas-boundaries")) return;

        map.addSource("atlas-boundaries", {
          type: "geojson",
          data: boundaryData,
        });

        map.addLayer({
          id: "atlas-boundaries-hit",
          type: "fill",
          source: "atlas-boundaries",
          paint: {
            "fill-color": "#000000",
            "fill-opacity": 0.001,
          },
        });

        map.addLayer({
          id: "atlas-boundaries-line",
          type: "line",
          source: "atlas-boundaries",
          paint: {
            "line-color": "#191904",
            "line-width": 3,
            "line-opacity": 0.65,
          },
        });
      })
      .catch((error) => {
      });

      map.on("click", "atlas-boundaries-hit", (event) => {
        const feature = event.features?.[0] as any;

        if (!feature) return;

        const boundaryKy = feature.properties?.boundary_ky;
        const boundaryName = feature.properties?.boundary_nm;

        selectBoundary({
          boundaryKy,
          boundaryName,
          boundaryType:
            feature.properties?.boundary_type_cd ?? undefined,
          municipalityName:
            feature.properties?.municipality_nm ?? undefined,
          districtName:
            feature.properties?.district_nm ?? undefined,
        });

        console.log("Boundary clicked:", {
          boundaryKy,
          boundaryName,
          properties: feature.properties,
        });

        const selectionSource = map.getSource(
          "atlas-selection"
        ) as mapboxgl.GeoJSONSource | undefined;

        if (!selectionSource) return;

        selectionSource.setData({
          type: "FeatureCollection",
          features: [feature as any],
        });

        map.setPaintProperty(
          "atlas-selection-fill",
          "fill-opacity",
          0.16
        );

        map.setPaintProperty(
          "atlas-selection-line",
          "line-opacity",
          1
        );
      });

      map.on("mouseenter", "atlas-boundaries-hit", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "atlas-boundaries-hit", () => {
        map.getCanvas().style.cursor = "";
      });

       // Existing selected-boundary source
      map.addSource("atlas-selection", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Gold fill + line layers...
      map.addLayer({
        id: "atlas-selection-fill",
        type: "fill",
        source: "atlas-selection",
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
        id: "atlas-selection-line",
        type: "line",
        source: "atlas-selection",
        slot: "top",
        paint: {
          "line-color": "#9a6a1f",
          "line-width": 3,
          "line-opacity": 0,
          "line-opacity-transition": {
            duration: 1000,
            delay: 0,
          },
        },
      });
    });

    // Keep Mapbox synchronized with the container size.
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

function getFeatureBounds(
  feature: {
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }
) {
  const bounds = new mapboxgl.LngLatBounds();

  function walkCoordinates(coords: unknown) {
    if (!Array.isArray(coords)) return;

    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      bounds.extend([
        coords[0] as number,
        coords[1] as number,
      ]);

      return;
    }

    for (const item of coords) {
      walkCoordinates(item);
    }
  }

  walkCoordinates(feature.geometry.coordinates);

  return bounds;
}

// React when the selected SearchPV entity changes.
useEffect(() => {
  const map = mapRef.current;

  if (!map) return;
  if (!selectedEntity) return;

  const entity = selectedEntity;

  let cancelled = false;

  async function showSelectedEntity() {
    const currentMap = mapRef.current;

    if (!currentMap) return;

    const source = currentMap.getSource(
      "atlas-selection",
    ) as mapboxgl.GeoJSONSource | undefined;

    if (!source) {
      currentMap.once("load", showSelectedEntity);
      return;
    }

    /*
     * Clear the previous highlighted geography first.
     */
    source.setData({
      type: "FeatureCollection",
      features: [],
    });

    currentMap.setPaintProperty(
      "atlas-selection-fill",
      "fill-opacity",
      0,
    );

    currentMap.setPaintProperty(
      "atlas-selection-line",
      "line-opacity",
      0,
    );

    /*
     * SearchPV geographic entities such as:
     *
     * ZN = Zone
     * AR = Area
     * CM = Community
     *
     * can now get their geometry from
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

        const entityGeometry = await response.json();

        if (cancelled) return;

        /*
         * If this entity has a reviewed/derived polygon
         * footprint, use it.
         */
        if (
          entityGeometry?.geometry &&
          Array.isArray(entityGeometry?.bbox) &&
          entityGeometry.bbox.length === 4
        ) {
          const feature = {
            type: "Feature",
            properties: {
              entityKy: entityGeometry.entityKy,
              entityName:
                entityGeometry.entityName,
              entityType:
                entityGeometry.entityType,
            },
            geometry: entityGeometry.geometry,
          };

          source.setData({
            type: "FeatureCollection",
            features: [feature as any],
          });

          const [
            west,
            south,
            east,
            north,
          ] = entityGeometry.bbox.map(Number);

          currentMap.fitBounds(
            [
              [west, south],
              [east, north],
            ],
            {
              padding: {
                top: 110,
                right: 40,
                bottom: 220,
                left: 40,
              },
              pitch: 45,
              duration: 1800,
              essential: true,
            },
          );

          /*
           * Fade in the selected SearchPV footprint
           * after the map begins moving.
           */
          window.setTimeout(() => {
            if (cancelled) return;
            if (!mapRef.current) return;

            mapRef.current.setPaintProperty(
              "atlas-selection-fill",
              "fill-opacity",
              0.16,
            );

            mapRef.current.setPaintProperty(
              "atlas-selection-line",
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
     * Fall back to the entity's longitude / latitude.
     * This preserves the current behavior for developments,
     * buildings, Nayarit entities without polygons, etc.
     */
    if (
      Number.isFinite(entity.longitude) &&
      Number.isFinite(entity.latitude)
    ) {
      currentMap.flyTo({
        center: [
          entity.longitude,
          entity.latitude,
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