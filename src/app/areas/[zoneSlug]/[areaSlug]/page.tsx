import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";

type AreaSnapshot = {
  zone_name: string;
  zone_slug: string;
  area_name: string;
  area_slug: string;
  snapshot_date: string | null;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;

  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;

  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  months_inventory: number | null;

  community_count: number | null;
};

type PageContent = {
  title: string | null;
  body: string;
};

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{
    zoneSlug: string;
    areaSlug: string;
  }>;
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
    .from("area_snapshot")
    .select("*")
    .eq("zone_slug", routeParams.zoneSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .maybeSingle();

    const { data: contentData, error: contentError } = await supabase
      .from("page_content")
      .select("title, body")
      .eq("content_type", "description")
      .eq("entity_type", "area")
      .eq("entity_slug", routeParams.areaSlug)
      .eq("zone_slug", routeParams.zoneSlug)
      .order("sort_order", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading area data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? contentError?.message}
        </pre>
      </main>
    );
  }

  const row = data as AreaSnapshot | null;
  const contentRows = (contentData ?? []) as PageContent[];

  if (!row) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to SearchPV
        </Link>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">Area not found</h1>
          <p className="mt-2 text-slate-600">
            No area data is available for this filter combination.
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
          <Link
            href={homeHref(
              selectedMarket,
              selectedPropertyType,
              row.zone_name,
              row.area_name
            )}
            className="text-sm text-slate-300 hover:underline"
          >
            ← BACK TO COMMUNITY LIST
          </Link>

          <p className="mt-8 text-sm uppercase tracking-widest text-slate-300">
            Puerto Vallarta Market Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {row.area_name} Market Report
          </h1>

          <p className="mt-1 mb-5 text-sm text-slate-300">
            Snapshot Date: {snapshotDate}
          </p>

          <AreaSelectors
            zoneSlug={row.zone_slug}
            areaSlug={row.area_slug}
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
          />
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-2 shadow-sm md:px-8">
        <div
          className="mx-auto max-w-6xl overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-semibold text-slate-700"
          title={`${row.zone_name} > ${row.area_name}`}
        >
          {row.zone_name} &gt; {row.area_name}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Active Listings" value={row.active_count ?? 0} />
          <MetricCard label="Pending Listings" value={row.pending_count ?? 0} />
          <MetricCard label="Closed Sales - 12 Mo" value={row.sales_12mo ?? 0} />

          <MetricCard
            label="Median Sold Price"
            value={formatMoney(row.median_sold_price)}
          />
          <MetricCard
            label="Avg Sold $/ft²"
            value={formatMoney(row.avg_sold_price_ft2)}
          />
          <MetricCard
            label="Months Inventory"
            value={formatNumber(row.months_inventory)}
          />
        </div>

        <div className="mt-10 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Area Summary</h2>

          <p className="mt-4 leading-7 text-slate-700">
            For {formatMarketDescription(selectedMarket)}{" "}
            {formatPropertyTypeDescription(selectedPropertyType)} in{" "}
            {row.area_name}, there are currently{" "}
            <strong>{row.active_count ?? 0}</strong> active listings,{" "}
            <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
            <strong>{row.sales_12mo ?? 0}</strong> closed sales over the past 12
            months across <strong>{row.community_count ?? 0}</strong>{" "}
            communities. The median sold price is{" "}
            <strong>{formatMoney(row.median_sold_price)}</strong>, with average
            sold pricing around{" "}
            <strong>{formatMoney(row.avg_sold_price_ft2)}</strong> per square
            foot. Current months of inventory is{" "}
            <strong>{formatNumber(row.months_inventory)}</strong>.
          </p>
        </div>

        {contentRows.length > 0 && (
          <div className="mt-2 rounded-xl bg-white p-8 shadow">
            {contentRows.map((content) => (
              <div key={content.title ?? content.body.slice(0, 40)}>
                <h2 className="text-2xl font-bold">
                  {content.title ?? `About ${row.area_name}`}
                </h2>

                <p className="mt-4 leading-7 text-slate-700">
                  {content.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function AreaSelectors({
  zoneSlug,
  areaSlug,
  selectedMarket,
  selectedPropertyType,
}: {
  zoneSlug: string;
  areaSlug: string;
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
          href={areaHref(zoneSlug, areaSlug, selectedMarket, "all")}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>
        <a
          href={areaHref(zoneSlug, areaSlug, selectedMarket, "condos")}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>
        <a
          href={areaHref(zoneSlug, areaSlug, selectedMarket, "houses")}
          style={
            selectedPropertyType === "houses" ? selectedStyle : unselectedStyle
          }
        >
          Houses
        </a>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <a
          href={areaHref(zoneSlug, areaSlug, "all", selectedPropertyType)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>
        <a
          href={areaHref(
            zoneSlug,
            areaSlug,
            "pre_construction",
            selectedPropertyType
          )}
          style={
            selectedMarket === "pre_construction"
              ? selectedStyle
              : unselectedStyle
          }
        >
          Pre-Construction
        </a>
        <a
          href={areaHref(zoneSlug, areaSlug, "resale", selectedPropertyType)}
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

function areaHref(
  zoneSlug: string,
  areaSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const queryString = params.toString();

  return queryString
    ? `/areas/${zoneSlug}/${areaSlug}?${queryString}`
    : `/areas/${zoneSlug}/${areaSlug}`;
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

function homeHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  zone?: string,
  area?: string
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);
  if (zone) params.set("zone", zone);
  if (area) params.set("area", area);

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
}