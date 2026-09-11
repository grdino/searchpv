import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";

import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ mls: string }>;
  searchParams: Promise<{ return?: string }>;
};

type SubjectListing = {
  mls: number;
  listing_status: string;
  address: string | null;
  development_name: string | null;
  community_name: string | null;
  area_name: string | null;
  prprty_type: string | null;
  property_type_segment: string | null;
  market_type: string | null;
  beds: number;
  baths: number;
  sqm: number;
  current_price: number;
  price_per_sqm: number;
  dom: number;
  snapshot_date: string;
};

type ComparisonRow = {
  subject_mls: number;
  comparison_section: "current_competition" | "recent_sales";
  diagnostic_rank: number;
  comp_mls: number;
  comp_status: string;
  similarity_score: number;
  match_quality: "strong" | "good" | "broader" | "omit";
  primary_geography_reason: string;
  comp_development_name: string | null;
  comp_community_name: string | null;
  comp_area_name: string | null;
  distance_m: number | null;
  subject_beds: number;
  comp_beds: number;
  subject_baths: number;
  comp_baths: number;
  size_difference_pct: number;
  subject_price: number;
  comp_price: number;
  subject_price_per_sqm: number;
  comp_price_per_sqm: number;
  comp_dom: number;
  sold_date: string | null;
  sold_to_final_list_pct: number | null;
  limitation_codes: string[] | null;
  snapshot_date: string;
};

type UnitRow = { mls: number; unit_id?: string | null; unit?: string | null };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mls } = await params;
  return {
    title: `How MLS ${mls} Compares`,
    description: `A factual comparison of MLS ${mls} with similar current listings and recent sales.`,
    robots: { index: false, follow: true },
  };
}

export default async function PropertyComparisonPage({ params, searchParams }: PageProps) {
  const [{ mls: rawMls }, query] = await Promise.all([params, searchParams]);
  if (!/^\d+$/.test(rawMls)) notFound();

  const mls = Number(rawMls);
  const [subjectResponse, comparisonResponse] = await Promise.all([
    supabase
      .from("current_search_listing")
      .select("mls,listing_status,address,development_name,community_name,area_name,prprty_type,property_type_segment,market_type,beds,baths,sqm,current_price,price_per_sqm,dom,snapshot_date")
      .eq("mls", mls)
      .maybeSingle(),
    supabase.rpc("internal_listing_comparison_diagnostic", {
      p_mls: mls,
      /* Fetch enough ranked candidates to balance local and nearby context. */
      p_candidate_limit: 10,
    }),
  ]);

  if (subjectResponse.error || comparisonResponse.error) {
    throw new Error(subjectResponse.error?.message || comparisonResponse.error?.message);
  }
  if (!subjectResponse.data) notFound();

  const subject = subjectResponse.data as SubjectListing;
  const rows = (comparisonResponse.data ?? []) as ComparisonRow[];
  const currentRows = credible(rows, "current_competition");
  const closedRows = credible(rows, "recent_sales");
  const currentPositionRows = localMarketRows(currentRows);
  const closedPositionRows = localMarketRows(closedRows);

  const currentMlsNumbers = [mls, ...currentRows.map((row) => row.comp_mls)];
  const [activeUnitsResponse, pendingUnitsResponse, closedUnitsResponse] = await Promise.all([
    currentMlsNumbers.length
      ? supabase
          .from("active_listing")
          .select("mls,unit_id")
          .in("mls", currentMlsNumbers)
      : Promise.resolve({ data: [] as UnitRow[], error: null }),
    currentMlsNumbers.length
      ? supabase
          .from("pending_listing")
          .select("mls,unit_id")
          .in("mls", currentMlsNumbers)
      : Promise.resolve({ data: [] as UnitRow[], error: null }),
    closedRows.length
      ? supabase
          .from("closed_listing_detail")
          .select("mls,unit")
          .in("mls", closedRows.map((row) => row.comp_mls))
      : Promise.resolve({ data: [] as UnitRow[], error: null }),
  ]);

  const unitByMls = new Map<number, string>();
  for (const row of [
    ...(activeUnitsResponse.data ?? []),
    ...(pendingUnitsResponse.data ?? []),
    ...(closedUnitsResponse.data ?? []),
  ] as UnitRow[]) {
    const unit = cleanUnit(row.unit_id ?? row.unit ?? null);
    if (unit) unitByMls.set(Number(row.mls), unit);
  }

  const returnUrl = safeIdxReturnUrl(query.return) ?? buildIdxUrl(String(mls));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10 print:bg-white print:px-0 print:py-4 print:text-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="relative print:hidden">
            <Header />
            <div className="absolute right-0 top-0 z-50"><HamburgerMenu /></div>
          </div>
          <div className="print:hidden"><MainSloganBranding /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-300 print:mt-0 print:text-slate-500">
            SearchPV property comparison
          </p>
          <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">How does this property compare?</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 print:text-slate-600">
                A concise, factual view of the listing&apos;s position among similar properties currently competing for buyers and recently sold.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link href={returnUrl} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300">
                ← Return to listing
              </Link>
              <PrintButton />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8">
        <SubjectCard subject={subject} unit={unitByMls.get(mls) ?? null} />
        <MarketPosition subject={subject} currentRows={currentPositionRows} closedRows={closedPositionRows} />
        <ComparisonSection title="Current Competition" description="Active and Pending listings competing for buyers now. Pending contract prices are not available." rows={currentRows} unitByMls={unitByMls} showUnits={subject.property_type_segment === "condos"} subjectCommunity={subject.community_name} />
        <ComparisonSection title="Recent Sales" description="Comparable closed sales from the past 12 months, extended to 18 months only when recent evidence is limited." rows={closedRows} unitByMls={unitByMls} showUnits={subject.property_type_segment === "condos"} subjectCommunity={subject.community_name} />

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          <h2 className="font-bold text-slate-950">What this comparison can—and cannot—show</h2>
          <p className="mt-2">
            SearchPV selects similar listings from MLS location, property type, market type, bedrooms, bathrooms, interior size and available property attributes. Price is shown but is never used to select or rank a comparable.
          </p>
          <p className="mt-2">
            MLS information can be incomplete, inconsistent or entered differently by individual agents. Pending prices are asking prices because accepted contract prices are unavailable. This is market context, not an appraisal or estimate of value.
          </p>
          <p className="mt-2 text-xs">Data snapshot: {formatDate(subject.snapshot_date)}. Status and availability may have changed.</p>
        </section>
      </div>
    </main>
  );
}

