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

const BEACH_LIFE_AREA: AtlasPopularArea = {
  /*
   * A special footprint key lets AtlasMap know this selection
   * came from the cinematic homepage experience rather than a
   * normal Popular Area click.
   */
  footprintKey:
    "lifestyle-emiliano-zapata-zr",

  displayName:
    "Emiliano Zapata / Zona Romántica",

  boundaryKys: [
    437,
  ],
};

export default function AtlasLifestyle() {
  const {
    contextEntity,
    analysisEntity,
    selectedBoundary,
    popularAreaSelection,

    mode,

    selectPopularArea,
  } = useAtlasState();

  const [
    visible,
    setVisible,
  ] =
    useState(false);

  /*
   * selectPopularArea is recreated when AtlasState renders.
   * Keep the current version in a ref so the idle timer itself
   * does not restart because of normal React renders.
   */
  const selectPopularAreaRef =
    useRef(
      selectPopularArea,
    );

  useEffect(() => {
    selectPopularAreaRef.current =
      selectPopularArea;
  }, [
    selectPopularArea,
  ]);

  const cancelledRef =
    useRef(false);

  const storyStartedRef =
    useRef(false);

  const showTimerRef =
    useRef<number | null>(
      null,
    );

  const selectTimerRef =
    useRef<number | null>(
      null,
    );

  const hideTimerRef =
    useRef<number | null>(
      null,
    );

  function clearTimers() {
    if (
      showTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        showTimerRef.current,
      );

      showTimerRef.current =
        null;
    }

    if (
      selectTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        selectTimerRef.current,
      );

      selectTimerRef.current =
        null;
    }

    if (
      hideTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        hideTimerRef.current,
      );

      hideTimerRef.current =
        null;
    }
  }

  function cancelLifestyle() {
    if (
      cancelledRef.current
    ) {
      return;
    }

    cancelledRef.current =
      true;

    clearTimers();

    setVisible(
      false,
    );
  }

  /*
   * ==========================================================
   * IDLE DISCOVERY EXPERIENCE
   * ==========================================================
   */

  useEffect(() => {
    /*
     * Never run the cinematic introduction on a deep-linked
     * Atlas URL.
     *
     * Listing/property links and future Atlas links should own
     * the initial experience completely.
     */
    if (
      window.location.search
        .trim()
        .length > 0
    ) {
      cancelledRef.current =
        true;

      return;
    }

    /*
     * Respect the operating-system reduced-motion preference.
     */
    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      cancelledRef.current =
        true;

      return;
    }

    /*
     * ----------------------------------------------------------
     * USER INTERACTION
     * ----------------------------------------------------------
     *
     * The automated homepage experience is only for somebody
     * who is passively looking at Atlas.
     *
     * As soon as they take control, Atlas stays in normal
     * Explorer mode.
     */

    const stopForPointer =
      () => {
        cancelLifestyle();
      };

    const stopForWheel =
      () => {
        cancelLifestyle();
      };

    const stopForKeyboard =
      () => {
        cancelLifestyle();
      };

    window.addEventListener(
      "pointerdown",
      stopForPointer,
      {
        capture: true,
        passive: true,
      },
    );

    window.addEventListener(
      "wheel",
      stopForWheel,
      {
        capture: true,
        passive: true,
      },
    );

    window.addEventListener(
      "keydown",
      stopForKeyboard,
      {
        capture: true,
      },
    );

    /*
     * ----------------------------------------------------------
     * 6.5 SECONDS — REVEAL BEACH LIFE
     * ----------------------------------------------------------
     */

    showTimerRef.current =
      window.setTimeout(
        () => {
          if (
            cancelledRef.current
          ) {
            return;
          }

          storyStartedRef.current =
            true;

          setVisible(
            true,
          );

          /*
           * ----------------------------------------------------
           * 1 SECOND LATER — START THE ATLAS TRANSITION
           * ----------------------------------------------------
           */

          selectTimerRef.current =
            window.setTimeout(
              () => {
                if (
                  cancelledRef.current
                ) {
                  return;
                }

                selectPopularAreaRef.current(
                  BEACH_LIFE_AREA,
                );
              },
              1500,
            );

          /*
           * ----------------------------------------------------
           * FADE STORY AWAY AFTER THE MAP HAS STARTED MOVING
           * ----------------------------------------------------
           */

          hideTimerRef.current =
            window.setTimeout(
              () => {
                setVisible(
                  false,
                );
              },
              6500,
            );
        },
        4000,
      );

    return () => {
      clearTimers();

      window.removeEventListener(
        "pointerdown",
        stopForPointer,
        {
          capture: true,
        },
      );

      window.removeEventListener(
        "wheel",
        stopForWheel,
        {
          capture: true,
        },
      );

      window.removeEventListener(
        "keydown",
        stopForKeyboard,
        {
          capture: true,
        },
      );
    };
  }, []);

  /*
   * ==========================================================
   * CANCEL IF ANOTHER ATLAS STATE TAKES OVER
   * ==========================================================
   *
   * This catches programmatic selections as well as UI paths
   * that may not originate from a pointer event.
   *
   * Once OUR lifestyle story has started, its own Popular Area
   * selection is allowed through.
   */

  useEffect(() => {
    if (
      storyStartedRef.current
    ) {
      return;
    }

    const atlasAlreadyInUse =
      Boolean(
        contextEntity ||
        analysisEntity ||
        selectedBoundary ||
        popularAreaSelection ||
        mode !== "explore",
      );

    if (
      atlasAlreadyInUse
    ) {
      cancelLifestyle();
    }
  }, [
    contextEntity,
    analysisEntity,
    selectedBoundary,
    popularAreaSelection,
    mode,
  ]);

  /*
   * ==========================================================
   * STORY PRESENTATION
   * ==========================================================
   */

  return (
    <div
      aria-hidden={
        !visible
      }
      style={{
        position:
          "absolute",

        left:
          18,

        right:
          18,

        /*
         * Keeps the story above the resting BottomSheet on
         * mobile and desktop.
         */
        bottom:
          150,

        zIndex:
          28,

        display:
          "flex",

        justifyContent:
          "center",

        pointerEvents:
          "none",

        opacity:
          visible
            ? 1
            : 0,

        transform:
          visible
            ? "translateY(0)"
            : "translateY(4px)",

        transition:
           "opacity 1800ms ease-in-out, transform 2200ms ease-in-out",
      }}
    >
      <div
        style={{
          width:
            "min(100%, 430px)",

          position:
            "relative",

          overflow:
            "hidden",

          border:
            "1px solid rgba(255,255,255,0.42)",

          borderRadius:
            22,

          padding:
            "17px 18px 18px",

          background:
            "linear-gradient(135deg, rgba(11,43,58,0.90), rgba(15,118,110,0.78))",

          boxShadow:
            "0 18px 45px rgba(15,23,42,0.28)",

          backdropFilter:
            "blur(14px)",

          WebkitBackdropFilter:
            "blur(14px)",

          color:
            "#ffffff",
        }}
      >
        {/* SOFT COASTAL LIGHT */}

        <div
          aria-hidden="true"
          style={{
            position:
              "absolute",

            top:
              -50,

            right:
              -35,

            width:
              180,

            height:
              180,

            borderRadius:
              "50%",

            background:
              "radial-gradient(circle, rgba(251,191,36,0.34) 0%, rgba(251,191,36,0) 70%)",

            pointerEvents:
              "none",
          }}
        />

        <div
          style={{
            position:
              "relative",
          }}
        >
          <div
            style={{
              fontSize:
                10,

              fontWeight:
                850,

              letterSpacing:
                "0.14em",

              textTransform:
                "uppercase",

              color:
                "#fde68a",
            }}
          >
            Beach Life
          </div>

          <div
            style={{
              marginTop:
                5,

              maxWidth:
                340,

              fontSize:
                24,

              lineHeight:
                1.04,

              fontWeight:
                800,

              letterSpacing:
                "-0.025em",
            }}
          >
            Mornings barefoot.
            <br />
            Sunsets unforgettable.
          </div>

          <div
            style={{
              marginTop:
                9,

              fontSize:
                12,

              fontWeight:
                650,

              color:
                "rgba(255,255,255,0.88)",
            }}
          >
            Zona Romántica
            {" · "}
            Emiliano Zapata
          </div>

          <div
            style={{
              marginTop:
                11,

              display:
                "inline-flex",

              alignItems:
                "center",

              gap:
                6,

              fontSize:
                10,

              fontWeight:
                750,

              letterSpacing:
                "0.04em",

              color:
                "rgba(255,255,255,0.70)",
            }}
          >
            <span>
              Discovering the neighborhood
            </span>

            <span
              aria-hidden="true"
              style={{
                fontSize:
                  15,

                lineHeight:
                  1,
              }}
            >
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}