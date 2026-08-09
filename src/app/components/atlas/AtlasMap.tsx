"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";

export default function AtlasMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const { selectedEntity } = useAtlasState();

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

      map.addSource("atlas-selection", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

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

// React when Atlas State changes
useEffect(() => {
  const map = mapRef.current;

  if (!map) return;
  if (!selectedEntity) return;

  // Fly to the selected entity.
  if (selectedEntity.boundary) {
    const bounds = getFeatureBounds(
      selectedEntity.boundary
    );

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: {
          top: 110,
          right: 40,
          bottom: 220,
          left: 40,
        },
        pitch: 45,
        duration: 1800,
        essential: true,
      });
    }
  } else {
    map.flyTo({
      center: [
        selectedEntity.longitude,
        selectedEntity.latitude,
      ],
      zoom: 15,
      pitch: 45,
      duration: 1800,
      essential: true,
    });
  }

  const showBoundary = () => {
    const source = map.getSource(
      "atlas-selection"
    ) as mapboxgl.GeoJSONSource | undefined;

    if (!source) return;

    if (!selectedEntity.boundary) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });

      map.setPaintProperty(
        "atlas-selection-fill",
        "fill-opacity",
        0
      );

      map.setPaintProperty(
        "atlas-selection-line",
        "line-opacity",
        0
      );

      return;
    }

    map.setPaintProperty(
      "atlas-selection-fill",
      "fill-opacity",
      0
    );

    map.setPaintProperty(
      "atlas-selection-line",
      "line-opacity",
      0
    );

    source.setData({
      type: "FeatureCollection",
      features: [selectedEntity.boundary],
    });

    window.setTimeout(() => {
      if (!mapRef.current) return;

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
    }, 1200);
  };

  if (map.getSource("atlas-selection")) {
    showBoundary();
  } else {
    map.once("load", showBoundary);
  }
}, [selectedEntity]);
return (
  <div
    ref={mapContainerRef}
    className="absolute inset-0 h-full w-full"
  />
);
}