function SubjectCard({ subject, unit: suppliedUnit }: { subject: SubjectListing; unit: string | null }) {
  const isCondo = subject.property_type_segment === "condos";
  const unit = isCondo ? suppliedUnit : null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Subject
            </span>

            <StatusBadge status={subject.listing_status} />
          </div>
          <h2 className="mt-1 text-2xl font-black">
            {subject.development_name || subject.address || `MLS #${subject.mls}`}{unit ? ` · Unit ${unit}` : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-600">MLS #{subject.mls} · {subject.community_name || "Community unavailable"}{subject.area_name ? ` · ${subject.area_name}` : ""}</p>
        </div>
        <div className="md:text-right">
          <p className="text-2xl font-black">{formatMoney(subject.current_price)}</p>
          <p className="text-sm text-slate-500">{formatMoney(subject.price_per_sqm)}/m²</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="Type" value={subject.prprty_type || "Unknown"} />
        <Fact label="Market" value={subject.market_type || "Unknown"} />
        <Fact label="Beds" value={formatNumber(subject.beds)} />
        <Fact label="Baths" value={formatNumber(subject.baths)} />
        <Fact label="Interior" value={`${formatNumber(subject.sqm)} m²`} />
        <Fact label="DOM" value={formatNumber(subject.dom)} />
      </div>
    </section>
  );
}

