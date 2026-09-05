"use client";

import { Pause, Play, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useAtlasState } from "@/lib/atlas/state/AtlasState";
import {
  ATLAS_DISCOVER_SEQUENCE,
  type AtlasDiscoverSceneConfig,
} from "./AtlasDiscoverConfig";

type TourStatus = "waiting" | "running" | "paused" | "complete";

export default function AtlasDiscoverScene() {
  const { selectPopularArea } = useAtlasState();
  const [scene, setScene] = useState<AtlasDiscoverSceneConfig>(
    ATLAS_DISCOVER_SEQUENCE[0],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<TourStatus>("waiting");
  const [sceneVisible, setSceneVisible] = useState(false);
  const [artworkVisible, setArtworkVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  const timersRef = useRef<number[]>([]);
  const statusRef = useRef<TourStatus>("waiting");
  const currentIndexRef = useRef(0);
  const selectPopularAreaRef = useRef(selectPopularArea);
  const runSceneRef = useRef<(index: number) => void>(() => undefined);
  const pauseRef = useRef<() => void>(() => undefined);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  selectPopularAreaRef.current = selectPopularArea;

  useEffect(() => {
    const setTourStatus = (nextStatus: TourStatus) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
    };

    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    const later = (callback: () => void, delay: number) => {
      timersRef.current.push(window.setTimeout(callback, delay));
    };

    const revealArtwork = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setArtworkVisible(true));
      });
    };

    const pauseTour = () => {
      if (statusRef.current !== "running") return;

      clearTimers();
      setArtworkVisible(false);
      setMessageVisible(false);
      setSceneVisible(false);
      setTourStatus("paused");

      // Existing Atlas map and sheet listeners use this event to stop
      // an in-progress flight and return to their normal interactive state.
      window.dispatchEvent(new Event("atlas-discover-cancel"));
    };

    const runScene = (requestedIndex: number) => {
      if (ATLAS_DISCOVER_SEQUENCE.length === 0) return;

      const index = Math.min(
        Math.max(requestedIndex, 0),
        ATLAS_DISCOVER_SEQUENCE.length - 1,
      );
      const nextScene = ATLAS_DISCOVER_SEQUENCE[index];
      const timing = nextScene.timing;

      clearTimers();
      currentIndexRef.current = index;
      setCurrentIndex(index);
      setScene(nextScene);
      setSceneVisible(false);
      setArtworkVisible(false);
      setMessageVisible(false);
      setTourStatus("running");

      // Allow the Bottom Sheet to re-enter its cinematic timing after a
      // pause, a manual destination jump, or a tour restart.
      window.dispatchEvent(new Event("atlas-discover-resume"));

      later(() => {
        setSceneVisible(true);
        revealArtwork();
      }, timing.artworkDelay);

      later(
        () => selectPopularAreaRef.current(nextScene.popularArea),
        timing.selectionDelay,
      );

      later(() => setMessageVisible(true), timing.messageDelay);
      later(() => setArtworkVisible(false), timing.artworkFadeDelay);
      later(() => setMessageVisible(false), timing.messageFadeDelay);

      if (timing.nextSceneDelay !== null) {
        later(() => {
          window.dispatchEvent(new Event("atlas-discover-hide-sheet"));
        }, Math.max(0, timing.nextSceneDelay - 900));

        later(() => runScene(index + 1), timing.nextSceneDelay);
      } else {
        later(() => {
          setSceneVisible(false);
          setTourStatus("complete");
        }, timing.messageFadeDelay + 1200);
      }
    };

    runSceneRef.current = runScene;
    pauseRef.current = pauseTour;

    const isTourControl = (event: Event) => {
      const target = event.target;
      return (
        target instanceof Element &&
        target.closest("[data-atlas-discover-control]") !== null
      );
    };

    const handleInteraction = (event: Event) => {
      if (!isTourControl(event)) pauseTour();
    };

    const interactionOptions: AddEventListenerOptions = {
      capture: true,
      passive: true,
    };

    window.addEventListener("pointerdown", handleInteraction, interactionOptions);
    window.addEventListener("touchstart", handleInteraction, interactionOptions);
    window.addEventListener("wheel", handleInteraction, interactionOptions);
    window.addEventListener("keydown", handleInteraction, true);

    const params = new URLSearchParams(window.location.search);
    const requestedSceneId = params.get("scene");
    const requestedIndex = ATLAS_DISCOVER_SEQUENCE.findIndex(
      (candidate) => candidate.id === requestedSceneId,
    );
    const initialIndex = requestedIndex >= 0 ? requestedIndex : 0;

    const startTour = () => {
      if (statusRef.current === "waiting") runScene(initialIndex);
    };

    window.addEventListener("atlas-discover-ready", startTour);

    if (document.documentElement.dataset.atlasDiscoverReady === "true") {
      startTour();
    }

    return () => {
      clearTimers();
      window.removeEventListener("pointerdown", handleInteraction, true);
      window.removeEventListener("touchstart", handleInteraction, true);
      window.removeEventListener("wheel", handleInteraction, true);
      window.removeEventListener("keydown", handleInteraction, true);
      window.removeEventListener("atlas-discover-ready", startTour);
    };
  }, []);

  useEffect(() => {
    let effectCancelled = false;

    const releaseWakeLock = async () => {
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;

      if (wakeLock && !wakeLock.released) {
        try {
          await wakeLock.release();
        } catch {
          // A wake lock may already have been released by the browser.
        }
      }
    };

    const requestWakeLock = async () => {
      if (
        effectCancelled ||
        statusRef.current !== "running" ||
        document.visibilityState !== "visible" ||
        !("wakeLock" in navigator)
      ) {
        return;
      }

      try {
        const wakeLock = await navigator.wakeLock.request("screen");

        if (effectCancelled || statusRef.current !== "running") {
          await wakeLock.release();
          return;
        }

        wakeLockRef.current = wakeLock;

        wakeLock.addEventListener("release", () => {
          if (wakeLockRef.current === wakeLock) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        // Discovery still works when wake lock is unavailable or denied.
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        statusRef.current === "running" &&
        wakeLockRef.current === null
      ) {
        void requestWakeLock();
      }
    };

    if (status === "running") {
      void requestWakeLock();
      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    } else {
      void releaseWakeLock();
    }

    return () => {
      effectCancelled = true;
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      void releaseWakeLock();
    };
  }, [status]);

  const resumeOrRestart = () => {
    runSceneRef.current(
      status === "complete" ? 0 : currentIndexRef.current,
    );
  };

  const exitTour = () => {
    window.dispatchEvent(new Event("atlas-discover-cancel"));
    window.location.assign("/atlas");
  };

  return (
    <>
      {sceneVisible ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            key={scene.image}
            src={scene.image}
            alt=""
            className="atlas-discover-artwork"
            style={{
              opacity: artworkVisible ? 0.34 : 0,
              transition: "opacity 2100ms ease-in-out",
              filter: "saturate(0.88) contrast(0.94)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: artworkVisible ? 1 : 0,
              transition: "opacity 1900ms ease-in-out",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.20) 28%, rgba(255,255,255,0.02) 58%, rgba(255,255,255,0) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "42%",
              opacity: artworkVisible ? 1 : 0,
              transition: "opacity 1800ms ease-in-out",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 38%, rgba(255,255,255,0.76) 100%)",
            }}
          />
{/*
          <div
            style={{
              position: "absolute",
              left: "clamp(28px, 5.8vw, 92px)",
              top: "clamp(285px, 37vh, 390px)",
              width: "min(440px, 78vw)",
              opacity: messageVisible ? 1 : 0,
              transform: messageVisible ? "translateY(0px)" : "translateY(12px)",
              transition: [
                "opacity 1500ms ease-in-out",
                "transform 1900ms cubic-bezier(0.16, 0.72, 0.22, 1)",
              ].join(", "),
            }}
          >
            <div
              style={{
                color: "#0f766e",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.17em",
                textTransform: "uppercase",
              }}
            >
              Discover
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#0f172a",
                fontSize: "clamp(27px, 3.6vw, 44px)",
                fontWeight: 850,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                textShadow: "0 2px 18px rgba(255,255,255,0.92)",
              }}
            >
              {scene.copy.title}
            </div>

            <div
              style={{
                marginTop: 12,
                color: "#1e293b",
                fontSize: "clamp(15px, 1.5vw, 19px)",
                fontWeight: 750,
                lineHeight: 1.42,
                textShadow: "0 2px 14px rgba(255,255,255,0.96)",
              }}
            >
              {scene.copy.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>

            <div
              style={{
                marginTop: 11,
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.4,
                textShadow: "0 2px 12px rgba(255,255,255,0.96)",
              }}
            >
              {scene.copy.detail}
            </div>
          </div>
*/}
        </div>
      ) : null}

      <div
        data-atlas-discover-control
        className="absolute left-[124px] right-2 top-[76px] w-auto gap-1.5 p-1.5 md:left-1/2 md:right-auto md:top-4 md:w-[calc(100vw-132px)] md:max-w-[620px] md:-translate-x-1/2 md:gap-2 md:p-[7px]"
        style={{
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          border: "1px solid rgba(255,255,255,.84)",
          borderRadius: 18,
          background: "rgba(255,255,255,.88)",
          boxShadow: "0 12px 36px rgba(15,23,42,.16)",
          backdropFilter: "blur(18px)",
          pointerEvents: "auto",
        }}
      >
        <label htmlFor="atlas-discover-destination" className="sr-only">
          Discovery destination
        </label>

        <select
          id="atlas-discover-destination"
          className="h-9 px-2 text-xs md:h-10 md:px-3 md:text-[13px]"
          value={scene.id}
          onChange={(event) => {
            const index = ATLAS_DISCOVER_SEQUENCE.findIndex(
              (candidate) => candidate.id === event.target.value,
            );
            if (index >= 0) runSceneRef.current(index);
          }}
          style={{
            minWidth: 0,
            flex: 1,
            border: 0,
            borderRadius: 12,
            outline: "none",
            background: "rgba(241,245,249,.9)",
            color: "#0f172a",
            fontWeight: 800,
          }}
        >
          {ATLAS_DISCOVER_SEQUENCE.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.menuLabel}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            if (status === "running") pauseRef.current();
            else resumeOrRestart();
          }}
          aria-label={status === "running" ? "Pause tour" : "Resume tour"}
          title={status === "complete" ? "Restart tour" : undefined}
          className="h-9 px-2 md:h-10 md:px-3"
          style={controlButtonStyle}
        >
          {status === "running" ? <Pause size={17} /> : <Play size={17} />}
          <span className="hidden md:inline">
            {status === "running"
              ? "Pause"
              : status === "complete"
                ? "Restart"
                : "Resume"}
          </span>
        </button>

        <button
          type="button"
          onClick={exitTour}
          aria-label="Exit tour and explore Atlas"
          className="h-9 px-2 md:h-10 md:px-3"
          style={controlButtonStyle}
        >
          <X size={17} />
          <span className="hidden md:inline">Exit</span>
        </button>
      </div>
    </>
  );
}

const controlButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: 0,
  borderRadius: 12,
  background: "#0f172a",
  color: "white",
  fontSize: 12,
  fontWeight: 850,
  cursor: "pointer",
};
