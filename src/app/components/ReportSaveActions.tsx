"use client";

import { Bookmark, Check, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  isItemSaved,
  shareUrl,
  toggleSavedItem,
} from "@/lib/saved-items";

export default function ReportSaveActions({
  reportName,
  filterSummary,
}: {
  reportName: string;
  filterSummary: string;
}) {
  const [href, setHref] = useState("");
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const currentHref = `${window.location.pathname}${window.location.search}`;
    setHref(currentHref);
    setSaved(isItemSaved(`report-search:${currentHref}`));
  }, []);

  const itemId = useMemo(
    () => (href ? `report-search:${href}` : ""),
    [href],
  );

  function toggleSave() {
    if (!href || !itemId) return;

    setSaved(
      toggleSavedItem({
        id: itemId,
        type: "search",
        referenceId: href,
        title: reportName,
        subtitle: filterSummary,
        href,
        metadata: {
          reportName,
          filterSummary,
        },
      }),
    );
  }

  async function shareReport() {
    if (!href) return;

    const result = await shareUrl(
      `${reportName} | SearchPV`,
      href,
    );

    if (result === "copied") {
      setShareMessage("Link copied");
      window.setTimeout(() => setShareMessage(""), 2200);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleSave}
        disabled={!href}
        aria-pressed={saved}
        className={[
          "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-60",
          saved
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-500 bg-white/10 text-white hover:border-white hover:bg-white/15",
        ].join(" ")}
      >
        {saved ? <Check size={15} /> : <Bookmark size={15} />}
        {saved ? "Search Saved" : "Save Search"}
      </button>

      <button
        type="button"
        onClick={shareReport}
        disabled={!href}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-500 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:border-white hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
      >
        <Share2 size={15} />
        {shareMessage || "Share Report"}
      </button>
    </div>
  );
}
