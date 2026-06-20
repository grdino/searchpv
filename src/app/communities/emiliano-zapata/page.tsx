import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";

type CommunitySnapshot = {
  community_name: string;
  snapshot_date: string | null;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;

  active_count: number | null;
  active_0br: number | null;
  active_1br: number | null;
  active_2br: number | null;
  active_3br_plus: number | null;

  pending_count: number | null;
  pending_0br: number | null;
  pending_1br: number | null;
  pending_2br: number | null;
  pending_3br_plus: number | null;

  sales_12mo: number | null;
  sales_0br_12mo: number | null;
  sales_1br_12mo: number | null;
  sales_2br_12mo: number | null;
  sales_3br_plus_12mo: number | null;

  median_sold_price: number | null;
  median_sold_price_0br: number | null;
  median_sold_price_1br: number | null;
  median_sold_price_2br: number | null;
  median_sold_price_3br_plus: number | null;

  avg_sold_price_ft2: number | null;
  avg_sold_price_ft2_0br: number | null;
  avg_sold_price_ft2_1br: number | null;
  avg_sold_price_ft2_2br: number | null;
  avg_sold_price_ft2_3br_plus: number | null;

  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;
  months_inventory_0br: number | null;
  months_inventory_1br: number | null;
  months_inventory_2br: number | null;
  months_inventory_3br_plus: number | null;
};

