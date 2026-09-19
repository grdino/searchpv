import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";

import Header from "@/app/components/Header";
import BearingsDialog from "./BearingsDialog";
import ResultsAutoScroll from "./ResultsAutoScroll";
import { buildPropertySearchUrl, DEFAULT_PROPERTY_SEARCH_FILTERS } from "@/lib/property-search/filters";
import {
  getBuyerExplorerResult,
  type BuyerExplorerCriteria,
  type BuyerPropertyType,
} from "@/lib/buyer-explorer/service";

export const metadata: Metadata = {
  title: "Where Does My Budget Fit? | SearchPV",
  description: "See where your budget and basic requirements have the most current real estate options across Puerto Vallarta and Riviera Nayarit.",
  robots: { index: false, follow: true },
};

type Params = Record<string, string | string[] | undefined>;

export default async function BuyerExplorerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const submitted = first(params.go) === "1";
  const criteria = parseCriteria(params);

  let result = null;
  let error: string | null = null;
  if (submitted) {
    try {
      result = await getBuyerExplorerResult(criteria);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Unable to load results.";
    }
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#f4fbfb_0%,#ffffff_45%)] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <Header />

        <section className="mx-auto mt-10 max-w-4xl md:mt-16">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">Buyer Explorer</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Where Does My Budget Fit?</h1>
          </div>

          <form className="mt-3 grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,.08)] sm:grid-cols-2 md:grid-cols-4 md:p-5">
            <Field label="Budget">
              <select name="maxPrice" defaultValue={String(criteria.maxPrice)} className={controlClass}>
                {[250000,300000,350000,400000,450000,500000,600000,750000,1000000,1500000,2000000].map((value) => <option key={value} value={value}>Up to {money(value)}</option>)}
              </select>
            </Field>
            <Field label="Property">
              <select name="propertyType" defaultValue={criteria.propertyType} className={controlClass}>
                <option value="condos">Condo</option><option value="houses">House</option><option value="all">Either</option>
              </select>
            </Field>
            <Field label="Bedrooms">
              <select name="minBeds" defaultValue={String(criteria.minBeds)} className={controlClass}>
                <option value="0">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
              </select>
            </Field>
            <Field label="Region">
              <select name="region" defaultValue={criteria.region} className={controlClass}>
                <option value="all">PV + Riviera Nayarit</option><option value="pv">Puerto Vallarta</option><option value="nayarit">Riviera Nayarit</option>
              </select>
            </Field>
            <input type="hidden" name="go" value="1" />
            <button className="sm:col-span-2 md:col-span-4 mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 font-black text-white transition hover:bg-teal-800">
              Show Me Where <ArrowRight size={18} />
            </button>
          </form>

          {!submitted && (
            <div className="mt-5 text-center text-sm text-slate-500">No neighborhood knowledge required. Start broad and let the market show you where the options are.</div>
          )}

          {error && <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>}

          {result && (
            <section id="buyer-explorer-results" className="mt-10 scroll-mt-5 md:scroll-mt-6">
              <ResultsAutoScroll />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-teal-700">📍 Here&apos;s where your budget fits</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.03em]">{money(criteria.maxPrice)} · {propertyLabel(criteria.propertyType)} · {criteria.minBeds ? `${criteria.minBeds}+ BR` : "Any BR"}</h2>
                  <p className="mt-2 text-slate-600">{result.totalChoiceCount.toLocaleString()} distinct options across {result.totalAreaCount} communities · {result.rawListingCount.toLocaleString()} matching Active/Pending listings.</p>
                </div>
                <BearingsDialog areas={[
                  ...result.areas.filter((a) => a.tier === "more").slice(0, 6),
                  ...result.areas.filter((a) => a.tier === "some").slice(0, 6),
                  ...result.areas.filter((a) => a.tier === "limited").slice(0, 6),
                ]} />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <TierCard title="Most options" emoji="🟢" tone="emerald" rows={result.areas.filter((a) => a.tier === "more").slice(0, 6)} criteria={criteria} />
                <TierCard title="Some options" emoji="🟡" tone="amber" rows={result.areas.filter((a) => a.tier === "some").slice(0, 6)} criteria={criteria} />
                <TierCard title="Limited, but possible" emoji="🔵" tone="sky" rows={result.areas.filter((a) => a.tier === "limited").slice(0, 6)} criteria={criteria} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                  <div className="flex gap-3"><Lightbulb className="mt-0.5 shrink-0 text-amber-700" size={20} /><div><h3 className="font-black">Quick tip</h3><p className="mt-1 text-sm leading-6 text-slate-700">These groups reflect availability for your search, not a judgment about which area is better. Lesser-known communities can surface when they genuinely offer more choices.</p></div></div>
                </div>
                <div className="rounded-3xl border border-violet-200 bg-violet-50/70 p-5">
                  <h3 className="font-black">🏘️ How options are counted</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700">A named development counts as one option, regardless of how many matching Active/Pending listings it contains or whether it is resale or pre-construction. Properties without a named development count individually. The listing totals remain visible so you can see the underlying inventory.</p>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function TierCard({ title, emoji, tone, rows, criteria }: { title: string; emoji: string; tone: "emerald"|"amber"|"sky"; rows: Awaited<ReturnType<typeof getBuyerExplorerResult>>["areas"]; criteria: BuyerExplorerCriteria }) {
  const tones = { emerald: "border-emerald-200 bg-emerald-50/65", amber: "border-amber-200 bg-amber-50/65", sky: "border-sky-200 bg-sky-50/65" } as const;
  return <div className={`rounded-3xl border p-5 ${tones[tone]}`}><h3 className="text-lg font-black">{emoji} {title}</h3><div className="mt-4 space-y-2">{rows.length ? rows.map((row) => <Link key={`${row.zoneName}-${row.areaName}-${row.name}`} href={areaSearchHref(row, criteria)} className="group flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm transition hover:bg-white"><span className="min-w-0 flex-1"><span className="block truncate font-black" title={row.name}>{row.name}</span><span className="block truncate text-xs text-slate-500" title={row.areaName && row.areaName !== row.name ? row.areaName : row.zoneName ?? undefined}>{row.areaName && row.areaName !== row.name ? row.areaName : row.zoneName}</span></span><span className="w-[58px] shrink-0 text-right leading-tight"><span className="block text-base font-black">{row.totalChoices}</span><span className="block text-[10px] font-bold text-slate-600">{row.totalChoices === 1 ? "option" : "options"}</span><span className="mt-0.5 block whitespace-nowrap text-[10px] text-slate-500">{row.rawListingCount} {row.rawListingCount === 1 ? "listing" : "listings"}</span></span></Link>) : <p className="text-sm text-slate-500">No communities in this group.</p>}</div></div>;
}

function areaSearchHref(row: { zoneName: string|null; areaName: string|null; name: string }, criteria: BuyerExplorerCriteria) {
  return buildPropertySearchUrl(
    { ...DEFAULT_PROPERTY_SEARCH_FILTERS, market: "resale", propertyType: criteria.propertyType, zone: row.zoneName, area: row.areaName, community: row.name, minBeds: criteria.minBeds || null, maxPrice: criteria.maxPrice },
    "/search-properties",
    "selected-market"
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>{children}</label>; }
const controlClass = "min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none transition focus:border-teal-500 focus:bg-white";
function first(value: string|string[]|undefined) { return Array.isArray(value) ? value[0] : value; }
function parseCriteria(params: Params): BuyerExplorerCriteria { const price = Number(first(params.maxPrice)); const beds = Number(first(params.minBeds)); const pt = first(params.propertyType); const region = first(params.region); return { maxPrice: Number.isFinite(price) && price > 0 ? price : 500000, minBeds: Number.isFinite(beds) && beds >= 0 ? beds : 2, propertyType: pt === "houses" || pt === "all" ? pt : "condos", region: region === "pv" || region === "nayarit" ? region : "all" }; }
function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function propertyLabel(value: BuyerPropertyType) { return value === "condos" ? "Condo" : value === "houses" ? "House" : "Condo or House"; }
