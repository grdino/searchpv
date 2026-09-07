"use client";

import {
  Bookmark,
  Check,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  isItemSaved,
  shareUrl,
  toggleSavedItem,
} from "@/lib/saved-items";

export default function PropertySearchSaveActions({
  searchTitle,
  filterSummary,
}: {
  searchTitle: string;
  filterSummary: string;
}) {
  const [href, setHref] = useState("");
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] =
    useState("");

  useEffect(() => {
    const currentHref =
      `${window.location.pathname}${window.location.search}`;

    const itemId =
      `property-search:${currentHref}`;

    setHref(currentHref);
    setSaved(isItemSaved(itemId));
  }, []);

  function toggleSave() {
    if (!href) return;

    const itemId = `property-search:${href}`;

    const nextSaved = toggleSavedItem({
      id: itemId,
      type: "search",
      referenceId: href,
      title: searchTitle,
      subtitle: filterSummary,
      href,
      metadata: {
        searchType: "property-search",
        filterSummary,
      },
    });

    setSaved(nextSaved);
  }

  async function shareSearch() {
    if (!href) return;

    const result = await shareUrl(
      `${searchTitle} | SearchPV`,
      href,
    );

    if (result === "copied") {
      setShareMessage("Link copied");

      window.setTimeout(() => {
        setShareMessage("");
      }, 2200);
    }
  }

  return (
    <div className="ml-4 mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleSave}
        disabled={!href}
        aria-pressed={saved}
        className={[
          "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black shadow-sm transition disabled:cursor-wait disabled:opacity-60",
          saved
            ? "border-emerald-400 bg-emerald-200 text-emerald-950"
            : "border-emerald-300 bg-emerald-100 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-200",
        ].join(" ")}
      >
        {saved ? (
          <Check size={15} />
        ) : (
          <Bookmark size={15} />
        )}

        {saved ? "Search Saved" : "Save Search"}
      </button>

      <button
        type="button"
        onClick={shareSearch}
        disabled={!href}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-900 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60"
      >
        <Share2 size={15} />
        {shareMessage || "Share Search"}
      </button>
    </div>
  );
}