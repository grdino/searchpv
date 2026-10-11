"use client";

import { useEffect, useState } from "react";

type Units = "metric" | "imperial";
const KEY = "searchpv-area-units";

export default function UnitsToggle() {
  const [units, setUnits] = useState<Units>("metric");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(KEY); } catch { /* storage unavailable */ }
    const next: Units = saved === "imperial" ? "imperial" : "metric";
    setUnits(next);
    document.documentElement.dataset.comparisonUnits = next;
    return () => { delete document.documentElement.dataset.comparisonUnits; };
  }, []);

  function choose(next: Units) {
    setUnits(next);
    document.documentElement.dataset.comparisonUnits = next;
    try { window.localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
  }

  return (
    <div role="group" aria-label="Area and distance units" className="inline-flex items-center rounded-xl border border-white/30 p-1 text-sm font-bold">
      {(["metric", "imperial"] as const).map((choice) => (
        <button key={choice} type="button" aria-pressed={units === choice}
          onClick={() => choose(choice)}
          className={`rounded-lg px-3 py-1.5 transition ${units === choice ? "bg-white text-slate-950" : "text-white hover:bg-white/15"}`}>
          {choice === "metric" ? "m²" : "ft²"}
        </button>
      ))}
    </div>
  );
}
