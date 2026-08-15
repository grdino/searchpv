"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

type BoundaryMapData = {
  entity: {
    entityKy: number;
    zoneName: string;
    areaName: string;
    communityName: string;
  } | null;

  boundaries: Array<{
    boundaryKy: number;
    boundaryName: string;
    boundaryType: string;
    rank: number;
    listingCount: number;
    totalListingCount: number;
    listingPercent: number;
    cumulativeListingPercent: number;
    selected: boolean;
    geometry: GeoJSON.Geometry;
  }>;

  propertyPoints: Array<{
    listingKy: number;
    propertyKy: number;
    source: string;
    longitude: number;
    latitude: number;
  }>;
};

export default function BoundaryReviewMap({
  data,
  selectedBoundaryKys,
}: {
  data: BoundaryMapData;
  selectedBoundaryKys: number[];
}) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  const selectedBoundaryKysRef =
    useRef<number[]>(selectedBoundaryKys);

  selectedBoundaryKysRef.current =
    selectedBoundaryKys;

  useEffect(() => {
    if (!containerRef.current) return;
    if (!data.boundaries.length) return;

    const token =
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      console.error(
        "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing.",
      );
      return;
    }

    mapboxgl.accessToken = token;

    const selectedSet = new Set(
      selectedBoundaryKysRef.current,
    );

    const boundaryCollection =
      buildBoundaryCollection(
        data,
        selectedSet,
      );

    const pointCollection =
      buildPointCollection(data);

    const bounds =
      new mapboxgl.LngLatBounds();

    for (const point of data.propertyPoints) {
      bounds.extend([
        Number(point.longitude),
        Number(point.latitude),
      ]);
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-105.235, 20.6],
      zoom: 13,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
      }),
      "top-right",
    );

    map.on("load", () => {
      map.addSource("review-boundaries", {
        type: "geojson",
        data: boundaryCollection,
      });

      map.addLayer({
        id: "review-boundary-fill",
        type: "fill",
        source: "review-boundaries",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "selected"], true],
            "#0284c7",
            "#cbd5e1",
          ],

          "fill-opacity": [
            "case",
            ["==", ["get", "selected"], true],
            0.3,
            0.06,
          ],
        },
      });

      map.addLayer({
        id: "review-boundary-line",
        type: "line",
        source: "review-boundaries",

        paint: {
          "line-color": [
            "case",
            ["==", ["get", "selected"], true],
            "#0369a1",
            "#94a3b8",
          ],

          "line-width": [
            "case",
            ["==", ["get", "selected"], true],
            3,
            1.25,
          ],

          "line-opacity": [
            "case",
            ["==", ["get", "selected"], true],
            1,
            0.65,
          ],
        },
      });

      map.addSource("review-points", {
        type: "geojson",
        data: pointCollection,
      });

      map.addLayer({
        id: "review-points",
        type: "circle",
        source: "review-points",

        paint: {
          "circle-radius": 2.5,
          "circle-color": "#111827",
          "circle-opacity": 0.5,

          "circle-stroke-color":
            "#ffffff",

          "circle-stroke-width": 0.35,
          "circle-stroke-opacity": 0.7,
        },
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 36,
          maxZoom: 15,
          duration: 0,
        });
      }
    });

    map.on(
      "click",
      "review-boundary-fill",
      (event) => {
        const feature =
          event.features?.[0];

        if (!feature?.properties) {
          return;
        }

        const properties =
          feature.properties;

        const name =
          properties.boundaryName ??
          "Boundary";

        const type =
          properties.boundaryType ?? "";

        const count = Number(
          properties.listingCount ?? 0,
        );

        const percent = Number(
          properties.listingPercent ?? 0,
        );

        const selected =
          properties.selected === true ||
          properties.selected === "true";

        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 8,
        })
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="
              min-width:180px;
              font-family:ui-sans-serif,system-ui,sans-serif;
            ">
              <div style="
                font-size:14px;
                font-weight:700;
                color:#0f172a;
                margin-bottom:2px;
              ">
                ${escapeHtml(String(name))}
              </div>

              ${
                type
                  ? `
                    <div style="
                      font-size:11px;
                      color:#64748b;
                      margin-bottom:8px;
                    ">
                      ${escapeHtml(String(type))}
                    </div>
                  `
                  : ""
              }

              <div style="
                font-size:12px;
                color:#334155;
              ">
                <strong>
                  ${count.toLocaleString()}
                </strong>
                MLS observations
              </div>

              <div style="
                margin-top:3px;
                font-size:12px;
                color:#334155;
              ">
                <strong>
                  ${percent.toFixed(2)}%
                </strong>
                of this MLS community
              </div>

              <div style="
                margin-top:8px;
                font-size:11px;
                font-weight:700;
                color:${
                  selected
                    ? "#0369a1"
                    : "#64748b"
                };
              ">
                ${
                  selected
                    ? "Selected in MLS footprint"
                    : "Candidate boundary"
                }
              </div>
            </div>
          `)
          .addTo(map);
      },
    );

    map.on(
      "mouseenter",
      "review-boundary-fill",
      () => {
        map.getCanvas().style.cursor =
          "pointer";
      },
    );

    map.on(
      "mouseleave",
      "review-boundary-fill",
      () => {
        map.getCanvas().style.cursor =
          "";
      },
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  /*
   * Update only the boundary GeoJSON whenever
   * the user checks or unchecks a boundary.
   *
   * The Mapbox map itself is NOT recreated.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const source = map.getSource(
      "review-boundaries",
    ) as mapboxgl.GeoJSONSource | undefined;

    if (!source) return;

    const selectedSet =
      new Set(selectedBoundaryKys);

    source.setData(
      buildBoundaryCollection(
        data,
        selectedSet,
      ),
    );
  }, [data, selectedBoundaryKys]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "500px",
          minHeight: "500px",
        }}
      />
    </div>
  );
}

function buildBoundaryCollection(
  data: BoundaryMapData,
  selectedSet: Set<number>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",

    features: data.boundaries.map(
      (boundary) => ({
        type: "Feature",

        geometry: boundary.geometry,

        properties: {
          boundaryKy:
            boundary.boundaryKy,

          boundaryName:
            boundary.boundaryName,

          boundaryType:
            boundary.boundaryType,

          selected: selectedSet.has(
            boundary.boundaryKy,
          ),

          listingCount:
            boundary.listingCount,

          totalListingCount:
            boundary.totalListingCount,

          listingPercent:
            boundary.listingPercent,

          cumulativeListingPercent:
            boundary.cumulativeListingPercent,

          rank: boundary.rank,
        },
      }),
    ),
  };
}

function buildPointCollection(
  data: BoundaryMapData,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",

    features: data.propertyPoints.map(
      (point) => ({
        type: "Feature",

        geometry: {
          type: "Point",

          coordinates: [
            Number(point.longitude),
            Number(point.latitude),
          ],
        },

        properties: {
          listingKy:
            point.listingKy,

          propertyKy:
            point.propertyKy,

          source:
            point.source,
        },
      }),
    ),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}