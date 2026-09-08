import Link from "next/link";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  mls?: string;
}>;

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
  geography_points: number;
  size_points: number;
  bedroom_points: number;
  bathroom_points: number;
  feature_points: number;
  recency_points: number | null;
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
  data_current_as_of: string;
};

type SubjectListing = {
  mls: number;
  listing_status: string;
  address: string | null;
  development_name: string | null;
  community_name: string | null;
  area_name: string | null;
  prprty_type: string | null;
  market_type: string | null;
  beds: number;
  baths: number;
  sqm: number;
  current_price: number;
  price_per_sqm: number;
  dom: number;
  snapshot_date: string;
};

const TEST_SUBJECTS = [39537, 42019, 42782, 43394, 44568, 44733];

export default async function ListingComparisonDiagnosticPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawMls = params.mls?.trim() ?? "";
  const selectedMls = /^\d+$/.test(rawMls) ? Number(rawMls) : null;
  const invalidMls = rawMls.length > 0 && selectedMls === null;

  let subject: SubjectListing | null = null;
  let rows: ComparisonRow[] = [];
  let loadError: string | null = null;

  if (selectedMls !== null) {
    const supabase = await createClient();
    const [subjectResponse, comparisonResponse] = await Promise.all([
      supabase
        .from("current_search_listing")
        .select(
          "mls,listing_status,address,development_name,community_name,area_name,prprty_type,market_type,beds,baths,sqm,current_price,price_per_sqm,dom,snapshot_date",
        )
        .eq("mls", selectedMls)
        .maybeSingle(),
      supabase.rpc("internal_listing_comparison_diagnostic", {
        p_mls: selectedMls,
        p_candidate_limit: 5,
      }),
    ]);

    if (subjectResponse.error) {
      loadError = subjectResponse.error.message;
    } else if (comparisonResponse.error) {
      loadError = comparisonResponse.error.message;
    } else {
      subject = subjectResponse.data as SubjectListing | null;
      rows = (comparisonResponse.data ?? []) as ComparisonRow[];
    }
  }

  const currentRows = rows.filter(
    (row) => row.comparison_section === "current_competition",
  );
  const closedRows = rows.filter(
    (row) => row.comparison_section === "recent_sales",
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Header />
            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Office · Comparison Validation
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Listing Comparison Diagnostic
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Inspect SearchPV&apos;s recommended current competitors and recent
            sales before the comparison experience is released publicly.
          </p>

          <form
            method="get"
            className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="mls">
              Subject MLS number
            </label>
            <input
              id="mls"
              name="mls"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={rawMls}
              placeholder="Enter subject MLS number"
              className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Compare
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="py-1 text-slate-400">Test subjects:</span>
            {TEST_SUBJECTS.map((mls) => (
              <Link
                key={mls}
                href={`/office/listing-comparison?mls=${mls}`}
                className="rounded-full border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:border-amber-400 hover:text-white"
              >
                {mls}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-7xl text-sm font-semibold text-slate-600">
          <Link href="/office" className="hover:text-slate-950 hover:underline">
            Office
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          Listing Comparison
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {invalidMls && (
          <Notice tone="error">
            Enter an MLS number using digits only.
          </Notice>
        )}

        {loadError && (
          <Notice tone="error">
            <strong>Unable to load the diagnostic.</strong>
            <span className="mt-1 block">{loadError}</span>
            <span className="mt-2 block text-xs">
              Confirm that database/functions/internal/060_internal_listing_comparison_diagnostic.sql
              has been run in Supabase.
            </span>
          </Notice>
        )}

        {selectedMls !== null && !loadError && !subject && (
          <Notice tone="neutral">
            MLS #{selectedMls} is not present in the current Active/Pending
            inventory and cannot be used as a subject.
          </Notice>
        )}

        {!rawMls && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">Choose a subject listing</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Enter any current Active or Pending MLS number, or select one of
              the six validation subjects above. The page returns five ranked
              candidates per section; the first three represent the proposed
              public result.
            </p>
          </div>
        )}

        {subject && (
          <>
            <SubjectSummary subject={subject} />

            <ComparisonSection
              title="Current Competition"
              description="Active and Pending properties competing for buyers now. Pending contract prices are not available."
              rows={currentRows}
            />

            <ComparisonSection
              title="Recent Sales"
              description="Closed properties from the normal 12-month pool, expanded to 18 months only when recent good matches are limited."
              rows={closedRows}
            />

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
              <h2 className="font-bold text-slate-950">Diagnostic rules</h2>
              <p className="mt-2">
                Price is displayed but never used to choose or score a
                comparable. Missing MLS attributes remain unknown. Scores are
                internal validation aids and will not be shown on the public
                comparison. Floor number is excluded.
              </p>
              <p className="mt-2">
                Data current as of {formatDate(subject.snapshot_date)}. Listing
                status and availability may have changed afterward.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SubjectSummary({ subject }: { subject: SubjectListing }) {
  const title =
    subject.development_name || subject.address || `MLS #${subject.mls}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Subject · {subject.listing_status}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            MLS #{subject.mls} · {subject.community_name || "Unknown community"}
            {subject.area_name ? ` · ${subject.area_name}` : ""}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-2xl font-black">{formatMoney(subject.current_price)}</p>
          <p className="text-sm text-slate-500">
            {formatMoney(subject.price_per_sqm)}/m²
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Fact label="Type" value={subject.prprty_type || "Unknown"} />
        <Fact label="Market" value={subject.market_type || "Unknown"} />
        <Fact label="Beds" value={formatNumber(subject.beds)} />
        <Fact label="Full baths" value={formatNumber(subject.baths)} />
        <Fact label="Interior" value={`${formatNumber(subject.sqm)} m²`} />
        <Fact label="DOM" value={formatNumber(subject.dom)} />
      </div>
    </section>
  );
}

function ComparisonSection({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: ComparisonRow[];
}) {
  const credibleRows = rows.filter((row) => row.match_quality !== "omit");

  return (
    <section className="mt-10">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          {credibleRows.length} credible candidate
          {credibleRows.length === 1 ? "" : "s"} in the first five
        </p>
      </div>

      {rows.length === 0 ? (
        <Notice tone="neutral">
          No eligible candidates were found for this section.
        </Notice>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <CandidateCard key={`${row.comparison_section}-${row.comp_mls}`} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateCard({ row }: { row: ComparisonRow }) {
  const isDefault = row.diagnostic_rank <= 3 && row.match_quality !== "omit";
  const limitations = row.limitation_codes ?? [];

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        isDefault ? "border-emerald-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">
              #{row.diagnostic_rank}
            </span>
            <QualityBadge quality={row.match_quality} />
            {isDefault && (
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Default comp
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-bold">
            {row.comp_development_name || `MLS #${row.comp_mls}`}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            MLS #{row.comp_mls} · {row.comp_status}
            {row.comp_community_name ? ` · ${row.comp_community_name}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-black">{formatMoney(row.comp_price)}</p>
          <p className="text-xs text-slate-500">
            {formatMoney(row.comp_price_per_sqm)}/m²
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-bold text-slate-900">
          {sentenceCase(row.primary_geography_reason)}
        </p>
        <p className="mt-1 text-slate-600">
          {formatDistance(row.distance_m)} · {formatSizeDifference(row.size_difference_pct)}
          {row.comp_beds !== row.subject_beds
            ? ` · ${formatSigned(row.comp_beds - row.subject_beds)} bedroom difference`
            : " · Same bedroom count"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Beds" value={formatNumber(row.comp_beds)} />
        <Fact label="Baths" value={formatNumber(row.comp_baths)} />
        <Fact label="DOM" value={formatNumber(row.comp_dom)} />
        <Fact
          label={row.sold_date ? "Sold" : "Status"}
          value={row.sold_date ? formatDate(row.sold_date) : sentenceCase(row.comp_status)}
        />
      </div>

      {row.sold_to_final_list_pct !== null && (
        <p className="mt-3 text-sm text-slate-600">
          Sold for {formatPercent(row.sold_to_final_list_pct)} of final asking price.
        </p>
      )}

      {limitations.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Selection and data notes
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {limitations.map((code) => (
              <li key={code}>• {limitationText(code)}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-4 border-t border-slate-200 pt-3 text-sm">
        <summary className="cursor-pointer font-bold text-slate-700">
          Diagnostic score: {formatNumber(row.similarity_score, 1)}
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 sm:grid-cols-6">
          <Score label="Geography" value={row.geography_points} />
          <Score label="Size" value={row.size_points} />
          <Score label="Bedrooms" value={row.bedroom_points} />
          <Score label="Bathrooms" value={row.bathroom_points} />
          <Score label="Features" value={row.feature_points} />
          <Score label="Recency" value={row.recency_points} />
        </div>
      </details>
    </article>
  );
}

function QualityBadge({ quality }: { quality: ComparisonRow["match_quality"] }) {
  const styles = {
    strong: "bg-emerald-100 text-emerald-800",
    good: "bg-sky-100 text-sky-800",
    broader: "bg-amber-100 text-amber-900",
    omit: "bg-rose-100 text-rose-800",
  }[quality];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>
      {sentenceCase(quality)}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg bg-slate-100 px-2 py-2 text-center">
      <span className="block font-bold text-slate-900">{value ?? "—"}</span>
      {label}
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-5 rounded-xl border p-4 text-sm ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}

function limitationText(code: string) {
  const messages: Record<string, string> = {
    BEDROOM_COUNT_RELAXED: "Bedroom count was expanded by one.",
    SIZE_BAND_RELAXED: "Interior size differs by more than 20%.",
    NOT_SAME_COMPARISON_DEVELOPMENT: "This is not the same development.",
    GEOGRAPHY_EXPANDED_BEYOND_COMMUNITY:
      "The MLS community label differs from the subject.",
    BATHROOM_DATA_INCONSISTENT:
      "The MLS bathroom entry appears inconsistent and was not scored.",
    OCEAN_VIEW_UNKNOWN: "Ocean-view information is missing for one property.",
    PENDING_CONTRACT_PRICE_UNAVAILABLE:
      "The accepted contract price for a Pending listing is unavailable.",
    CLOSED_ATTRIBUTES_UNAVAILABLE:
      "Some historical listing attributes are unavailable.",
    CLOSED_PERIOD_EXPANDED_TO_18_MONTHS:
      "The recent-sale period was expanded beyond 12 months.",
  };

  return messages[code] ?? sentenceCase(code.replaceAll("_", " "));
}

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatNumber(value: number | null, maximumFractionDigits = 0) {
  if (value === null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(
    Number(value),
  );
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return "—";
  return `${formatNumber(value, 1)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDistance(value: number | null) {
  if (value === null || !Number.isFinite(Number(value))) return "Distance unknown";
  if (value < 1000) return `${formatNumber(value)} m away`;
  return `${formatNumber(value / 1000, 1)} km away`;
}

function formatSizeDifference(value: number) {
  const amount = Math.abs(Number(value));
  if (amount < 0.05) return "Same interior size";
  return `${formatNumber(amount, 1)}% ${Number(value) >= 0 ? "larger" : "smaller"}`;
}

function formatSigned(value: number) {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function sentenceCase(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

