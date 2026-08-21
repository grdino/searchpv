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

  nearbyBoundaries: Array<{
    boundaryKy: number;
    boundaryName: string;
    boundaryType: string;
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
  onBoundaryToggle,
}: {
  data: BoundaryMapData;
  selectedBoundaryKys: number[];

  onBoundaryToggle: (
    boundaryKy: number,
    selected: boolean,
  ) => void;
}) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  const selectedBoundaryKysRef =
    useRef<number[]>(selectedBoundaryKys);

  const onBoundaryToggleRef =
    useRef(onBoundaryToggle);

  selectedBoundaryKysRef.current =
    selectedBoundaryKys;

  onBoundaryToggleRef.current =
    onBoundaryToggle;

  useEffect(() => {
    if (!containerRef.current) return;

    if (
      !data.boundaries.length &&
      !data.nearbyBoundaries.length
    ) {
      return;
    }

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

        const boundaryKy =
          Number(
            feature.properties.boundaryKy,
          );

        if (!Number.isFinite(boundaryKy)) {
          return;
        }

        const currentlySelected =
          selectedBoundaryKysRef.current.includes(
            boundaryKy,
          );

        onBoundaryToggleRef.current(
          boundaryKy,
          !currentlySelected,
        );
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
  /*
   * Candidate boundaries already have MLS evidence.
   *
   * nearbyBoundaries contains all additional government
   * polygons returned around the observation extent.
   *
   * Do not add a nearby polygon twice if it is already
   * present in the candidate list.
   */

  const candidateBoundaryKys =
    new Set(
      data.boundaries.map(
        (boundary) =>
          boundary.boundaryKy,
      ),
    );

  const candidateFeatures =
    data.boundaries.map(
      (boundary) => ({
        type: "Feature" as const,

        geometry:
          boundary.geometry,

        properties: {
          boundaryKy:
            boundary.boundaryKy,

          boundaryName:
            boundary.boundaryName,

          boundaryType:
            boundary.boundaryType,

          selected:
            selectedSet.has(
              boundary.boundaryKy,
            ),

          candidate: true,

          listingCount:
            boundary.listingCount,

          totalListingCount:
            boundary.totalListingCount,

          listingPercent:
            boundary.listingPercent,

          cumulativeListingPercent:
            boundary.cumulativeListingPercent,

          rank:
            boundary.rank,
        },
      }),
    );

  const nearbyFeatures =
    data.nearbyBoundaries
      .filter(
        (boundary) =>
          !candidateBoundaryKys.has(
            boundary.boundaryKy,
          ),
      )
      .map(
        (boundary) => ({
          type: "Feature" as const,

          geometry:
            boundary.geometry,

          properties: {
            boundaryKy:
              boundary.boundaryKy,

            boundaryName:
              boundary.boundaryName,

            boundaryType:
              boundary.boundaryType,

            selected:
              selectedSet.has(
                boundary.boundaryKy,
              ),

            candidate: false,

            listingCount: 0,

            totalListingCount: 0,

            listingPercent: 0,

            cumulativeListingPercent: 0,

            rank: null,
          },
        }),
      );

  return {
    type: "FeatureCollection",

    features: [
      ...candidateFeatures,
      ...nearbyFeatures,
    ],
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
