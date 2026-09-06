"use client";

import Link from "next/link";
import { BookmarkCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { saveItem } from "@/lib/saved-items";

type ImportState =
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "saved"; title: string; listingUrl: string };

function getSafeListingUrl(value: string) {
  try {
    const url = new URL(value);

    if (
      url.protocol === "https:" &&
      (url.hostname === "idx.searchpv.com" || url.hostname.endsWith(".searchpv.com"))
    ) {
      return url.toString();
    }
  } catch {
    // The error state below gives the visitor a useful recovery path.
  }

  return "";
}

export default function SavedPropertyImport() {
  const [state, setState] = useState<ImportState>({ status: "saving" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mls = params.get("mls")?.trim() ?? "";
    const title = params.get("title")?.trim() || (mls ? `MLS ${mls}` : "Property");
    const listingUrl = getSafeListingUrl(params.get("href") ?? "");
    const image = params.get("image")?.trim() ?? "";
    const price = params.get("price")?.trim() ?? "";

    if (!mls || !listingUrl) {
      setState({
        status: "error",
        message: "SearchPV could not identify this property link.",
      });
      return;
    }

    saveItem({
      id: `property:${mls}`,
      type: "property",
      referenceId: mls,
      title,
      subtitle: price ? `MLS ${mls} · ${price}` : `MLS ${mls}`,
      href: listingUrl,
      metadata: {
        mls,
        image: image || undefined,
        price: price || undefined,
      },
    });

    setState({ status: "saved", title, listingUrl });
  }, []);

  return (
    <section className="mx-auto mt-14 max-w-xl rounded-[28px] border border-white bg-white/85 p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,.10)] sm:p-10">
      {state.status === "saving" ? (
        <p className="font-bold text-slate-600">Saving property…</p>
      ) : state.status === "error" ? (
        <>
          <h1 className="text-2xl font-black">Property not saved</h1>
          <p className="mt-3 text-sm text-slate-600">{state.message}</p>
          <Link href="/saved" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
            View Saved
          </Link>
        </>
      ) : (
        <>
          <BookmarkCheck size={42} className="mx-auto text-teal-700" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-teal-700">Property saved</p>
          <h1 className="mt-2 text-2xl font-black">{state.title}</h1>
          <p className="mt-3 text-sm text-slate-600">This property is now in your SearchPV Saved collection.</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a href={state.listingUrl} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800">
              Return to property
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
