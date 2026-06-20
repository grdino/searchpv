import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type MetricGroup = "active" | "pending" | "sold_12mo";

type SortKey =
  | "community_name"
  | "active_count"
  | "pending_count"
  | "sales_12mo"
  | "median_sold_price"
  | "avg_sold_price_ft2"
  | "sold_avg_dom_12mo"
  | "months_inventory";

type SortDir = "asc" | "desc";

type CommunitySnapshot = {
  community_name: string;
  snapshot_date: string | null;
  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  sold_avg_dom_12mo: number | null;
  months_inventory: number | null;
};

type CommunityListingDrilldown = {
  community_name: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: string;
  listing_count: number | null;
  listing_ids: string | null;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(params.propertyType);
  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  const { data, error } = await supabase
    .from("community_snapshot")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .order(selectedSort, {
      ascending: selectedDir === "asc",
      nullsFirst: false,
    });

  const { data: drilldownData, error: drilldownError } = await supabase
    .from("community_listing_drilldown")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .eq("bedroom_segment", "all")
    .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (error || drilldownError) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">Error loading market data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? drilldownError?.message}
        </pre>
      </main>
    );
  }

  const rows = (data ?? []) as CommunitySnapshot[];
  const drilldownRows = (drilldownData ?? []) as CommunityListingDrilldown[];

  const drilldownLookup = new Map<string, CommunityListingDrilldown>();

  for (const row of drilldownRows) {
    drilldownLookup.set(drilldownKey(row.community_name, row.metric_group), row);
  }

  const snapshotDate =
    rows.length > 0 && rows[0].snapshot_date
      ? formatDateOnly(rows[0].snapshot_date)
      : "Unknown";

  const totalActive = rows.reduce(
    (sum, r) => sum + Number(r.active_count ?? 0),
    0
  );

  const totalPending = rows.reduce(
    (sum, r) => sum + Number(r.pending_count ?? 0),
    0
  );

  const totalSales = rows.reduce(
    (sum, r) => sum + Number(r.sales_12mo ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-widest text-slate-300">
            Puerto Vallarta Market Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">SearchPV</h1>

          <p className="mt-4 max-w-2xl text-slate-300">
            Explore Puerto Vallarta & Riviera Nayarit Markets. Compare condo and
            house inventory, pricing, sales activity, and months of inventory by
            community.
          </p>

          <HomeSelectors
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Active Listings" value={totalActive} />
          <MetricCard label="Pending Listings" value={totalPending} />
          <MetricCard label="Closed Sales - 12 Mo" value={totalSales} />
        </div>

        <h2 id="community-snapshot" className="mt-12 text-2xl font-bold">
          Community Snapshot
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Snapshot Date: {snapshotDate}
        </p>

        <div className="mt-6 max-h-[70vh] overflow-auto rounded-xl bg-white shadow md:max-h-[65vh]">
          <table className="min-w-[900px] text-sm">
            <thead className="bg-slate-100 text-slate-700 shadow-sm">
              <tr>
                <SortableTh
                  label="Community"
                  sortKey="community_name"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  className="sticky top-0 left-0 z-30 bg-slate-100"
                />

                <SortableTh
                  label="Active"
                  sortKey="active_count"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="Pending"
                  sortKey="pending_count"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="Sales 12 Mo"
                  sortKey="sales_12mo"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="Median Sold"
                  sortKey="median_sold_price"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="Avg Sold $/ft²"
                  sortKey="avg_sold_price_ft2"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="DOM"
                  sortKey="sold_avg_dom_12mo"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />

                <SortableTh
                  label="MOI"
                  sortKey="months_inventory"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                />
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const activeDrilldown = drilldownLookup.get(
                  drilldownKey(row.community_name, "active")
                );

                const pendingDrilldown = drilldownLookup.get(
                  drilldownKey(row.community_name, "pending")
                );

                const soldDrilldown = drilldownLookup.get(
                  drilldownKey(row.community_name, "sold_12mo")
                );

                return (
                  <tr key={row.community_name} className="border-t">
                    <Td className="sticky left-0 z-10 bg-white border-r border-slate-200">
                      {row.community_name === "Emiliano Zapata" ? (
                        <Link
                          href={communityHref(
                            "emiliano-zapata",
                            selectedMarket,
                            selectedPropertyType
                          )}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {row.community_name}
                        </Link>
                      ) : (
                        row.community_name
                      )}
                    </Td>

                    <Td>
                      <IdxListingLink listingIds={activeDrilldown?.listing_ids}>
                        {row.active_count ?? 0}
                      </IdxListingLink>
                    </Td>

                    <Td>
                      <IdxListingLink listingIds={pendingDrilldown?.listing_ids}>
                        {row.pending_count ?? 0}
                      </IdxListingLink>
                    </Td>

                    <Td>
                      <ContactListingLink
                        communityName={row.community_name}
                        market={selectedMarket}
                        propertyType={selectedPropertyType}
                        metricGroup="sold_12mo"
                        bedroomSegment="all"
                        listingCount={
                          soldDrilldown?.listing_count ?? row.sales_12mo ?? 0
                        }
                      >
                        {row.sales_12mo ?? 0}
                      </ContactListingLink>
                    </Td>

                    <Td>{formatMoney(row.median_sold_price)}</Td>
                    <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                    <Td>{row.sold_avg_dom_12mo ?? "-"}</Td>
                    <Td>{row.months_inventory ?? "-"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function HomeSelectors({
  selectedMarket,
  selectedPropertyType,
  selectedSort,
  selectedDir,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
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
          href={homeHref(selectedMarket, "all", selectedSort, selectedDir)}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={homeHref(selectedMarket, "condos", selectedSort, selectedDir)}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={homeHref(selectedMarket, "houses", selectedSort, selectedDir)}
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
          href={homeHref("all", selectedPropertyType, selectedSort, selectedDir)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={homeHref(
            "pre_construction",
            selectedPropertyType,
            selectedSort,
            selectedDir
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
          href={homeHref(
            "resale",
            selectedPropertyType,
            selectedSort,
            selectedDir
          )}
          style={selectedMarket === "resale" ? selectedStyle : unselectedStyle}
        >
          Resale
        </a>
      </div>
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  selectedSort,
  selectedDir,
  selectedMarket,
  selectedPropertyType,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  className?: string;
}) {
  const isSelected = selectedSort === sortKey;
  const nextDir: SortDir = isSelected && selectedDir === "desc" ? "asc" : "desc";
  const arrow = isSelected ? (selectedDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <Th className={`sticky top-0 z-20 bg-slate-100 ${className}`}>
      <Link
        href={sortHref(selectedMarket, selectedPropertyType, sortKey, nextDir)}
        className="hover:underline"
      >
        {label}
        {arrow}
      </Link>
    </Th>
  );
}

function IdxListingLink({
  listingIds,
  children,
}: {
  listingIds: string | null | undefined;
  children: React.ReactNode;
}) {
  if (!listingIds) {
    return <>{children}</>;
  }

  return (
    <a
      href={buildIdxUrl(listingIds)}
      className="font-semibold text-blue-700 hover:underline"
    >
      {children}
    </a>
  );
}

function ContactListingLink({
  communityName,
  market,
  propertyType,
  metricGroup,
  bedroomSegment,
  listingCount,
  children,
}: {
  communityName: string;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  metricGroup: MetricGroup;
  bedroomSegment: string;
  listingCount: number;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  params.set("community", communityName);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", metricGroup);
  params.set("bedroom", bedroomSegment);
  params.set("count", String(listingCount));

  return (
    <Link
      href={`/contact?${params.toString()}`}
      className="font-semibold text-blue-700 hover:underline"
    >
      {children}
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function homeHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir
) {
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  if (sort !== "sales_12mo") {
    params.set("sort", sort);
  }

  if (!(sort === "sales_12mo" && dir === "desc")) {
    params.set("dir", dir);
  }

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
}

function communityHref(
  communitySlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);

  return queryString
    ? `/communities/${communitySlug}?${queryString}`
    : `/communities/${communitySlug}`;
}

function buildQueryString(
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

  return params.toString();
}

function drilldownKey(communityName: string, metricGroup: MetricGroup) {
  return `${communityName}|${metricGroup}`;
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

function getSortKey(value?: string): SortKey {
  const allowed: SortKey[] = [
    "community_name",
    "active_count",
    "pending_count",
    "sales_12mo",
    "median_sold_price",
    "avg_sold_price_ft2",
    "sold_avg_dom_12mo",
    "months_inventory",
  ];

  return allowed.includes(value as SortKey)
    ? (value as SortKey)
    : "sales_12mo";
}

function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left font-semibold ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 ${className}`}>
      {children}
    </td>
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

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sortHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir
) {
  return `${homeHref(market, propertyType, sort, dir)}#community-snapshot`;
}