function MarketPosition({ subject, currentRows, closedRows }: { subject: SubjectListing; currentRows: ComparisonRow[]; closedRows: ComparisonRow[] }) {
  const currentPrice = median(currentRows.map((row) => row.comp_price));
  const currentPsm = median(currentRows.map((row) => row.comp_price_per_sqm));
  const currentSqm = median(currentRows.map((row) => subject.sqm * (1 + row.size_difference_pct / 100)));
  const currentDom = median(currentRows.map((row) => row.comp_dom));
  const soldPrice = median(closedRows.map((row) => row.comp_price));
  const soldPsm = median(closedRows.map((row) => row.comp_price_per_sqm));
  const soldRatio = median(closedRows.map((row) => row.sold_to_final_list_pct));

  return (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-800">At a glance</p>
          <h2 className="mt-1 text-2xl font-black">Market position</h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">Medians of selected local comparisons</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PositionCard label="Asking price" value={relativeText(subject.current_price, currentPrice)} detail={sampleText(currentRows.length, "current listing")} />
        <PositionCard label="Price per m²" value={relativeText(subject.price_per_sqm, currentPsm)} detail={currentPsm === null ? "Insufficient current data" : `${formatMoney(currentPsm)}/m² competitor median`} />
        <PositionCard label="Interior size" value={relativeText(subject.sqm, currentSqm)} detail={currentSqm === null ? "Insufficient current data" : `${formatNumber(currentSqm)} m² competitor median`} />
        <PositionCard label="Days on market" value={dayDifferenceText(subject.dom, currentDom)} detail={currentDom === null ? "Insufficient current data" : `${formatNumber(currentDom)} day competitor median`} />
      </div>
      <div className="mt-5 border-t border-amber-200 pt-5">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Recent-sale context</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <PositionCard label="Subject ask vs sold prices" value={relativeText(subject.current_price, soldPrice)} detail={sampleText(closedRows.length, "recent sale")} />
          <PositionCard label="Subject $/m² vs sold" value={relativeText(subject.price_per_sqm, soldPsm)} detail={soldPsm === null ? "Insufficient sold data" : `${formatMoney(soldPsm)}/m² sold median`} />
          <PositionCard label="Sold vs final asking" value={soldRatio === null ? "Insufficient data" : `${formatNumber(soldRatio, 1)}% median`} detail="Accepted pending prices are unavailable" />
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({ title, description, rows, unitByMls, showUnits, subjectCommunity }: { title: string; description: string; rows: ComparisonRow[]; unitByMls: Map<number, string>; showUnits: boolean; subjectCommunity: string | null }) {
  const hasCloseLocalMatch = rows.some((row) =>
    isLocalRow(row) &&
    row.comp_beds === row.subject_beds &&
    Math.abs(row.size_difference_pct) <= 20
  );
  const hasLocalContext = rows.some(isLocalRow);
  const hasNearbyContext = rows.some((row) => !isLocalRow(row));
  const showMixedContextNotice = !hasCloseLocalMatch && hasLocalContext && hasNearbyContext;

  return (
    <section className="mt-10">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p></div>
        <p className="text-sm font-semibold text-slate-500">{sampleText(rows.length, "credible comparison")}</p>
      </div>
      {showMixedContextNotice && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-black">No closely equivalent comparison was found in {subjectCommunity || "the subject community"}.</p>
          <p className="mt-1">
            Local-community listings are included to show local pricing, although their bedroom count or interior size differs. Listings from nearby communities are also included because they are closer in size or bedroom count, but prices can differ substantially by community. No pricing adjustments have been made for any of these differences.
          </p>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No sufficiently credible comparisons were found.</div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => <CandidateCard key={`${row.comparison_section}-${row.comp_mls}`} row={row} unit={showUnits ? unitByMls.get(row.comp_mls) ?? null : null} subjectCommunity={subjectCommunity} />)}
        </div>
      )}
    </section>
  );
}

