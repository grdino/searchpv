"use client";

import { useState } from "react";

export default function WalkabilityInfo() {
  const [open, setOpen] = useState(false);

  const text =
    "SearchPV walkability is based on nearby restaurants, cafés, grocery options, pharmacies, parks, gyms, galleries, and beach proximity within approximately 500 meters. Scores are generated from mapped place data and should be used as a general lifestyle indicator, not a formal walk score.";

  return (
    <>
      {/* Desktop */}
      <span
        title={text}
        className="hidden md:inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-500 text-[10px] text-slate-300"
      >
        ?
      </span>

      {/* Mobile */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-[10px] text-slate-300 md:hidden"
        aria-label="Explain walkability score"
      >
        ?
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 shadow-xl md:hidden">
          {text}
        </div>
      )}
    </>
  );
}