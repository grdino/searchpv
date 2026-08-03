import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Search,
} from "lucide-react";

import Header from "@/app/components/Header";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Puerto Vallarta Real Estate | SearchPV",
  description:
    "Search properties, explore Puerto Vallarta and Riviera Nayarit market activity, or ask SearchPV about listings, neighborhoods, and local real estate.",
  alternates: {
    canonical: "https://searchpv.com/",
  },
  openGraph: {
    title: "Puerto Vallarta Real Estate | SearchPV",
    description:
      "Search properties, explore the market, or ask SearchPV about Puerto Vallarta real estate.",
    url: "https://searchpv.com/",
    siteName: "SearchPV",
    type: "website",
  },
};

type MarketSnapshotRow = {
  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
  snapshot_date: string | null;
};

export default async function HomePage() {
  const { data, error } = await supabase
    .from("community_snapshot")
    .select("active_count, pending_count, sales_12mo, snapshot_date")
    .eq("market_segment", "all")
    .eq("property_type_segment", "all");

  const rows = (data ?? []) as MarketSnapshotRow[];

  const currentMarket = rows.reduce(
    (totals, row) => {
      totals.active += Number(row.active_count ?? 0);
      totals.pending += Number(row.pending_count ?? 0);
      totals.closedSales += Number(row.sales_12mo ?? 0);

      return totals;
    },
    {
      active: 0,
      pending: 0,
      closedSales: 0,
    }
  );

  const snapshotDate =
    rows.find((row) => row.snapshot_date)?.snapshot_date ?? null;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SearchPV",
    url: "https://searchpv.com/",
    description:
      "Puerto Vallarta and Riviera Nayarit property search and real estate market intelligence.",
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://searchpv.com/ask-searchpv?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SearchPV",
    url: "https://searchpv.com/",
    logo: "https://searchpv.com/icon.png",
    description:
      "SearchPV provides property search and Puerto Vallarta real estate market intelligence.",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      <section className="bg-slate-950 px-4 pb-16 pt-10 text-white md:px-8 md:pb-20 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div className="mx-auto mt-12 max-w-4xl text-center md:mt-16">
            <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              AI-Powered Market Intelligence
            </p>

            <p className="mt-2 text-lg font-medium text-slate-300">
              The Smarter Way to Search Puerto Vallarta Real Estate
            </p>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Ask about neighborhoods, listings, developments, or the local
              real estate market.
            </p>

            <form
              action="/ask-searchpv"
              method="get"
              className="mx-auto mt-5 max-w-3xl"
            >
              <div className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur sm:flex-row">
                <label htmlFor="searchpv-question" className="sr-only">
                  Ask SearchPV
                </label>

                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white px-4">
                  <Search
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                    size={21}
                  />

                  <input
                    id="searchpv-question"
                    name="q"
                    type="search"
                    required
                    placeholder="Ask about neighborhoods, listings, or the market..."
                    className="min-h-14 w-full bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="min-h-14 rounded-2xl bg-cyan-300 px-7 text-sm font-black text-slate-950 shadow-[0_0_18px_rgba(103,232,249,.35)] transition hover:bg-cyan-200"
                >
                  Ask SearchPV
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span>“Condos under $600,000”</span>
              <span>“Compare Marina and Versalles”</span>
              <span>“Recent price changes”</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <HomeChoiceCard
            title="Search Properties"
            description="Explore listings, communities, developments, pricing, inventory, and recent sales."
            href="/search-properties"
            Icon={Building2}
            action="Start searching"
          />

          <HomeChoiceCard
            title="Explore the Market"
            description="Review active listings, pending sales, closed sales, market changes, and trends."
            href="/market-intelligence"
            Icon={BarChart3}
            action="View market insights"
          />

          <HomeChoiceCard
            title="Ask SearchPV"
            description="Describe what you are looking for or ask a real estate market question naturally."
            href="/ask-searchpv"
            Icon={Bot}
            action="Ask a question"
          />
        </div>

        <section className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 md:px-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Current Market
            </p>

            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-2xl font-black text-slate-950">
                Puerto Vallarta & Riviera Nayarit
              </h2>

              {snapshotDate && (
                <p className="text-xs text-slate-500">
                  Data current as of {formatDateOnly(snapshotDate)}
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="px-6 py-8 text-sm text-slate-600 md:px-8">
              Current market totals are temporarily unavailable.
            </div>
          ) : (
            <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <MarketMetric
                value={currentMarket.active}
                label="Active Listings"
                href="/market-intelligence/active-listings"
              />

              <MarketMetric
                value={currentMarket.pending}
                label="Pending Sales"
                href="/market-intelligence/pending-sales"
              />

              <MarketMetric
                value={currentMarket.closedSales}
                label="Closed Sales — 12 Months"
                href="/market-intelligence/closed-sales"
              />
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function HomeChoiceCard({
  title,
  description,
  href,
  action,
  Icon,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
        <Icon size={24} strokeWidth={2.2} />
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>

      <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-800">
        {action}
        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

function MarketMetric({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block px-6 py-8 text-center transition hover:bg-slate-50 md:px-8"
    >
      <div className="text-4xl font-black tracking-tight text-slate-950">
        {value.toLocaleString("en-US")}
      </div>

      <div className="mt-2 text-sm font-bold text-slate-600">{label}</div>
    </Link>
  );
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}