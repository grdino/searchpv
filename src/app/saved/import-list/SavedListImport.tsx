"use client";

import Link from "next/link";
import { BookmarkCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { saveItem } from "@/lib/saved-items";

type ImportState =
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "saved"; title: string; listUrl: string };

function getSafeListUrl(value: string) {
  try {
    const url = new URL(value);

    if (
      url.protocol === "https:" &&
      url.hostname === "idx.searchpv.com" &&
      url.pathname.startsWith("/idx/search") &&
      url.searchParams.get("ListingId")
    ) {
      url.searchParams.delete("cb");
      return url.toString();
    }
  } catch {
    // The error state below provides a safe recovery path.
  }

  return "";
}

export default function SavedListImport() {
  const [state, setState] = useState<ImportState>({ status: "saving" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listUrl = getSafeListUrl(params.get("href") ?? "");
    const count = Math.max(0, Number(params.get("count")) || 0);
    const title = params.get("title")?.trim() || "Saved Property List";

    if (!listUrl) {
      setState({
        status: "error",
        message: "SearchPV could not identify this property list.",
      });
      return;
    }

    const listingIds = new URL(listUrl)
      .searchParams.get("ListingId")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

    const referenceId = listingIds.join(",");

    saveItem({
      id: `idx-list:${referenceId}`,
      type: "search",
      referenceId,
      title,
      subtitle: `${count || listingIds.length} saved ${listingIds.length === 1 ? "property" : "properties"}`,
      href: listUrl,
      metadata: {
        listingIds,
        count: count || listingIds.length,
        kind: "fixed-property-list",
      },
    });

    setState({ status: "saved", title, listUrl });
  }, []);

  return (
    <section className="mx-auto mt-14 max-w-xl rounded-[28px] border border-white bg-white/85 p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,.10)] sm:p-10">
      {state.status === "saving" ? (
        <p className="font-bold text-slate-600">Saving property list…</p>
      ) : state.status === "error" ? (
        <>
          <h1 className="text-2xl font-black">List not saved</h1>
          <p className="mt-3 text-sm text-slate-600">{state.message}</p>
          <Link href="/saved" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
            View Saved
          </Link>
        </>
      ) : (
        <>
          <BookmarkCheck size={42} className="mx-auto text-teal-700" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-teal-700">Property list saved</p>
          <h1 className="mt-2 text-2xl font-black">{state.title}</h1>
          <p className="mt-3 text-sm text-slate-600">
            This fixed group of MLS listings is now in your Searches collection.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a href={state.listUrl} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800">
              Return to list
            </a>
            <Link href="/saved" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
              View Saved <ChevronRight size={16} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
