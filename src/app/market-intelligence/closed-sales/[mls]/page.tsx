import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";

type ClosedListing = {
  mls: string;
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;
  unit: string | null;
  address: string | null;
  prprty_type: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  sqm: number | null;
  market_segment: string | null;
  property_type_segment: string | null;
  bedroom_segment: string | null;
  sold_date: string | null;
  original_list_price: number | null;
  final_list_price: number | null;
  sold_price: number | null;
  sold_minus_final_list: number | null;
  sold_minus_original_list: number | null;
  sold_to_final_list_pct: number | null;
  sold_to_original_list_pct: number | null;
  discount_from_final_list: number | null;
  discount_from_final_list_pct: number | null;
  discount_from_original_list: number | null;
  discount_from_original_list_pct: number | null;
  sold_price_per_sqft: number | null;
  sold_price_per_sqm: number | null;
  days_on_market: number | null;
  pre_construction: boolean | null;

  market_snapshot_date: string | null;
  market_sales_period_start: string | null;
  market_sales_period_end: string | null;

  community_active_count: number | null;
  community_pending_count: number | null;
  community_sales_12mo: number | null;
  community_median_sold_price: number | null;
  community_median_sold_price_sqft: number | null;
  community_months_inventory: number | null;
  community_bedroom_median_sold_price: number | null;
  community_bedroom_median_sold_price_sqft: number | null;
  community_bedroom_months_inventory: number | null;

  development_active_count: number | null;
  development_pending_count: number | null;
  development_sales_12mo: number | null;
  development_median_sold_price: number | null;
  development_median_sold_price_sqft: number | null;
  development_months_inventory: number | null;

  sold_price_vs_community_median_pct: number | null;
  sold_price_sqft_vs_community_median_pct: number | null;
  sold_price_vs_bedroom_median_pct: number | null;
  sold_price_vs_development_median_pct: number | null;
  sold_price_sqft_vs_development_median_pct: number | null;
};

type PageProps = {
  params: Promise<{
    mls: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mls } = await params;

  return {
    title: `Closed Listing MLS ${mls} | SearchPV`,
    description: `Closed listing report for MLS ${mls}, including sold price, list price, days on market, and SearchPV market context.`,
  };
}

