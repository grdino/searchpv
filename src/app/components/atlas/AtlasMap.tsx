"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { usePathname } from "next/navigation";

import { useAtlasState } from "@/lib/atlas/state/AtlasState";
import { buildIdxUrl } from "@/lib/idx";
import { getAtlasDiscoverScene } from "./AtlasDiscoverConfig";

export default function AtlasMap() {
  const pathname = usePathname();
  const isDiscoveryMode =
    pathname === "/atlas/discover" ||
    pathname.startsWith("/atlas/discover/");

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  const listingMarkerRef =
    useRef<mapboxgl.Marker | null>(null);

  const activeListingPopupRef =
    useRef<mapboxgl.Popup | null>(null);

  function getListingDeepLinkCoordinates() {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const latitudeRaw =
      params.get(
        "listingLat",
      );

    const longitudeRaw =
      params.get(
        "listingLng",
      );

    /*
    * IMPORTANT:
    *
    * Number(null) === 0
    *
    * So test for missing/blank URL parameters BEFORE converting
    * them to numbers.
    */
    if (
      !latitudeRaw?.trim() ||
      !longitudeRaw?.trim()
    ) {
      return null;
    }

    const latitude =
      Number(
        latitudeRaw,
      );

    const longitude =
      Number(
        longitudeRaw,
      );

    if (
      !Number.isFinite(
        latitude,
      ) ||
      !Number.isFinite(
        longitude,
      ) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }

  /*
   * Keep the complete government-boundary features available
   * outside the one-time Mapbox load callback.
   */
  const fullBoundaryFeaturesRef =
    useRef<Map<number, any>>(new Map());

  /*
   * Incremented after government-boundary geometry finishes
   * loading. This lets an early URL selection retry once the
   * exact Atlas Area polygons are available.
   */
   const [
     boundaryDataVersion,
     setBoundaryDataVersion,
   ] = useState(0);

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

    // Temporary browser-console access for Atlas diagnostics.
      (window as any).__atlasMap = map;

    if (window.innerWidth >= 768) {
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }),
        "top-right",
      );
    }

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
      // ACTIVE LISTING MAP LAYER
      // ========================================================
      //
      // Active inventory is deliberately understated at broader
      // zoom levels.
      //
      // As the visitor moves closer:
      //
      //   broad view   -> invisible
      //   area view    -> faint dots
      //   neighborhood -> stronger dots
      //   close view   -> price labels
      //
      // The source is intentionally separate from Atlas geography.
      // ========================================================

      fetch(
        "/api/atlas/listing-markers",
        {
          cache: "no-store",
        },
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Unable to load Atlas listing markers.",
            );
          }

          return response.json();
        })
        .then((listingData) => {
          if (
            map.getSource(
              "atlas-active-listings",
            )
          ) {
            return;
          }

          console.log(
            "Atlas active listing markers:",
            listingData.features?.length ?? 0,
          );

          map.addSource(
            "atlas-active-listings",
            {
              type: "geojson",
              data: listingData,
            },
          );

          // ======================================================
          // FAINT INVENTORY DOTS
          // ======================================================

          map.addLayer({
            id:
              "atlas-active-listing-dots",

            type: "circle",

            source:
              "atlas-active-listings",

            slot: "top",

            minzoom: 11.5,

            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],

                11.5,
                1.5,

                12.5,
                2,

                13.5,
                3,

                14.5,
                4,

                16,
                5.5,

                17.5,
                7,
              ],

              "circle-color":
                "#0f766e",

              "circle-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],

                11.5,
                0,

                12,
                0.08,

                12.8,
                0.18,

                13.6,
                0.38,

                14.4,
                0.7,
              ],

              "circle-stroke-color":
                "#ffffff",

              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],

                12,
                0,

                13.5,
                0.5,

                14.5,
                1,
              ],

              "circle-stroke-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],

                12,
                0,

                13.5,
                0.3,

                14.5,
                0.8,
              ],
            },
          });

          // ======================================================
          // PRICE MARKERS
          // ======================================================

          map.addLayer({
            id:
              "atlas-active-listing-prices",

            type: "symbol",

            source:
              "atlas-active-listings",

            slot: "top",

            minzoom: 14.2,

            layout: {
              "text-field": [
                "get",
                "label",
              ],

              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],

                14.2,
                10,

                15,
                11,

                16,
                12,

                17.5,
                13,
              ],

              "text-font": [
                "DIN Pro Medium",
                "Arial Unicode MS Regular",
              ],

              "text-allow-overlap":
                true,

              "text-ignore-placement":
                true,

              "text-padding":
                5,
            },

            paint: {
              "text-color":
                "#0f172a",

              "text-halo-color":
                "rgba(255,255,255,0.96)",

              "text-halo-width":
                4,

              "text-halo-blur":
                1,

              "text-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],

                14.2,
                0,

                14.6,
                0.65,

                15,
                1,
              ],
            },
          });

          // ======================================================
          // ACTIVE LISTING CLICK / POPUP
          // ======================================================

          function formatPopupPrice(
            value: unknown,
          ) {
            const price =
              Number(value);

            if (
              !Number.isFinite(price)
            ) {
              return "";
            }

            return new Intl.NumberFormat(
              "en-US",
              {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              },
            ).format(price);
          }

          function formatRange(
            minimum: unknown,
            maximum: unknown,
            suffix = "",
          ) {
            const min =
              Number(minimum);

            const max =
              Number(maximum);

            if (
              !Number.isFinite(min) &&
              !Number.isFinite(max)
            ) {
              return "";
            }

            if (
              Number.isFinite(min) &&
              Number.isFinite(max)
            ) {
              if (min === max) {
                return `${min}${suffix}`;
              }

              return `${min}–${max}${suffix}`;
            }

            if (
              Number.isFinite(min)
            ) {
              return `${min}${suffix}`;
            }

            return `${max}${suffix}`;
          }

          function createListingPopup(
            feature: any,
          ) {
            const properties =
              feature?.properties ?? {};

            const coordinates =
              feature?.geometry
                ?.coordinates;

            if (
              !Array.isArray(
                coordinates,
              ) ||
              coordinates.length <
                2
            ) {
              return;
            }

            const longitude =
              Number(
                coordinates[0],
              );

            const latitude =
              Number(
                coordinates[1],
              );

            if (
              !Number.isFinite(
                longitude,
              ) ||
              !Number.isFinite(
                latitude,
              )
            ) {
              return;
            }

            const listingCount =
              Math.max(
                1,
                Number(
                  properties.listing_count,
                ) || 1,
              );

            const developmentName =
              String(
                properties.development_name ??
                  "",
              ).trim();

            const address =
              String(
                properties.address ??
                  "",
              ).trim();

            const mlsIds =
              String(
                properties.mls_ids ??
                  "",
              ).trim();

            const minPrice =
              Number(
                properties.min_price,
              );

            const maxPrice =
              Number(
                properties.max_price,
              );

            /*
            * Remove any previous Active Listing popup.
            */
            activeListingPopupRef.current?.remove();

            const popupContent =
              document.createElement(
                "div",
              );

            Object.assign(
              popupContent.style,
              {
                minWidth: "220px",
                maxWidth: "285px",
                padding: "4px 2px 3px",
                color: "#0f172a",
                fontFamily: "inherit",
              },
            );

            /*
            * EYEBROW
            */
            const eyebrow =
              document.createElement(
                "div",
              );

            eyebrow.textContent =
              listingCount > 1
                ? `${listingCount} ACTIVE LISTINGS`
                : "ACTIVE LISTING";

            Object.assign(
              eyebrow.style,
              {
                color: "#078a83",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "0.09em",
                textTransform:
                  "uppercase",
              },
            );

            popupContent.appendChild(
              eyebrow,
            );

            /*
            * DEVELOPMENT / ADDRESS
            */
            const title =
              document.createElement(
                "div",
              );

            title.textContent =
              developmentName ||
              address ||
              "SearchPV Property";

            Object.assign(
              title.style,
              {
                marginTop: "4px",
                fontSize: "16px",
                fontWeight: "900",
                lineHeight: "1.2",
              },
            );

            popupContent.appendChild(
              title,
            );

            /*
            * If we have both development and address, show address
            * quietly underneath.
            */
            if (
              developmentName &&
              address
            ) {
              const addressLine =
                document.createElement(
                  "div",
                );

              addressLine.textContent =
                address;

              Object.assign(
                addressLine.style,
                {
                  marginTop: "3px",
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: "600",
                  lineHeight: "1.25",
                },
              );

              popupContent.appendChild(
                addressLine,
              );
            }

            /*
            * PRICE
            */
            const priceLine =
              document.createElement(
                "div",
              );

            if (
              listingCount > 1 &&
              Number.isFinite(
                minPrice,
              ) &&
              Number.isFinite(
                maxPrice,
              )
            ) {
              priceLine.textContent =
                minPrice === maxPrice
                  ? formatPopupPrice(
                      minPrice,
                    )
                  : `${formatPopupPrice(
                      minPrice,
                    )} – ${formatPopupPrice(
                      maxPrice,
                    )}`;
            } else if (
              Number.isFinite(
                minPrice,
              )
            ) {
              priceLine.textContent =
                formatPopupPrice(
                  minPrice,
                );
            }

            if (
              priceLine.textContent
            ) {
              Object.assign(
                priceLine.style,
                {
                  marginTop: "8px",
                  fontSize: "18px",
                  fontWeight: "900",
                  lineHeight: "1.1",
                },
              );

              popupContent.appendChild(
                priceLine,
              );
            }

            /*
            * PROPERTY DETAIL RANGE
            */
            const details: string[] =
              [];

            const bedRange =
              formatRange(
                properties.min_beds,
                properties.max_beds,
                " BR",
              );

            const bathRange =
              formatRange(
                properties.min_baths,
                properties.max_baths,
                " BA",
              );

            const sqftRange =
              formatRange(
                properties.min_sqft,
                properties.max_sqft,
                " ft²",
              );

            if (bedRange) {
              details.push(
                bedRange,
              );
            }

            if (bathRange) {
              details.push(
                bathRange,
              );
            }

            if (sqftRange) {
              details.push(
                sqftRange,
              );
            }

            if (
              details.length > 0
            ) {
              const detailLine =
                document.createElement(
                  "div",
                );

              detailLine.textContent =
                details.join(
                  " · ",
                );

              Object.assign(
                detailLine.style,
                {
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: "700",
                  lineHeight: "1.35",
                },
              );

              popupContent.appendChild(
                detailLine,
              );
            }

            /*
            * IDX BUTTON
            */
            if (mlsIds) {
              const idxUrl =
                buildIdxUrl(
                  mlsIds,
                );

              const action =
                document.createElement(
                  "a",
                );

              action.href =
                idxUrl;

              action.textContent =
                listingCount > 1
                  ? `View ${listingCount} Listings`
                  : "View Listing";

              Object.assign(
                action.style,
                {
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",

                  width: "100%",

                  marginTop: "12px",
                  minHeight: "38px",

                  padding:
                    "8px 12px",

                  border:
                    "1px solid #0f172a",

                  borderRadius:
                    "999px",

                  background:
                    "#0f172a",

                  color:
                    "#ffffff",

                  fontSize: "12px",
                  fontWeight: "850",
                  lineHeight: "1.1",

                  textDecoration:
                    "none",

                  boxSizing:
                    "border-box",
                },
              );

              /*
              * Prevent the IDX link itself from interacting with
              * the underlying Mapbox map.
              */
              action.addEventListener(
                "click",
                (
                  event,
                ) => {
                  event.stopPropagation();
                },
              );

              popupContent.appendChild(
                action,
              );
            }

            const popup =
              new mapboxgl.Popup({
                offset: 14,
                closeButton: true,
                closeOnClick: true,
                maxWidth: "300px",
              })
                .setLngLat([
                  longitude,
                  latitude,
                ])
                .setDOMContent(
                  popupContent,
                )
                .addTo(map);

            activeListingPopupRef.current =
              popup;

            /*
              * Keep popup clear of Atlas controls AND the BottomSheet.
              *
              * Two animation frames allow Mapbox to fully position
              * and size the popup before we measure it.
              */
              requestAnimationFrame(
                () => {
                  requestAnimationFrame(
                    () => {
                      const popupElement =
                        popup.getElement();

                      if (!popupElement) {
                        return;
                      }

                      const popupRect =
                        popupElement.getBoundingClientRect();

                      /*
                      * Safe visible vertical area.
                      */
                      const safeTop =
                        window.innerWidth < 768
                          ? 320
                          : 310;

                      const safeBottom =
                        window.innerHeight *
                        0.58;

                      let panY = 0;

                      /*
                      * Popup is too high:
                      * move map content downward.
                      */
                      if (
                        popupRect.top <
                        safeTop
                      ) {
                        panY =
                          -(
                            safeTop -
                            popupRect.top
                          );
                      }

                      /*
                      * Popup is too low:
                      * move map content upward.
                      *
                      * This can override the first adjustment if needed.
                      */
                      if (
                        popupRect.bottom >
                        safeBottom
                      ) {
                        panY =
                          popupRect.bottom -
                          safeBottom;
                      }

                      if (
                        Math.abs(panY) >
                        2
                      ) {
                        map.panBy(
                          [
                            0,
                            panY,
                          ],
                          {
                            duration: 550,
                          },
                        );
                      }
                    },
                  );
                },
              );

            popup.on(
              "close",
              () => {
                if (
                  activeListingPopupRef.current ===
                  popup
                ) {
                  activeListingPopupRef.current =
                    null;
                }
              },
            );
          }

          /*
          * One click handler handles both dots and price labels.
          *
          * Query price labels first, then dots.
          */
          map.on(
            "click",
            (
              event,
            ) => {
              if (
                modeRef.current !==
                "explore"
              ) {
                return;
              }

              const features =
                map.queryRenderedFeatures(
                  event.point,
                  {
                    layers: [
                      "atlas-active-listing-prices",
                      "atlas-active-listing-dots",
                    ],
                  },
                );

              const listingFeature =
                features?.[0];

              if (
                !listingFeature
              ) {
                return;
              }

              /*
              * Mark this DOM event so the government-boundary
              * handler below can recognize that the listing owns
              * this click.
              */
              (
                event.originalEvent as any
              ).__atlasListingClick =
                true;

              createListingPopup(
                listingFeature,
              );
            },
          );

          /*
          * Desktop pointer feedback.
          */
          for (
            const layerId of [
              "atlas-active-listing-prices",
              "atlas-active-listing-dots",
            ]
          ) {
            map.on(
              "mouseenter",
              layerId,
              () => {
                if (
                  modeRef.current ===
                  "explore"
                ) {
                  map.getCanvas().style.cursor =
                    "pointer";
                }
              },
            );

            map.on(
              "mouseleave",
              layerId,
              () => {
                if (
                  modeRef.current ===
                  "explore"
                ) {
                  map.getCanvas().style.cursor =
                    "";
                }
              },
            );
          }
        })
        .catch((error) => {
          console.error(
            "Atlas active listing marker error:",
            error,
          );
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

            setBoundaryDataVersion(
              (currentVersion) =>
                currentVersion + 1,
            );

            // Discover Mode must not start its clock until the exact
            // boundary geometry used by its flights is available.
            document.documentElement.dataset.atlasDiscoverReady =
              "true";

            window.dispatchEvent(
              new Event("atlas-discover-ready"),
            );

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
              async (event) => {
              /*
                * A listing dot / price marker owns this click.
                *
                * Do not also select the government boundary underneath.
                */
                if (
                  (
                    event.originalEvent as any
                  )?.__atlasListingClick
                ) {
                  return;
                }

                const listingFeatures =
                  map.queryRenderedFeatures(
                    event.point,
                    {
                      layers: [
                        "atlas-active-listing-prices",
                        "atlas-active-listing-dots",
                      ].filter(
                        (layerId) =>
                          Boolean(
                            map.getLayer(
                              layerId,
                            ),
                          ),
                      ),
                    },
                  );

                if (
                  listingFeatures.length >
                  0
                ) {
                  return;
                }
                const originalTarget =
                  event.originalEvent
                    ?.target as
                    | HTMLElement
                    | null;

                if (
                  originalTarget?.closest(
                    ".mapboxgl-marker, .mapboxgl-popup",
                  )
                ) {
                  return;
                }

                const clickedFeature =
                  event.features?.[0] as any;

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

      activeListingPopupRef.current?.remove();
      activeListingPopupRef.current =
        null;

      delete document.documentElement.dataset
        .atlasDiscoverReady;

      map.remove();
    };
  }, []);

  // ============================================================
  // IDX PROPERTY DEEP-LINK MARKER
  // ============================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const listingCoordinates =
      getListingDeepLinkCoordinates();

    if (
      !listingCoordinates
    ) {
      return;
    }

    const {
      latitude,
      longitude,
    } =
      listingCoordinates;

    const listingTitle =
      params.get("listingTitle")?.trim() ||
      "SearchPV property";

    const listingMls =
      params.get("listingMls")?.trim() || "";

    const developmentName =
      params.get("development")?.trim() || "";

    function validatedListingUrl() {
      const rawUrl =
        params.get("listingUrl")?.trim();

      if (!rawUrl) {
        return "";
      }

      try {
        const parsedUrl = new URL(rawUrl);

        if (
          parsedUrl.protocol !== "https:" ||
          parsedUrl.hostname.toLowerCase() !==
            "idx.searchpv.com"
        ) {
          return "";
        }

        return parsedUrl.toString();
      } catch {
        return "";
      }
    }

    function buildMarketIntelligenceUrl(
      status:
        | "active"
        | "pending",
    ) {
      if (!developmentName) {
        return "";
      }

      const basePath =
        status === "active"
          ? "/market-intelligence/active-listings"
          : "/market-intelligence/pending-sales";

      const marketUrl = new URL(
        basePath,
        window.location.origin,
      );

      const zone =
        params.get("mlsZone")?.trim();

      const area =
        params.get("mlsArea")?.trim();

      const community =
        params.get(
          "mlsCommunity",
        )?.trim();

      /*
      * Puerto Vallarta is the default zone on the
      * Market Intelligence pages, so its zone
      * parameter is intentionally omitted.
      *
      * All other zones remain explicit in the URL.
      */
      if (
        zone &&
        zone !== "Puerto Vallarta"
      ) {
        marketUrl.searchParams.set(
          "zone",
          zone,
        );
      }

      if (area) {
        marketUrl.searchParams.set(
          "area",
          area,
        );
      }

      if (community) {
        marketUrl.searchParams.set(
          "community",
          community,
        );
      }

      marketUrl.searchParams.set(
        "development",
        developmentName.toUpperCase(),
      );

      /*
      * Skip the large filter header when arriving from Atlas
      * and land directly on the Market Intelligence summary.
      */
      marketUrl.hash =
        status === "active"
          ? "active-listing-history"
          : "pending-listing-history";

      return marketUrl.toString();
    }

    function createActionLink(
      label: string,
      href: string,
      primary = false,
    ) {
      const link = document.createElement("a");

      link.href = href;
      link.textContent = label;

      Object.assign(link.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "36px",
        padding: "8px 12px",
        borderRadius: "999px",
        border: primary
          ? "1px solid #0f172a"
          : "1px solid #cbd5e1",
        background: primary
          ? "#0f172a"
          : "#ffffff",
        color: primary
          ? "#ffffff"
          : "#0f172a",
        fontSize: "12px",
        fontWeight: "800",
        lineHeight: "1.1",
        textDecoration: "none",
        whiteSpace: "nowrap",
      });

      return link;
    }

    function addListingMarker() {
      if (
        listingMarkerRef.current ||
        mapRef.current !== map
      ) {
        return;
      }

      const markerElement =
        document.createElement("button");

      markerElement.type = "button";
      markerElement.setAttribute(
        "aria-label",
        `Open ${listingTitle}`,
      );

      Object.assign(markerElement.style, {
        width: "34px",
        height: "34px",
        padding: "0",
        border: "4px solid #ffffff",
        borderRadius: "50% 50% 50% 0",
        background:
          "linear-gradient(135deg, #0f172a 0%, #078a83 100%)",
        boxShadow:
          "0 6px 18px rgba(15, 23, 42, 0.35)",
        cursor: "pointer",
        transform: "rotate(-45deg)",
      });

      const markerCenter =
        document.createElement("span");

      Object.assign(markerCenter.style, {
        position: "absolute",
        inset: "7px",
        borderRadius: "50%",
        background: "#ffffff",
      });

      markerElement.appendChild(markerCenter);

      const popupContent =
        document.createElement("div");

      Object.assign(popupContent.style, {
        minWidth: "230px",
        maxWidth: "290px",
        padding: "5px 3px 3px",
        color: "#0f172a",
        fontFamily: "inherit",
      });

      const eyebrow = document.createElement("div");

      eyebrow.textContent = listingMls
        ? `SEARCHPV PROPERTY · MLS ${listingMls}`
        : "SEARCHPV PROPERTY";

      Object.assign(eyebrow.style, {
        marginBottom: "5px",
        color: "#078a83",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "0.08em",
      });

      const title = document.createElement("div");

      title.textContent = listingTitle;

      Object.assign(title.style, {
        fontSize: "15px",
        fontWeight: "900",
        lineHeight: "1.25",
      });

      popupContent.appendChild(eyebrow);
      popupContent.appendChild(title);

      if (developmentName) {
        const development =
          document.createElement("div");

        development.textContent = developmentName;

        Object.assign(development.style, {
          marginTop: "4px",
          color: "#64748b",
          fontSize: "12px",
          fontWeight: "700",
        });

        popupContent.appendChild(development);
      }

      const actions = document.createElement("div");

      Object.assign(actions.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "7px",
        marginTop: "12px",
      });

      const listingUrl =
        validatedListingUrl();

      const activeListingsUrl =
        buildMarketIntelligenceUrl(
          "active",
        );

