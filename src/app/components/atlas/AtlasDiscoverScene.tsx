"use client";

import { useEffect, useRef, useState } from "react";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";
import {
  ATLAS_DISCOVER_SEQUENCE,
  type AtlasDiscoverSceneConfig,
} from "./AtlasDiscoverConfig";

export default function AtlasDiscoverScene() {
  const { selectPopularArea } = useAtlasState();
  const [scene, setScene] =
    useState<AtlasDiscoverSceneConfig>(ATLAS_DISCOVER_SEQUENCE[0]);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [artworkVisible, setArtworkVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const timers: number[] = [];
    const later = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };
    const revealArtwork = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setArtworkVisible(true));
      });
    };

    let sequenceOffset = 0;

    ATLAS_DISCOVER_SEQUENCE.forEach((nextScene) => {
      const timing = nextScene.timing;

      later(() => {
        setScene(nextScene);
        setSceneVisible(false);
        setArtworkVisible(false);
        setMessageVisible(false);
      }, sequenceOffset);

      later(() => {
        setSceneVisible(true);
        revealArtwork();
      }, sequenceOffset + timing.artworkDelay);

      later(
        () => selectPopularArea(nextScene.popularArea),
        sequenceOffset + timing.selectionDelay,
      );

      later(
        () => setMessageVisible(true),
        sequenceOffset + timing.messageDelay,
      );

      later(
        () => setArtworkVisible(false),
        sequenceOffset + timing.artworkFadeDelay,
      );

      later(
        () => setMessageVisible(false),
        sequenceOffset + timing.messageFadeDelay,
      );

      if (timing.nextSceneDelay !== null) {
        // Hide the live Bottom Sheet before the next artwork and
        // footprint replace the current destination.
        later(() => {
          window.dispatchEvent(new Event("atlas-discover-hide-sheet"));
        }, sequenceOffset + timing.nextSceneDelay - 900);

        sequenceOffset += timing.nextSceneDelay;
      } else {
        // The final destination remains selected after its artwork
        // has dissolved back into the live Atlas map.
        later(
          () => setSceneVisible(false),
          sequenceOffset + timing.messageFadeDelay + 1200,
        );
      }
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [selectPopularArea]);

  if (!sceneVisible || !scene) return null;

  return (
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
      <div
        key={scene.image}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${scene.image}")`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          opacity: artworkVisible ? 0.34 : 0,
          transform: artworkVisible ? "scale(1.02)" : "scale(1.065)",
          transition: [
            "opacity 2100ms ease-in-out",
            "transform 6500ms cubic-bezier(0.16, 0.72, 0.22, 1)",
          ].join(", "),
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
    </div>
  );
}