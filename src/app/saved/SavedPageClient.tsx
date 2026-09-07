"use client";

import Link from "next/link";
import {
  Bookmark,
  Check,
  ChevronRight,
  Mail,
  MapPinned,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSavedItems } from "@/app/components/useSavedItems";
import { createClient } from "@/lib/supabase/client";
import {
  OPEN_SAVE_EMAIL_EVENT,
  removeSavedItem,
  SAVED_SYNC_STATUS_EVENT,
  type SavedItemType,
} from "@/lib/saved-items";

const sections: Array<{
  type: SavedItemType;
  title: string;
  empty: string;
}> = [
  {
    type: "property",
    title: "Properties",
    empty: "Properties you save will appear here.",
  },
  {
    type: "area",
    title: "Atlas Areas",
    empty: "Atlas areas you save will appear here.",
  },
  {
    type: "search",
    title: "Searches",
    empty: "Market and property searches you save will appear here.",
  },
];

export default function SavedPageClient() {
  const { items, refresh } = useSavedItems();
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setVerifiedEmail(data.user?.email ?? null);
    });

    function onStatus(event: Event) {
      const detail = (event as CustomEvent<{ email: string | null }>).detail;
      setVerifiedEmail(detail?.email ?? null);
    }

    window.addEventListener(SAVED_SYNC_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(SAVED_SYNC_STATUS_EVENT, onStatus);
  }, []);

  function openEmailPrompt() {
    window.dispatchEvent(new CustomEvent(OPEN_SAVE_EMAIL_EVENT));
  }

  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
        Your SearchPV
      </p>

      <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
        Saved
      </h1>

      <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
        {verifiedEmail
          ? "Your saved items are available across your verified devices."
          : "These items are currently saved on this device."}
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/85 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {verifiedEmail ? (
              <Check className="mt-0.5 shrink-0 text-emerald-700" size={21} />
            ) : (
              <Mail className="mt-0.5 shrink-0 text-emerald-700" size={21} />
            )}

            <div>
              <h2 className="font-black text-slate-950">
                {verifiedEmail
                  ? "Available across devices"
                  : "These items are saved on this device"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {verifiedEmail
                  ? `Connected to ${verifiedEmail}.`
                  : "Keep them available on your phone, tablet, and computer by verifying your email."}
              </p>
            </div>
          </div>

          {!verifiedEmail ? (
            <button
              type="button"
              onClick={openEmailPrompt}
              className="shrink-0 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Keep Across Devices
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.type === section.type,
          );

          const Icon =
            section.type === "area"
              ? MapPinned
              : section.type === "search"
                ? Search
                : Bookmark;

          return (
            <section key={section.type}>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Icon size={20} className="text-teal-700" />
                {section.title}
                <span className="text-sm text-slate-400">
                  {sectionItems.length}
                </span>
              </h2>

              {sectionItems.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {sectionItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm"
                    >
                      <Link href={item.href} className="min-w-0 flex-1">
                        <span className="block truncate font-black">
                          {item.title}
                        </span>

                        {item.subtitle ? (
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </Link>

                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => {
                          removeSavedItem(item.id);
                          refresh();
                        }}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>

                      <Link
                        href={item.href}
                        aria-label={`Open ${item.title}`}
                        className="text-teal-700"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/45 px-5 py-6 text-sm text-slate-500">
                  {section.empty}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
