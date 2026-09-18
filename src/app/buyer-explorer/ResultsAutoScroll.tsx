"use client";

import { useEffect } from "react";

export default function ResultsAutoScroll() {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("buyer-explorer-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return null;
}
