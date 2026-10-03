"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ATLAS_DISCOVER_SEQUENCE } from "@/app/components/atlas/AtlasDiscoverConfig";

// This route is a production asset generator, not a public homepage feature.
// Record its 1400 × 500 stage; do not record the surrounding browser window.
const FRAME_MS = 4200; // Neighborhood reveal, excluding the visible transfer
const ZOOM_OUT_MS = 750;
const TRAVEL_MS = 1050;
const OVERVIEW_ZOOM = 10.55;
// Two-stage dissolve: reveal the moving map early, keep the illustrated
// neighborhood label as a translucent overlay, then clear it at arrival.
const ARTWORK_FADE_MS = 650;
const ARTWORK_SOFTEN_AT_MS = 450;
const ARTWORK_CLEAR_AT_MS = 2700;
const CAPTURE_WIDTH = 1400;
const CAPTURE_HEIGHT = 500;
const START_CENTER: [number, number] = [-105.3, 20.66];
const ARTWORK = [
  "/home/hero/zona-romantica.webp",
  "/home/hero/marina-vallarta.webp",
  "/home/hero/nuevo-nayarit.webp",
  "/home/hero/conchas-chinas.webp",
];

type BoundaryFeature = {
  properties?: { boundary_ky?: number | string };
  geometry?: { coordinates?: unknown };
};

function extendCoordinates(bounds: mapboxgl.LngLatBounds, value: unknown): void {
  if (!Array.isArray(value)) return;
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    bounds.extend([value[0], value[1]]);
    return;
  }
  value.forEach((child) => extendCoordinates(bounds, child));
}

export default function HomeHeroCapturePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [artworkOpacity, setArtworkOpacity] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || !containerRef.current) {
      setError("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN or map container.");
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: START_CENTER,
      zoom: 9.7,
      pitch: 20,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: false }), "bottom-right");

    let disposed = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(() => { if (!disposed) fn(); }, ms));
    };

    async function initialize() {
      try {
        const [response] = await Promise.all([
          fetch("/api/atlas/boundaries"),
          new Promise<void>((resolve, reject) => {
            map.once("load", () => resolve());
            map.once("error", (event) => reject(event.error));
          }),
        ]);
        if (!response.ok) throw new Error(`Boundary request failed: ${response.status}`);
        const geojson = await response.json();
        const features: BoundaryFeature[] = geojson.features ?? [];
        if (disposed) return;

        const sceneBoundaries = ATLAS_DISCOVER_SEQUENCE.map((scene) => {
          const wanted = new Set(scene.popularArea.boundaryKys.map(Number));
          return features.filter((feature) => wanted.has(Number(feature.properties?.boundary_ky)));
        });

        const centers = ATLAS_DISCOVER_SEQUENCE.map((scene, index) => {
          const bounds = new mapboxgl.LngLatBounds();
          sceneBoundaries[index].forEach((feature) => {
            extendCoordinates(bounds, feature.geometry?.coordinates);
          });
          if (bounds.isEmpty()) throw new Error(`No boundary found for ${scene.id}`);
          return bounds.getCenter();
        });

        // Highlight exactly the same popular-area boundaries as the Atlas tour.
        map.addSource("home-hero-area", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "home-hero-area-fill",
          type: "fill",
          source: "home-hero-area",
          slot: "top",
          paint: { "fill-color": "#c58b2a", "fill-opacity": 0.30 },
        });
        map.addLayer({
          id: "home-hero-area-line",
          type: "line",
          source: "home-hero-area",
          slot: "top",
          paint: {
            "line-color": "#925f17",
            "line-width": 3,
            "line-opacity": 0.95,
          },
        });

        // All artwork is already in the DOM; wait for its image data before starting.
        await Promise.all(ARTWORK.map((src) => {
          const img = new Image();
          img.src = src;
          return img.decode();
        }));
        if (disposed) return;
        map.resize();
        setReady(true);
        document.documentElement.dataset.homeHeroCaptureReady = "true";

        // The map never resets between scenes: viewers see where the next
        // neighborhood lies relative to the previous one.
        const run = (index: number, first = false) => {
          const scene = ATLAS_DISCOVER_SEQUENCE[index];
          const center = centers[index];
          const highlight = map.getSource("home-hero-area") as mapboxgl.GeoJSONSource;
          setSceneIndex(index);
          setArtworkOpacity(1);
          highlight.setData({
            type: "FeatureCollection",
            features: sceneBoundaries[index],
          } as Parameters<mapboxgl.GeoJSONSource["setData"]>[0]);

          if (first) {
            // Opening shot begins at the wider bay view.
            map.jumpTo({
              center: START_CENTER, zoom: 9.7, pitch: 20, bearing: 0, padding: 0,
            });
          }

          later(() => {
            map.flyTo({
              center,
              zoom: scene.camera.zoom,
              pitch: scene.camera.pitch,
              bearing: scene.camera.bearing,
              curve: scene.camera.curve,
              duration: 3150,
              padding: { top: 24, right: 35, bottom: 24, left: 35 },
              essential: true,
            });
          }, first ? 220 : 160);

          later(() => setArtworkOpacity(0.48), ARTWORK_SOFTEN_AT_MS);
          later(() => setArtworkOpacity(0), ARTWORK_CLEAR_AT_MS);

          // The outgoing neighborhood remains visible when the map pulls back.
          later(() => {
            const nextIndex = (index + 1) % centers.length;
            const nextCenter = centers[nextIndex];

            // 1. Pull back from the current footprint.
            map.easeTo({
              zoom: OVERVIEW_ZOOM,
              pitch: 12,
              bearing: 0,
              duration: ZOOM_OUT_MS,
              essential: true,
            });

            // 2. Travel across the bay at overview zoom, so the relative
            //    position of the neighborhoods is actually visible.
            later(() => {
              highlight.setData({
                type: "FeatureCollection",
                features: sceneBoundaries[nextIndex],
              } as Parameters<mapboxgl.GeoJSONSource["setData"]>[0]);
              map.easeTo({
                center: nextCenter,
                zoom: OVERVIEW_ZOOM,
                pitch: 12,
                bearing: 0,
                duration: TRAVEL_MS,
                essential: true,
              });
            }, ZOOM_OUT_MS);

            // 3. Show the next illustration and zoom in without resetting
            //    the map's position. Its dissolve reveals the arrival.
            later(() => run(nextIndex), ZOOM_OUT_MS + TRAVEL_MS);
          }, FRAME_MS);
        };
        run(0, true);
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void initialize();
    return () => {
      disposed = true;
      timers.forEach(window.clearTimeout);
      delete document.documentElement.dataset.homeHeroCaptureReady;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <main className="min-h-dvh bg-slate-900 p-6 text-white">
      <div className="mb-3 text-sm">Homepage hero capture · {ready ? "READY" : error ?? "Loading Atlas geometry…"}</div>
      <div
        id="home-hero-capture"
        style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, position: "relative", overflow: "hidden", background: "#dce8ea" }}
      >
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
        {ARTWORK.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", pointerEvents: "none",
              opacity: index === sceneIndex ? artworkOpacity * 0.88 : 0,
              transition: index === sceneIndex ? `opacity ${ARTWORK_FADE_MS}ms cubic-bezier(.22,.61,.36,1)` : "none",
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-300">Record only the 1400 × 500 stage. Map attribution must remain visible in the finished recording.</p>
    </main>
  );
}