function CandidateCard({ row, unit, subjectCommunity }: { row: ComparisonRow; unit: string | null; subjectCommunity: string | null }) {
  const isClosed = row.comparison_section === "recent_sales";
  const href = isClosed ? `/market-intelligence/closed-sales/${row.comp_mls}` : buildIdxUrl(String(row.comp_mls));
  return (
    <article className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">#{row.diagnostic_rank}</span><ContextBadge row={row} subjectCommunity={subjectCommunity} /><QualityBadge quality={row.match_quality} /></div>
          <h3 className="mt-3 text-lg font-black">{row.comp_development_name || `MLS #${row.comp_mls}`}{unit ? ` · Unit ${unit}` : ""}</h3>
          <p className="mt-1 text-sm text-slate-600">
            <Link href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 hover:underline">MLS #{row.comp_mls} ↗</Link>
            <span className="mx-1 text-slate-400">·</span>

            <StatusBadge status={row.comp_status} />

            {row.comp_community_name && (
              <>
                <span className="mx-1 text-slate-400">·</span>
                {row.comp_community_name}
              </>
            )}
          </p>
        </div>
        <div className="text-right"><p className="font-black">{formatMoney(row.comp_price)}</p><p className="text-xs text-slate-500">{formatMoney(row.comp_price_per_sqm)}/m²</p></div>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-bold">{sentenceCase(row.primary_geography_reason)}</p>
        <p className="mt-1 text-slate-600">{formatDistance(row.distance_m)} · {formatSizeDifference(row.size_difference_pct)}{row.comp_beds === row.subject_beds ? " · Same bedroom count" : ` · ${formatSigned(row.comp_beds - row.subject_beds)} bedroom difference`}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Beds" value={formatNumber(row.comp_beds)} />
        <Fact label="Baths" value={formatNumber(row.comp_baths)} />
        <Fact label="DOM" value={formatNumber(row.comp_dom)} />
        <Fact
          label={isClosed ? "Sold" : "Status"}
          value={
            isClosed
              ? formatDate(row.sold_date)
              : <StatusBadge status={row.comp_status} />
          }
        />
      </div>
      {row.sold_to_final_list_pct !== null && <p className="mt-3 text-sm text-slate-600">Sold for {formatNumber(row.sold_to_final_list_pct, 1)}% of final asking price.</p>}
      {(row.limitation_codes ?? []).length > 0 && <div className="mt-4 border-t border-slate-200 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Comparison notes</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{(row.limitation_codes ?? []).map((code) => <li key={code}>• {limitationText(code)}</li>)}</ul></div>}
    </article>
  );
}

function credible(rows: ComparisonRow[], section: ComparisonRow["comparison_section"]) {
  const eligible = rows.filter(
    (row) => row.comparison_section === section && row.match_quality !== "omit"
  );
  const local = eligible.filter(isLocalRow);
  const nearby = eligible.filter((row) => !isLocalRow(row));
  const hasCloseLocalMatch = local.some(
    (row) => row.comp_beds === row.subject_beds && Math.abs(row.size_difference_pct) <= 20
  );

  if (hasCloseLocalMatch || local.length === 0 || nearby.length === 0) {
    return eligible.slice(0, 5);
  }

  /*
   * When the community has no close physical match, show both sides of the
   * evidence: up to three local pricing references and two nearby physical
   * references. Neither group is represented as an adjusted valuation.
   */
  const selected = [...local.slice(0, 3), ...nearby.slice(0, 2)];
  const selectedMls = new Set(selected.map((row) => row.comp_mls));

  for (const row of eligible) {
    if (selected.length >= 5) break;
    if (!selectedMls.has(row.comp_mls)) {
      selected.push(row);
      selectedMls.add(row.comp_mls);
    }
  }

  return selected;
}

function isLocalRow(row: ComparisonRow) {
  return !(row.limitation_codes ?? []).includes(
    "GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY"
  );
}

/*
 * Broader geographic fallbacks can still be shown as useful context, but they
 * must not drive the headline market-position medians. Comparison-development
 * aliases remain eligible even when their raw MLS community labels differ.
 */
function localMarketRows(rows: ComparisonRow[]) {
  return rows.filter((row) => {
    const expandedBeyondCommunity = (row.limitation_codes ?? []).includes(
      "GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY"
    );

    return (
      !expandedBeyondCommunity ||
      row.primary_geography_reason === "same comparison development"
    );
  });
}

function PositionCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-amber-200 bg-white p-4"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>;
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-1 font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const style =
    normalized === "active"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "pending"
        ? "bg-amber-100 text-amber-900"
        : normalized === "closed"
          ? "bg-sky-100 text-sky-800"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {sentenceCase(status)}
    </span>
  );
}

