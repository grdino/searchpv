"use client";

import { useState } from "react";

export default function ShareButton({ mls }: { mls: number }) {
  const [copied, setCopied] = useState(false);

  const url = `https://searchpv.com/property-comparison/${mls}`;
  const title = `How MLS ${mls} Compares | SearchPV`;
  const text = `See how MLS ${mls} compares with current listings and recent sales in Puerto Vallarta and Riviera Nayarit.`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
      aria-label="Share property comparison"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.7 13.5 6.6 4" />
        <path d="m15.3 6.5-6.6 4" />
      </svg>
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}