const pendingListingsUrl =
  buildMarketIntelligenceUrl(
    "pending",
  );

      if (listingUrl) {
        actions.appendChild(
          createActionLink(
            "View IDX Listing",
            listingUrl,
            true,
          ),
        );
      }

      if (
        developmentName &&
        (
          activeListingsUrl ||
          pendingListingsUrl
        )
      ) {
        const marketSection =
          document.createElement(
            "div",
          );

        Object.assign(
          marketSection.style,
          {
            width: "100%",
            marginTop: "4px",
          },
        );

        const marketHeading =
          document.createElement(
            "div",
          );

        marketHeading.textContent =
          `Explore ${developmentName}`;

        Object.assign(
          marketHeading.style,
          {
            marginBottom: "7px",
            color: "#475569",
            fontSize: "11px",
            fontWeight: "800",
          },
        );

        marketSection.appendChild(
          marketHeading,
        );

        const marketActions =
          document.createElement(
            "div",
          );

        Object.assign(
          marketActions.style,
          {
            display: "flex",
            flexWrap: "wrap",
            gap: "7px",
          },
        );

        if (activeListingsUrl) {
          marketActions.appendChild(
            createActionLink(
              "Active Listings",
              activeListingsUrl,
            ),
          );
        }

        if (pendingListingsUrl) {
          marketActions.appendChild(
            createActionLink(
              "Pending Sales",
              pendingListingsUrl,
            ),
          );
        }

        marketSection.appendChild(
          marketActions,
        );

        actions.appendChild(
          marketSection,
        );
      }

      if (actions.childElementCount > 0) {
        popupContent.appendChild(actions);
      }

      const popup = new mapboxgl.Popup({
        offset: 26,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "310px",
      }).setDOMContent(popupContent);

      const currentMap = map;

        if (!currentMap) {
          return;
        }

        listingMarkerRef.current =
          new mapboxgl.Marker({
            element: markerElement,
            anchor: "bottom",
          })
            .setLngLat([
              longitude,
              latitude,
            ])
            .setPopup(popup)
            .addTo(currentMap);

        /*
        * A real IDX property deep link owns the camera.
        */
        currentMap.flyTo({
          center: [
            longitude,
            latitude,
          ],
          zoom: 15.5,
          pitch: 45,
          duration: 1400,
          essential: true,
        });
    }

    if (map.loaded()) {
      addListingMarker();
    } else {
      map.once("load", addListingMarker);
    }

    return () => {
      map.off("load", addListingMarker);

      listingMarkerRef.current?.remove();
      listingMarkerRef.current = null;
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

    const discoverScene =
      getAtlasDiscoverScene(
        popularAreaSelection.footprintKey,
      );

        if (discoverScene) {
          const center =
            bounds.getCenter();

          /*
          * The BottomSheet occupies a large part of the lower screen.
          * Padding makes Mapbox treat the visible map area above the
          * sheet as the effective viewport.
          */
          const bottomPadding =
            Math.round(
              window.innerHeight *
                0.44,
            );

          map.flyTo({
            center: [
              center.lng,
              center.lat,
            ],

            padding: {
              top: 120,
              right: 50,
              bottom: bottomPadding,
              left: 50,
            },

            /*
            * Don't zoom quite as tightly.
            * The highlighted footprint should remain comfortably
            * visible above the BottomSheet.
            */
            zoom:
              discoverScene.camera.zoom,

            pitch:
              discoverScene.camera.pitch,

            /*
            * A little more rotation makes the coastline appear to
            * sweep through the viewport during the flight.
            */
            bearing:
              discoverScene.camera.bearing,

            /*
            * A larger curve makes the flight feel less like a direct
            * zoom and more like a traveling camera move.
            */
            curve:
              discoverScene.camera.curve,

            duration:
              discoverScene.camera.duration,

            essential: true,
          });

          return;
        }

    /*
    * Normal Popular Area behavior remains unchanged.
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

        duration: 1800,

        essential: true,
      },
    );
  }, [
    popularAreaSelection,
    boundaryDataVersion,
  ]);

  /*
   * A real user interaction ends the automatic tour. Stop any
   * in-progress Mapbox animation and leave Atlas at its current
   * live position and selection.
   */
  useEffect(() => {
    const stopDiscoverFlight = () => {
      mapRef.current?.stop();
    };

    window.addEventListener(
      "atlas-discover-cancel",
      stopDiscoverFlight,
    );

    return () => {
      window.removeEventListener(
        "atlas-discover-cancel",
        stopDiscoverFlight,
      );
    };
  }, []);

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

        if (
          !getListingDeepLinkCoordinates()
        ) {
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
        }

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

            if (
              !getListingDeepLinkCoordinates()
            ) {
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
            }
            

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
        !getListingDeepLinkCoordinates() &&
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

      {!isDiscoveryMode ? (
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
            className="px-2.5 py-2 text-[11px] md:px-3.5 md:py-[9px] md:text-xs"
            onClick={
              startCustomMarket
            }
            style={{
              border:
                "1px solid rgba(15,23,42,0.14)",

              borderRadius:
                999,

              background:
                "rgba(255,255,255,0.94)",

              boxShadow:
                "0 5px 18px rgba(15,23,42,0.12)",

              backdropFilter:
                "blur(12px)",

              color:
                "#334155",

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
      ) : null}
    </>
  );
}