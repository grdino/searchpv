import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";

type DevelopmentSnapshot = {
  zone_name: string;
  area_name: string;
  community_name: string;
  development_name: string;

  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;

  snapshot_date: string | null;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;

  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
  avg_monthly_sales: number | null;

  avg_list_price: number | null;
  median_list_price: number | null;
  avg_list_price_ft2: number | null;
  median_list_price_ft2: number | null;
  avg_list_price_m2: number | null;
  median_list_price_m2: number | null;

  avg_sold_price: number | null;
  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  median_sold_price_ft2: number | null;
  avg_sold_price_m2: number | null;
  median_sold_price_m2: number | null;

  current_avg_dom: number | null;
  sold_avg_dom_12mo: number | null;
  months_inventory: number | null;
};

export default async function DevelopmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
  }>;
}) {
  const routeParams = await params;
  const queryParams = await searchParams;

  const selectedMarket = getMarketSegment(queryParams.market);
  const selectedPropertyType = getPropertyTypeSegment(queryParams.propertyType);

  const { data, error } = await supabase
    .from("development_snapshot")
    .select("*")
    .eq("development_slug", routeParams.slug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .order("active_count", { ascending: false })
    .limit(1);

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading development data.</p>
        <pre className="mt-4 text-sm">{error.message}</pre>
      </main>
    );
  }

  const row = (data?.[0] ?? null) as DevelopmentSnapshot | null;

  if (!row) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to SearchPV
        </Link>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">Development not found</h1>
          <p className="mt-2 text-slate-600">
            No development data is available for this filter combination.
          </p>
        </div>
      </main>
    );
  }

  const snapshotDate = row.snapshot_date
    ? formatDateOnly(row.snapshot_date)
    : "Unknown";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-slate-300 hover:underline">
            ← BACK TO SEARCHPV
          </Link>

          <p className="mt-8 text-sm uppercase tracking-widest text-slate-300">
            SearchPV Development Market Report
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {row.development_name}
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            {row.zone_name} &gt; {row.area_name} &gt;{" "}
            <Link
              href={`/communities/${row.community_slug}`}
              className="underline hover:text-white"
            >
              {row.community_name}
            </Link>
          </p>

          <p className="mt-1 mb-5 text-sm text-slate-300">
            Snapshot Date: {snapshotDate}
          </p>

          <DevelopmentSelectors
            slug={row.development_slug}
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
          />
        </div>
      </section>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "#334155",
          borderBottom: "1px solid #1e293b",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            textAlign: "center",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.area_name} &gt; {row.community_name} &gt;{" "}
          {row.development_name}

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {formatSelectedFilters(selectedMarket, selectedPropertyType)}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Active Listings" value={row.active_count ?? 0} />
          <MetricCard label="Pending Listings" value={row.pending_count ?? 0} />
          <MetricCard label="Closed Sales - 12 Mo" value={row.sales_12mo ?? 0} />

          <MetricCard
            label="Median List Price"
            value={formatMoney(row.median_list_price)}
          />
          <MetricCard
            label="Median Sold Price"
            value={formatMoney(row.median_sold_price)}
          />
          <MetricCard
            label="Months Inventory"
            value={formatNumber(row.months_inventory)}
          />

          <MetricCard
            label="Avg Sold $/ft²"
            value={formatMoney(row.avg_sold_price_ft2)}
          />
          <MetricCard
            label="Median Sold $/ft²"
            value={formatMoney(row.median_sold_price_ft2)}
          />
          <MetricCard
            label="Avg Monthly Sales"
            value={formatNumber(row.avg_monthly_sales)}
          />
        </div>

        <div className="mt-10 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            {row.development_name} Summary
          </h2>

          <p className="mt-4 leading-7 text-slate-700">
            For {formatMarketDescription(selectedMarket)}{" "}
            {formatPropertyTypeDescription(selectedPropertyType)} in{" "}
            <strong>{row.development_name}</strong>, there are currently{" "}
            <strong>{row.active_count ?? 0}</strong> active listings,{" "}
            <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
            <strong>{row.sales_12mo ?? 0}</strong> closed sales over the past 12
            months. Median sold price is{" "}
            <strong>{formatMoney(row.median_sold_price)}</strong>, with median
            sold pricing around{" "}
            <strong>{formatMoney(row.median_sold_price_ft2)}</strong> per
            square foot. Current months of inventory is{" "}
            <strong>{formatNumber(row.months_inventory)}</strong>.
          </p>
        </div>
      </section>
    </main>
  );
}

function DevelopmentSelectors({
  slug,
  selectedMarket,
  selectedPropertyType,
}: {
  slug: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
}) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "6px 6px",
    borderRadius: "999px",
    border: "1px solid #94a3b8",
    fontSize: "11px",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
    maxWidth: "360px",
  };

  const selectedStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: "#ffffff",
    color: "#020617",
    borderColor: "#ffffff",
  };

  const unselectedStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: "transparent",
    color: "#ffffff",
  };

  return (
    <div className="mt-6">
      <div style={rowStyle}>
        <a
          href={developmentHref(slug, selectedMarket, "all")}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>
        <a
          href={developmentHref(slug, selectedMarket, "condos")}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>
        <a
          href={developmentHref(slug, selectedMarket, "houses")}
          style={
            selectedPropertyType === "houses" ? selectedStyle : unselectedStyle
          }
        >
          Houses
        </a>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <a
          href={developmentHref(slug, "all", selectedPropertyType)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>
        <a
          href={developmentHref(slug, "pre_construction", selectedPropertyType)}
          style={
            selectedMarket === "pre_construction"
              ? selectedStyle
              : unselectedStyle
          }
        >
          Pre-Construction
        </a>
        <a
          href={developmentHref(slug, "resale", selectedPropertyType)}
          style={selectedMarket === "resale" ? selectedStyle : unselectedStyle}
        >
          Resale
        </a>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}

function developmentHref(
  slug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const queryString = params.toString();

  return queryString
    ? `/developments/${slug}?${queryString}`
    : `/developments/${slug}`;
}

function getMarketSegment(value?: string): MarketSegment {
  if (value === "pre_construction") return "pre_construction";
  if (value === "resale") return "resale";
  return "all";
}

function getPropertyTypeSegment(value?: string): PropertyTypeSegment {
  if (value === "condos") return "condos";
  if (value === "houses") return "houses";
  return "all";
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

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMarketDescription(value: MarketSegment) {
  if (value === "pre_construction") return "pre-construction";
  if (value === "resale") return "resale";
  return "all market";
}

function formatPropertyTypeDescription(value: PropertyTypeSegment) {
  if (value === "condos") return "condos";
  if (value === "houses") return "houses";
  return "properties";
}

function formatSelectedFilters(
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const parts: string[] = [];

  if (propertyType === "all") {
    parts.push("Condos", "Houses");
  } else if (propertyType === "condos") {
    parts.push("Condos");
  } else {
    parts.push("Houses");
  }

  if (market === "all") {
    parts.push("Resale", "Pre-Construction");
  } else if (market === "resale") {
    parts.push("Resale");
  } else {
    parts.push("Pre-Construction");
  }

  return parts.join(" | ");
}