export default async function ClosedListingDetailPage({ params }: PageProps) {
  const { mls } = await params;

  const { data, error } = await supabase
    .from("closed_listing_detail")
    .select("*")
    .eq("mls", mls)
    .single();

  if (error || !data) notFound();

  const listing = data as ClosedListing;

  const propertyTitle =
    listing.development_name
      ? `${listing.development_name}${listing.unit ? ` ${listing.unit}` : ""}`
      : listing.address || `MLS ${listing.mls}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Header />
            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <div className="mt-6 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-slate-200">
            SEARCHPV CLOSED LISTING
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            {propertyTitle}
          </h1>

          <p className="mt-3 text-sm text-slate-300">
            MLS #{listing.mls} · {listing.community_name || "Puerto Vallarta"} ·{" "}
            {listing.area_name || "Market Sale"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
{/*
        <Link
          href="/market-intelligence/closed-sales"
          className="font-semibold text-blue-700 hover:underline"
        >
          ← Back to Closed Listings
        </Link>
*/}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard label="Sold Price" value={formatMoney(listing.sold_price)} />
          <MetricCard label="Sold Date" value={formatDateLong(listing.sold_date)} />
          <MetricCard label="DOM" value={formatNumber(listing.days_on_market)} />
          <MetricCard
            label="Sold / Final List"
            value={formatPercentWhole(listing.sold_to_final_list_pct)}
          />
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Pricing Performance</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Info label="Original List Price" value={formatMoney(listing.original_list_price)} />
            <Info label="Final List Price" value={formatMoney(listing.final_list_price)} />
            <Info label="Sold Price" value={formatMoney(listing.sold_price)} />
            <Info label="Sold-to-List Price Ratio" value={formatPercentWhole(listing.sold_to_final_list_pct)} />
            <Info label="Sold-to-Original List Price Ratio" value={formatPercentWhole(listing.sold_to_original_list_pct)} />
            <Info label="Discount from Final List" value={formatMoney(listing.discount_from_final_list)} />
            <Info label="Discount from Original List" value={formatMoney(listing.discount_from_original_list)} />
            <Info label="Sold Price / ft²" value={formatMoney(listing.sold_price_per_sqft)} />
            <Info label="Sold Price / m²" value={formatMoney(listing.sold_price_per_sqm)} />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Market Context</h2>

          <p className="mt-1 text-sm text-slate-500">
            Community comparison based on the latest SearchPV market snapshot.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Info label="Community" value={listing.community_name || "-"} />
            <Info label="Community Active Listings" value={formatNumber(listing.community_active_count)} />
            <Info label="Community Sales - 12 Mo" value={formatNumber(listing.community_sales_12mo)} />
            <Info label="Community Median Sold Price" value={formatMoney(listing.community_median_sold_price)} />
            <Info label="This Property vs Community Median" value={formatSignedPercent(listing.sold_price_vs_community_median_pct)} />
            <Info label="Community Median Sold $/ft²" value={formatMoney(listing.community_median_sold_price_sqft)} />
            <Info label="This Property $/ft² vs Community" value={formatSignedPercent(listing.sold_price_sqft_vs_community_median_pct)} />
            <Info label="Bedroom-Matched Median Sold" value={formatMoney(listing.community_bedroom_median_sold_price)} />
            <Info label="Bedroom-Matched MOI" value={formatNumber(listing.community_bedroom_months_inventory)} />
            <Info label="Community MOI" value={formatNumber(listing.community_months_inventory)} />
            <Info label="Market Period Start" value={formatDateLong(listing.market_sales_period_start)} />
            <Info label="Market Period End" value={formatDateLong(listing.market_sales_period_end)} />
          </div>
        </div>

        {listing.development_name && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold">Development Context</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Info label="Development" value={listing.development_name} />
              <Info label="Development Active Listings" value={formatNumber(listing.development_active_count)} />
              <Info label="Development Sales - 12 Mo" value={formatNumber(listing.development_sales_12mo)} />
              <Info label="Development Median Sold Price" value={formatMoney(listing.development_median_sold_price)} />
              <Info label="This Property vs Development Median" value={formatSignedPercent(listing.sold_price_vs_development_median_pct)} />
              <Info label="Development Median Sold $/ft²" value={formatMoney(listing.development_median_sold_price_sqft)} />
              <Info label="This Property $/ft² vs Development" value={formatSignedPercent(listing.sold_price_sqft_vs_development_median_pct)} />
              <Info label="Development MOI" value={formatNumber(listing.development_months_inventory)} />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Property Details</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Info label="Property Type" value={listing.prprty_type || "-"} />
            <Info label="Market Type" value={listing.pre_construction ? "Pre-Construction" : "Resale"} />
            <Info label="Bedrooms" value={formatNumber(listing.beds)} />
            <Info label="Bathrooms" value={formatNumber(listing.baths)} />
            <Info label="Interior ft²" value={formatNumber(listing.sqft)} />
            <Info label="Interior m²" value={formatNumber(listing.sqm)} />
            <Info label="Development" value={listing.development_name || "-"} />
            <Info label="Community" value={listing.community_name || "-"} />
            <Info label="Area" value={listing.area_name || "-"} />
            <Info label="Zone" value={listing.zone_name || "-"} />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-100 p-6">
          <h2 className="text-2xl font-bold">SearchPV Scorecard</h2>

          <div className="mt-4 space-y-2 text-slate-700">
            <p>✓ Sold in {formatNumber(listing.days_on_market)} days</p>
            <p>
              ✓ Sold at {formatPercentWhole(listing.sold_to_final_list_pct)} of
              final asking price
            </p>
            <p>
              ✓ Sold at {formatPercentWhole(listing.sold_to_original_list_pct)}{" "}
              of original asking price
            </p>
            <p>✓ Sold for {formatMoney(listing.sold_price_per_sqft)} per ft²</p>
            <p>
              ✓ {listing.pre_construction ? "Pre-construction" : "Resale"}{" "}
              {listing.prprty_type || "property"}
            </p>
            <p>
              ✓ Sold {formatSignedPercent(listing.sold_price_vs_community_median_pct)}{" "}
              compared with the community median sold price
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This closed listing page is provided for market-information purposes.
          MLS photos are not displayed.
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (!value) return "-";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function formatPercentWhole(value: number | null) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(1)}%`;
}

function formatSignedPercent(value: number | null) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (number > 0) return `${number.toFixed(1)}% above`;
  if (number < 0) return `${Math.abs(number).toFixed(1)}% below`;
  return "At median";
}

function formatDateLong(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}