"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAtlasState,
  type AtlasPopularArea,
} from "@/lib/atlas/state/AtlasState";

/*
 * ============================================================
 * ZONA ROMÁNTICA DISCOVER FOOTPRINT
 * ============================================================
 *
 * IMPORTANT:
 *
 * The boundaryKys below MUST be the same boundary IDs used by
 * the existing Emiliano Zapata Popular Area button.
 *
 * We will replace this placeholder after confirming those IDs.
 */
const ZR_DISCOVER_AREA: AtlasPopularArea = {
  footprintKey:
    "lifestyle-emiliano-zapata-zr",

  displayName:
    "Emiliano Zapata / Zona Romántica",

  boundaryKys: [437],
};

export default function AtlasDiscoverScene() {
  const {
    selectPopularArea,
  } = useAtlasState();

  const [
    sceneVisible,
    setSceneVisible,
  ] = useState(false);

  const [
    artworkVisible,
    setArtworkVisible,
  ] = useState(false);

  const [
    messageVisible,
    setMessageVisible,
  ] = useState(false);

  const startedRef =
    useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    /*
     * --------------------------------------------------------
     * 1. Let the opening Atlas view breathe very briefly.
     * --------------------------------------------------------
     */

    const artworkStartTimer =
        window.setTimeout(
            () => {
            // Mount the Discover layer first at opacity 0.
            setSceneVisible(true);

            // Give the browser a frame to render it,
            // then begin the actual fade.
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                setArtworkVisible(true);
                });
            });
            },
            1100,
        );

    /*
     * --------------------------------------------------------
     * 2. START THE ACTUAL ATLAS LIFESTYLE FLIGHT.
     *
     * This is the connection that was missing before.
     * AtlasMap will see the lifestyle footprintKey and run
     * its existing cinematic transition.
     * --------------------------------------------------------
     */

    const flightTimer =
      window.setTimeout(
        () => {
          selectPopularArea(
            ZR_DISCOVER_AREA,
          );
        },
        450,
      );

    /*
     * --------------------------------------------------------
     * 3. Lifestyle wording appears after motion has started.
     * --------------------------------------------------------
     */

    const messageTimer =
      window.setTimeout(
        () => {
          setMessageVisible(
            true,
          );
        },
        1850,
      );

    /*
     * --------------------------------------------------------
     * 4. Begin dissolving the artwork.
     *
     * The real Atlas map should increasingly become the hero
     * while the camera is still moving.
     * --------------------------------------------------------
     */

    const artworkFadeTimer =
      window.setTimeout(
        () => {
          setArtworkVisible(
            false,
          );
        },
        4300,
      );

    /*
     * --------------------------------------------------------
     * 5. Lifestyle wording lingers slightly longer.
     * --------------------------------------------------------
     */

    const messageFadeTimer =
      window.setTimeout(
        () => {
          setMessageVisible(
            false,
          );
        },
        5350,
      );

    /*
     * --------------------------------------------------------
     * 6. Remove the visual layer completely.
     *
     * NOTE:
     * We do NOT clear popularAreaSelection here.
     *
     * Atlas remains selected on Zona Romántica, allowing the
     * existing footprint, BottomSheet and listing markers to
     * remain active.
     * --------------------------------------------------------
     */

    const removeTimer =
      window.setTimeout(
        () => {
          setSceneVisible(
            false,
          );
        },
        6900,
      );

    return () => {
      window.clearTimeout(
        artworkStartTimer,
      );

      window.clearTimeout(
        flightTimer,
      );

      window.clearTimeout(
        messageTimer,
      );

      window.clearTimeout(
        artworkFadeTimer,
      );

      window.clearTimeout(
        messageFadeTimer,
      );

      window.clearTimeout(
        removeTimer,
      );
    };
  }, [selectPopularArea]);

  if (!sceneVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position:
          "absolute",

        inset: 0,

        zIndex: 5,

        overflow:
          "hidden",

        pointerEvents:
          "none",
      }}
    >
      {/* ====================================================
          ARTWORK

          Deliberately much lighter than the first version.
          Atlas should remain visible through the lifestyle
          imagery.
          ==================================================== */}

      <div
        style={{
          position:
            "absolute",

          inset: 0,

          backgroundImage:
            'url("/atlas/discover/zona-romantica.png")',

          backgroundSize:
            "cover",

          backgroundPosition:
            "center center",

          opacity:
            artworkVisible
              ? 0.34
              : 0,

          transform:
            artworkVisible
              ? "scale(1.02)"
              : "scale(1.065)",

          transition:
            [
              "opacity 2100ms ease-in-out",
              "transform 6500ms cubic-bezier(0.16, 0.72, 0.22, 1)",
            ].join(", "),

          filter:
            "saturate(0.88) contrast(0.94)",
        }}
      />

      {/* ====================================================
          SOFT LEFT-SIDE LIGHTING

          Helps dissolve the poster into the actual map.
          ==================================================== */}

      <div
        style={{
          position:
            "absolute",

          inset: 0,

          opacity:
            artworkVisible
              ? 1
              : 0,

          transition:
            "opacity 1900ms ease-in-out",

          background:
            `
            linear-gradient(
              90deg,
              rgba(255,255,255,0.52) 0%,
              rgba(255,255,255,0.20) 28%,
              rgba(255,255,255,0.02) 58%,
              rgba(255,255,255,0.00) 100%
            )
            `,
        }}
      />

      {/* ====================================================
          BOTTOM DISSOLVE
          ==================================================== */}

      <div
        style={{
          position:
            "absolute",

          left: 0,
          right: 0,
          bottom: 0,

          height:
            "42%",

          opacity:
            artworkVisible
              ? 1
              : 0,

          transition:
            "opacity 1800ms ease-in-out",

          background:
            `
            linear-gradient(
              to bottom,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.16) 38%,
              rgba(255,255,255,0.76) 100%
            )
            `,
        }}
      />

      {/* ====================================================
          DISCOVER WORDING
          ==================================================== */}

      <div
        style={{
          position:
            "absolute",

          left:
            "clamp(28px, 5.8vw, 92px)",

          top:
            "clamp(285px, 37vh, 390px)",

          width:
            "min(390px, 74vw)",

          opacity:
            messageVisible
              ? 1
              : 0,

          transform:
            messageVisible
              ? "translateY(0px)"
              : "translateY(12px)",

          transition:
            [
              "opacity 1500ms ease-in-out",
              "transform 1900ms cubic-bezier(0.16, 0.72, 0.22, 1)",
            ].join(", "),
        }}
      >
        <div
          style={{
            color:
              "#0f766e",

            fontSize:
              10,

            fontWeight:
              900,

            letterSpacing:
              "0.17em",

            textTransform:
              "uppercase",
          }}
        >
          Discover
        </div>

        <div
          style={{
            marginTop: 5,

            color:
              "#0f172a",

            fontSize:
              "clamp(27px, 3.6vw, 44px)",

            fontWeight:
              850,

            lineHeight:
              1.02,

            letterSpacing:
              "-0.035em",

            textShadow:
              "0 2px 18px rgba(255,255,255,0.92)",
          }}
        >
          Zona Romántica
        </div>

        <div
          style={{
            marginTop: 12,

            color:
              "#1e293b",

            fontSize:
              "clamp(15px, 1.5vw, 19px)",

            fontWeight:
              750,

            lineHeight:
              1.42,

            textShadow:
              "0 2px 14px rgba(255,255,255,0.96)",
          }}
        >
          Beach days.
          <br />

          Walkable streets.
          <br />

          Late nights.
        </div>

        <div
          style={{
            marginTop: 11,

            color:
              "#475569",

            fontSize: 13,

            fontWeight:
              700,

            lineHeight:
              1.4,

            textShadow:
              "0 2px 12px rgba(255,255,255,0.96)",
          }}
        >
          Easy walk to Los Muertos Beach.
        </div>
      </div>
    </div>
  );
}