function QualityBadge({ quality }: { quality: ComparisonRow["match_quality"] }) {
  const style = quality === "strong" ? "bg-emerald-100 text-emerald-800" : quality === "good" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-900";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{sentenceCase(quality)} match</span>;
}

function ContextBadge({ row, subjectCommunity }: { row: ComparisonRow; subjectCommunity: string | null }) {
  const local = isLocalRow(row);
  const hasPhysicalDifference =
    row.comp_beds !== row.subject_beds || Math.abs(row.size_difference_pct) > 20;

  const label = !local
    ? "Nearby physical context"
    : hasPhysicalDifference
      ? `${subjectCommunity || "Local"} pricing context`
      : "Local comparable";

  const style = !local
    ? "bg-violet-100 text-violet-800"
    : hasPhysicalDifference
      ? "bg-cyan-100 text-cyan-800"
      : "bg-emerald-100 text-emerald-800";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>;
}

function median(values: Array<number | null>) {
  const clean = values
    .filter((value): value is number => value !== null && Number.isFinite(Number(value)))
    .map(Number)
    .sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function relativeText(subject: number, comparison: number | null) {
  if (comparison === null || comparison === 0) return "Insufficient data";
  const difference = ((Number(subject) / comparison) - 1) * 100;
  if (Math.abs(difference) < 0.5) return "Near the median";
  return `${formatNumber(Math.abs(difference), 1)}% ${difference > 0 ? "above" : "below"}`;
}

function dayDifferenceText(subject: number, comparison: number | null) {
  if (comparison === null) return "Insufficient data";
  const difference = Math.round(Number(subject) - comparison);
  if (difference === 0) return "Same as median";
  return `${formatNumber(Math.abs(difference))} days ${difference > 0 ? "longer" : "shorter"}`;
}

function sampleText(count: number, singular: string) { return `${count} ${singular}${count === 1 ? "" : "s"}`; }

function safeIdxReturnUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "idx.searchpv.com" ? url.toString() : null;
  } catch { return null; }
}

function cleanUnit(value: string | null) {
  const unit = value?.replace(/\s+/g, " ").trim();
  if (!unit || /^(?:n\/?a|none|null|unknown|0|-|--)$/i.test(unit)) return null;
  return unit;
}

function limitationText(code: string) {
  const messages: Record<string, string> = {
    BEDROOM_COUNT_RELAXED: "Bedroom count was relaxed because closer local matches were limited.",
    SIZE_BAND_RELAXED: "Interior size differs by more than 20%.",
    NOT_SAME_COMPARISON_DEVELOPMENT: "This is not the same development.",
    SAME_DEVELOPMENT_LOCATION_CONFLICT: "The MLS development name matches, but the reported locations conflict.",
    GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY: "The MLS community label differs from the subject.",
    BATHROOM_DATA_INCONSISTENT: "The MLS bathroom entry appears inconsistent and was not scored.",
    OCEAN_VIEW_UNKNOWN: "Ocean-view information is missing for one property.",
    PENDING_CONTRACT_PRICE_UNAVAILABLE: "The accepted contract price for this Pending listing is unavailable.",
    CLOSED_ATTRIBUTES_UNAVAILABLE: "Some historical listing attributes are unavailable.",
    CLOSED_PERIOD_EXPANDED_TO_18_MONTHS: "The recent-sale period was expanded beyond 12 months.",
  };
  return messages[code] ?? sentenceCase(code.replaceAll("_", " "));
}

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function formatNumber(value: number | null, maximumFractionDigits = 0) {
  if (value === null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatDistance(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return "Distance unavailable";
  return value < 1000 ? `${formatNumber(value)} m away` : `${formatNumber(value / 1000, 1)} km away`;
}

function formatSizeDifference(value: number) {
  if (Math.abs(Number(value)) < 0.05) return "Same interior size";
  return `${formatNumber(Math.abs(Number(value)), 1)}% ${Number(value) >= 0 ? "larger" : "smaller"}`;
}

function formatSigned(value: number) { return value > 0 ? `+${formatNumber(value)}` : formatNumber(value); }
function sentenceCase(value: string) { return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : ""; }