export default async function EmilianoZapataPage({
  searchParams,
}: {
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(params.propertyType);

  const { data, error } = await supabase
    .from("community_snapshot")
    .select("*")
    .eq("community_name", "Emiliano Zapata")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading Emiliano Zapata data.</p>
        <pre className="mt-4 text-sm">{error.message}</pre>
      </main>
    );
  }

  const row = data as CommunitySnapshot | null;

  const snapshotDate = row?.snapshot_date
    ? new Date(row.snapshot_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href={homeHref(selectedMarket, selectedPropertyType)}
            className="text-sm text-slate-300 hover:underline"
          >
            ← Back to SearchPV
          </Link>

          <div
            style={{
              marginTop: "32px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#cbd5e1",
              }}
            >
              Puerto Vallarta Market Intelligence
            </p>

            <h1
              style={{
                marginTop: "10px",
                fontSize: "28px",
                lineHeight: "1.2",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              Emiliano Zapata
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              Snapshot Date: {snapshotDate}
            </p>

            <CommunitySelectors
              selectedMarket={selectedMarket}
              selectedPropertyType={selectedPropertyType}
            />
          </div>
        </div>
      </section>

      {!row ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="rounded-xl bg-white p-8 shadow">
            <h2 className="text-xl font-bold">No data available</h2>
            <p className="mt-2 text-slate-600">
              There are no Emiliano Zapata records for this combination of
              filters.
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard
              label="Active Listings"
              value={row.active_count ?? 0}
              breakdown={{
                studio: row.active_0br ?? 0,
                oneBed: row.active_1br ?? 0,
                twoBed: row.active_2br ?? 0,
                threeBedPlus: row.active_3br_plus ?? 0,
              }}
            />

            <MetricCard
              label="Pending Listings"
              value={row.pending_count ?? 0}
              breakdown={{
                studio: row.pending_0br ?? 0,
                oneBed: row.pending_1br ?? 0,
                twoBed: row.pending_2br ?? 0,
                threeBedPlus: row.pending_3br_plus ?? 0,
              }}
            />

            <MetricCard
              label="Closed Sales - 12 Mo"
              value={row.sales_12mo ?? 0}
              breakdown={{
                studio: row.sales_0br_12mo ?? 0,
                oneBed: row.sales_1br_12mo ?? 0,
                twoBed: row.sales_2br_12mo ?? 0,
                threeBedPlus: row.sales_3br_plus_12mo ?? 0,
              }}
            />

            <MetricCard
              label="Median Sold Price"
              value={formatMoney(row.median_sold_price)}
              breakdown={{
                studio: formatMoney(row.median_sold_price_0br),
                oneBed: formatMoney(row.median_sold_price_1br),
                twoBed: formatMoney(row.median_sold_price_2br),
                threeBedPlus: formatMoney(row.median_sold_price_3br_plus),
              }}
            />

            <MetricCard
              label="Avg Sold $/ft²"
              value={formatMoney(row.avg_sold_price_ft2)}
              breakdown={{
                studio: formatMoney(row.avg_sold_price_ft2_0br),
                oneBed: formatMoney(row.avg_sold_price_ft2_1br),
                twoBed: formatMoney(row.avg_sold_price_ft2_2br),
                threeBedPlus: formatMoney(row.avg_sold_price_ft2_3br_plus),
              }}
            />

            <MetricCard
              label="Months Inventory"
              value={formatNumber(row.months_inventory)}
              breakdown={{
                studio: formatNumber(row.months_inventory_0br),
                oneBed: formatNumber(row.months_inventory_1br),
                twoBed: formatNumber(row.months_inventory_2br),
                threeBedPlus: formatNumber(row.months_inventory_3br_plus),
              }}
            />
          </div>

          <div style={{ paddingTop: "48px" }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
                border: "1px solid #f1f5f9",
              }}
            >
              <h2 className="text-2xl font-bold">Market Summary</h2>

              <p className="mt-4 leading-7 text-slate-700">
                Emiliano Zapata currently has{" "}
                <strong>{row.active_count ?? 0}</strong> active listings,{" "}
                <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
                <strong>{row.sales_12mo ?? 0}</strong> closed sales over the past
                12 months. The median sold price is{" "}
                <strong>{formatMoney(row.median_sold_price)}</strong>, with
                average sold pricing around{" "}
                <strong>{formatMoney(row.avg_sold_price_ft2)}</strong> per square
                foot. Current months of inventory is{" "}
                <strong>{formatNumber(row.months_inventory)}</strong>.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function CommunitySelectors({
  selectedMarket,
  selectedPropertyType,
}: {
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
    <div style={{ marginTop: "18px" }}>
      <div style={rowStyle}>
        <a
          href={communityHref(selectedMarket, "all")}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref(selectedMarket, "condos")}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={communityHref(selectedMarket, "houses")}
          style={
            selectedPropertyType === "houses" ? selectedStyle : unselectedStyle
          }
        >
          Houses
        </a>
      </div>

      <div
        style={{
          ...rowStyle,
          marginTop: "10px",
        }}
      >
        <a
          href={communityHref("all", selectedPropertyType)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref("pre_construction", selectedPropertyType)}
          style={
            selectedMarket === "pre_construction"
              ? selectedStyle
              : unselectedStyle
          }
        >
          Pre-Construction
        </a>

        <a
          href={communityHref("resale", selectedPropertyType)}
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
  breakdown,
}: {
  label: string;
  value: string | number;
  breakdown?: {
    studio: string | number;
    oneBed: string | number;
    twoBed: string | number;
    threeBedPlus: string | number;
  };
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "28px 32px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
        border: "1px solid #f1f5f9",
      }}
    >
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-3 text-4xl font-bold text-slate-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      {breakdown && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            By Bedroom
          </div>

          <div className="text-sm text-slate-600">
            Studio <strong>{breakdown.studio}</strong>
            {" │ "}
            1BR <strong>{breakdown.oneBed}</strong>
            {" │ "}
            2BR <strong>{breakdown.twoBed}</strong>
            {" │ "}
            3BR+ <strong>{breakdown.threeBedPlus}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function communityHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  const queryString = params.toString();

  return queryString
    ? `/communities/emiliano-zapata?${queryString}`
    : "/communities/emiliano-zapata";
}

function homeHref(market: MarketSegment, propertyType: PropertyTypeSegment) {
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
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