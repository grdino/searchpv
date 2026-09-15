import Link from "next/link";

import Header from "@/app/components/Header";
import { getOfficeApps, requireOfficeUser } from "@/lib/office-auth";

import { logout } from "./actions";

type PageProps = {
  searchParams: Promise<{ denied?: string }>;
};

const APP_PRESENTATION = {
  listing_comparison: {
    eyebrow: "Market Position",
    description:
      "Review automatically selected current competitors and recent sales for any MLS listing.",
    className: "border-amber-200 bg-amber-50",
    eyebrowClassName: "text-amber-700",
  },
  agency_rankings: {
    description: "Internal sales participation and agency reporting.",
    className: "border-slate-200 bg-white",
  },
  agent_rankings: {
    description: "Internal sales participation and agent reporting.",
    className: "border-slate-200 bg-white",
  },
  geography: {
    description: "Maintain geographic entities, aliases, coordinates, and hierarchy.",
    className: "border-slate-200 bg-white",
  },
  saved_analytics: {
    eyebrow: "Engagement",
    description:
      "Monitor anonymous saves, removals, popular items, visitors, and device usage.",
    className: "border-emerald-200 bg-emerald-50",
    eyebrowClassName: "text-emerald-700",
  },
} as const;

export default async function OfficePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [officeUser, apps] = await Promise.all([
    requireOfficeUser(),
    getOfficeApps(),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Header />

        <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-slate-950 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              SearchPV
            </p>
            <h1 className="mt-1 text-2xl font-bold">Private Office</h1>
            <p className="mt-1 text-sm text-slate-300">
              Signed in as {officeUser.email}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Sign Out
            </button>
          </form>
        </header>

        {params.denied === "1" ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Your Office account does not have access to that application.
          </div>
        ) : null}

        <section className="grid gap-5 sm:grid-cols-2">
          {apps.map((app) => {
            const presentation = APP_PRESENTATION[app.app_key];
            return (
              <Link
                key={app.app_key}
                href={app.href}
                className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${presentation.className}`}
              >
                {"eyebrow" in presentation && presentation.eyebrow ? (
                  <p
                    className={`text-xs font-black uppercase tracking-[0.14em] ${presentation.eyebrowClassName}`}
                  >
                    {presentation.eyebrow}
                  </p>
                ) : null}

                <h2 className={`${"eyebrow" in presentation && presentation.eyebrow ? "mt-2 " : ""}text-lg font-bold text-slate-950`}>
                  {app.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {presentation.description}
                </p>
              </Link>
            );
          })}

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-950">Property Inventory</h2>
            <p className="mt-2 text-sm text-slate-600">
              Mobile inventory and property-transfer packages.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Coming next
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
