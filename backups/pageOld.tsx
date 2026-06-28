import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";
import ZoneAreaFilters from "@/app/components/ZoneAreaFilters";
import Link from "next/link";
import SPVBranding from "@/app/components/SPVBranding";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import MainText from "./components/MainText";
import HierarchySelects from "@/app/components/HierarchySelects";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type MetricGroup = "active" | "pending" | "sold_12mo";

type SortKey =
  | "name"
  | "active_count"
  | "pending_count"
  | "sales_12mo"
  | "median_sold_price"
  | "avg_sold_price_ft2"
  | "sold_avg_dom_12mo"
  | "months_inventory";

type SortDir = "asc" | "desc";

type CommunitySnapshot = {
  zone_name: string | null;
  zone_slug: string | null;
  area_name: string | null;
  area_slug: string | null;
  community_name: string;
  community_slug: string;
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
  community_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: string;
  listing_count: number | null;
  listing_ids: string | null;
};

type AreaSnapshotRow = {
  zone_name: string;
  zone_slug: string;
  area_name: string;
  area_slug: string;
  snapshot_date: string | null;

  active_count: number;
  pending_count: number;
  sales_12mo: number;

  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;
};

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
    sort?: string;
    dir?: string;
    zone?: string;
    area?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(params.propertyType);
  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  // Default the homepage to Puerto Vallarta instead of "all".
  const selectedZone = params.zone ?? DEFAULT_ZONE_NAME;
  const selectedArea = params.area ?? "all";

  const { data: optionData, error: optionError } = await supabase
    .from("community_snapshot")
    .select("zone_name, zone_slug, area_name, area_slug")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  let snapshotQuery = supabase
    .from("community_snapshot")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  if (selectedZone !== "all") {
    snapshotQuery = snapshotQuery.eq("zone_name", selectedZone);
  }

  if (selectedArea !== "all") {
    snapshotQuery = snapshotQuery.eq("area_name", selectedArea);
  }

  const { data, error } = await snapshotQuery;

  const { data: drilldownData, error: drilldownError } = await supabase
    .from("community_listing_drilldown")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .eq("bedroom_segment", "all")
    .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (error || drilldownError || optionError) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">Error loading market data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? drilldownError?.message ?? optionError?.message}
        </pre>
      </main>
    );
  }

  const rows = ((data ?? []) as CommunitySnapshot[]).filter(
    (row) => row.zone_name === selectedZone || selectedZone === "all"
  );

  const optionRows = (optionData ?? []) as Pick<
    CommunitySnapshot,
    "zone_name" | "zone_slug" | "area_name" | "area_slug"
  >[];

  const zones = Array.from(
    new Set(
      optionRows
        .map((row) => row.zone_name)
        .filter((zone): zone is string => Boolean(zone))
    )
  ).sort();

  const areas = Array.from(
    new Set(
      optionRows
        .filter((row) => selectedZone === "all" || row.zone_name === selectedZone)
        .map((row) => row.area_name)
        .filter((area): area is string => Boolean(area))
    )
  ).sort();

  const selectedZoneSlug =
    selectedZone !== "all"
      ? optionRows.find((r) => r.zone_name === selectedZone)?.zone_slug
      : null;

  const selectedAreaSlug =
    selectedArea !== "all"
      ? optionRows.find(
          (r) => r.zone_name === selectedZone && r.area_name === selectedArea
        )?.area_slug
      : null;

  const displayMode = selectedArea === "all" ? "area" : "community";

  const areaRows = sortRows(
    buildAreaRows(rows),
    selectedSort,
    selectedDir,
    "area"
  ) as AreaSnapshotRow[];

  const communityRows = sortRows(
    rows,
    selectedSort,
    selectedDir,
    "community"
  ) as CommunitySnapshot[];

  const displayedRows = displayMode === "area" ? areaRows : communityRows;

  const drilldownRows = (drilldownData ?? []) as CommunityListingDrilldown[];
  const drilldownLookup = new Map<string, CommunityListingDrilldown>();

  for (const row of drilldownRows) {
    drilldownLookup.set(drilldownKey(row.community_name, row.metric_group), row);
  }

  const snapshotDate =
    rows.length > 0 && rows[0].snapshot_date
      ? formatDateOnly(rows[0].snapshot_date)
      : "Unknown";

  const totalActive = displayedRows.reduce(
    (sum, r) => sum + Number(r.active_count ?? 0),
    0
  );

  const totalPending = displayedRows.reduce(
    (sum, r) => sum + Number(r.pending_count ?? 0),
    0
  );

  const totalSales = displayedRows.reduce(
    (sum, r) => sum + Number(r.sales_12mo ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <SPVBranding />
          <MainSloganBranding />
          <MainText />

          <HomeSelectors
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
            selectedZone={selectedZone}
            selectedArea={selectedArea}
            zones={zones}
            areas={areas}
          />

          <HierarchySelects
            communityOptions={
              selectedArea === "all"
                ? []
                : communityRows.map((row) => ({
                    label: row.community_name,
                    href: communityHierarchyHref(
                      row.zone_slug,
                      row.area_slug,
                      row.community_slug,
                      selectedMarket,
                      selectedPropertyType
                    ),
                  }))
            }
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Active Listings" value={totalActive} />
          <MetricCard label="Pending Listings" value={totalPending} />
          <MetricCard label="Closed Sales - 12 Mo" value={totalSales} />
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="font-semibold text-slate-700">Current Filters</div>

          <div className="mt-1 text-slate-600">
            <Link href="/" className="font-semibold text-blue-700 hover:underline">
              SearchPV
            </Link>

            {" > "}

            <span>{selectedZone}</span>

            {selectedArea !== "all" && selectedZoneSlug && selectedAreaSlug && (
              <>
                {" > "}
                <Link
                  href={areaHref(
                    selectedZoneSlug,
                    selectedAreaSlug,
                    selectedMarket,
                    selectedPropertyType
                  )}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {selectedArea}
                </Link>
              </>
            )}

            {(selectedMarket !== "all" || selectedPropertyType !== "all") &&
              " • "}

            {selectedMarket !== "all" && (
              <span>
                {selectedMarket === "pre_construction"
                  ? "Pre-Construction"
                  : "Resale"}
              </span>
            )}

            {selectedMarket !== "all" &&
              selectedPropertyType !== "all" &&
              " • "}

            {selectedPropertyType !== "all" && (
              <span>
                {selectedPropertyType === "condos" ? "Condos" : "Houses"}
              </span>
            )}

            {selectedMarket === "all" && selectedPropertyType === "all" && (
              <span>{selectedArea === "all" ? " • All Areas" : ""}</span>
            )}
          </div>

          <div className="mt-1 text-slate-500">
            {displayedRows.length.toLocaleString()}{" "}
            {displayMode === "area" ? "areas" : "communities"} shown
          </div>
        </div>

        <h2 id="community-snapshot" className="mt-3 text-2xl font-bold">
          {displayMode === "area" ? "Area Snapshot" : "Community Snapshot"}
        </h2>

        <p className="text-sm text-slate-500">Snapshot Date: {snapshotDate}</p>

        <p className="mt-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

        <div className="mt-1 max-h-[70vh] overflow-auto rounded-xl bg-white shadow md:max-h-[65vh]">
          <table className="min-w-[900px] text-sm">
            <thead className="bg-slate-100 text-slate-700 shadow-sm">
              <tr>
                <SortableTh
                  label={displayMode === "area" ? "Area" : "Community"}
                  sortKey="name"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                  className="sticky top-0 left-0 z-30 bg-slate-100"
                />

                <SortableTh
                  label="Active"
                  sortKey="active_count"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="Pending"
                  sortKey="pending_count"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="Sales 12 Mo"
                  sortKey="sales_12mo"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="Median Sold"
                  sortKey="median_sold_price"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="Avg Sold $/ft²"
                  sortKey="avg_sold_price_ft2"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="DOM"
                  sortKey="sold_avg_dom_12mo"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />

                <SortableTh
                  label="MOI"
                  sortKey="months_inventory"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                />
              </tr>
            </thead>

            <tbody>
              {displayMode === "area"
                ? areaRows.map((row) => (
                    <tr
                      key={`${row.zone_slug}-${row.area_slug}`}
                      className="border-t"
                    >
                      <Td className="sticky left-0 z-10 bg-white border-r border-slate-200">
                        <Link
                          href={areaHref(
                            row.zone_slug,
                            row.area_slug,
                            selectedMarket,
                            selectedPropertyType
                          )}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {row.area_name}
                        </Link>
                      </Td>

                      <Td>{row.active_count}</Td>
                      <Td>{row.pending_count}</Td>
                      <Td>{row.sales_12mo}</Td>
                      <Td>{formatMoney(row.median_sold_price)}</Td>
                      <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                      <Td>{formatNumber(row.sold_avg_dom_12mo)}</Td>
                      <Td>{formatNumber(row.months_inventory)}</Td>
                    </tr>
                  ))
                : communityRows.map((row) => {
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
                      <tr
                        key={`${row.zone_name ?? "unknown"}-${
                          row.area_name ?? "unknown"
                        }-${row.community_slug}`}
                        className="border-t"
                      >
                        <Td className="sticky left-0 z-10 bg-white border-r border-slate-200">
                          <Link
                            href={communityHierarchyHref(
                              row.zone_slug,
                              row.area_slug,
                              row.community_slug,
                              selectedMarket,
                              selectedPropertyType
                            )}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {row.community_name}
                          </Link>
                        </Td>

                        <Td>
                          <IdxListingLink
                            listingIds={activeDrilldown?.listing_ids}
                          >
                            {row.active_count ?? 0}
                          </IdxListingLink>
                        </Td>

                        <Td>
                          <IdxListingLink
                            listingIds={pendingDrilldown?.listing_ids}
                          >
                            {row.pending_count ?? 0}
                          </IdxListingLink>
                        </Td>

                        <Td>
                          <ContactListingLink
                            communityName={row.community_name}
                            zoneName={row.zone_name}
                            areaName={row.area_name}
                            market={selectedMarket}
                            propertyType={selectedPropertyType}
                            metricGroup="sold_12mo"
                            bedroomSegment="all"
                            listingCount={
                              soldDrilldown?.listing_count ??
                              row.sales_12mo ??
                              0
                            }
                          >
                            {row.sales_12mo ?? 0}
                          </ContactListingLink>
                        </Td>

                        <Td>{formatMoney(row.median_sold_price)}</Td>
                        <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                        <Td>{formatNumber(row.sold_avg_dom_12mo)}</Td>
                        <Td>{formatNumber(row.months_inventory)}</Td>
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
  selectedZone,
  selectedArea,
  zones,
  areas,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedZone: string;
  selectedArea: string;
  zones: string[];
  areas: string[];
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
          href={homeHref(
            selectedMarket,
            "all",
            selectedSort,
            selectedDir,
            selectedZone,
            selectedArea
          )}
          style={
            selectedPropertyType === "all" ? selectedStyle : unselectedStyle
          }
        >
          All
        </a>

        <a
          href={homeHref(
            selectedMarket,
            "condos",
            selectedSort,
            selectedDir,
            selectedZone,
            selectedArea
          )}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={homeHref(
            selectedMarket,
            "houses",
            selectedSort,
            selectedDir,
            selectedZone,
            selectedArea
          )}
          style={
            selectedPropertyType === "houses" ? selectedStyle : unselectedStyle
          }
        >
          Houses
        </a>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <a
          href={homeHref(
            "all",
            selectedPropertyType,
            selectedSort,
            selectedDir,
            selectedZone,
            selectedArea
          )}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={homeHref(
            "pre_construction",
            selectedPropertyType,
            selectedSort,
            selectedDir,
            selectedZone,
            selectedArea
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
            selectedDir,
            selectedZone,
            selectedArea
          )}
          style={selectedMarket === "resale" ? selectedStyle : unselectedStyle}
        >
          Resale
        </a>
      </div>

      <ZoneAreaFilters
        selectedMarket={selectedMarket}
        selectedPropertyType={selectedPropertyType}
        selectedSort={selectedSort}
        selectedDir={selectedDir}
        selectedZone={selectedZone}
        selectedArea={selectedArea}
        zones={zones}
        areas={areas}
      />
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
  selectedZone,
  selectedArea,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedZone: string;
  selectedArea: string;
  className?: string;
}) {
  const isSelected = selectedSort === sortKey;
  const nextDir: SortDir = isSelected && selectedDir === "desc" ? "asc" : "desc";
  const arrow = isSelected ? (selectedDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <Th className={`sticky top-0 z-20 bg-slate-100 ${className}`}>
      <Link
        href={sortHref(
          selectedMarket,
          selectedPropertyType,
          sortKey,
          nextDir,
          selectedZone,
          selectedArea
        )}
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
  zoneName,
  areaName,
  market,
  propertyType,
  metricGroup,
  bedroomSegment,
  listingCount,
  children,
}: {
  communityName: string;
  zoneName: string | null;
  areaName: string | null;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  metricGroup: MetricGroup;
  bedroomSegment: string;
  listingCount: number;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  if (zoneName) params.set("zone", zoneName);
  if (areaName) params.set("area", areaName);
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

function buildAreaRows(rows: CommunitySnapshot[]): AreaSnapshotRow[] {
  const map = new Map<
    string,
    AreaSnapshotRow & {
      weightedSoldPriceFt2: number;
      weightedDom: number;
      weightedMedianSold: number;
      medianSoldWeight: number;
    }
  >();

  for (const row of rows) {
    if (!row.zone_name || !row.zone_slug || !row.area_name || !row.area_slug) {
      continue;
    }

    const key = `${row.zone_slug}|${row.area_slug}`;

    const existing =
      map.get(key) ??
      ({
        zone_name: row.zone_name,
        zone_slug: row.zone_slug,
        area_name: row.area_name,
        area_slug: row.area_slug,
        snapshot_date: row.snapshot_date,
        active_count: 0,
        pending_count: 0,
        sales_12mo: 0,
        median_sold_price: null,
        avg_sold_price_ft2: null,
        sold_avg_dom_12mo: null,
        months_inventory: null,
        weightedSoldPriceFt2: 0,
        weightedDom: 0,
        weightedMedianSold: 0,
        medianSoldWeight: 0,
      } as AreaSnapshotRow & {
        weightedSoldPriceFt2: number;
        weightedDom: number;
        weightedMedianSold: number;
        medianSoldWeight: number;
      });

    const sales = Number(row.sales_12mo ?? 0);

    existing.active_count += Number(row.active_count ?? 0);
    existing.pending_count += Number(row.pending_count ?? 0);
    existing.sales_12mo += sales;

    if (row.avg_sold_price_ft2 && sales > 0) {
      existing.weightedSoldPriceFt2 += Number(row.avg_sold_price_ft2) * sales;
    }

    if (row.sold_avg_dom_12mo && sales > 0) {
      existing.weightedDom += Number(row.sold_avg_dom_12mo) * sales;
    }

    if (row.median_sold_price && sales > 0) {
      existing.weightedMedianSold += Number(row.median_sold_price) * sales;
      existing.medianSoldWeight += sales;
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).map((row) => {
    const avgSoldPriceFt2 =
      row.sales_12mo > 0 ? Math.round(row.weightedSoldPriceFt2 / row.sales_12mo) : null;

    const avgDom =
      row.sales_12mo > 0 ? Math.round(row.weightedDom / row.sales_12mo) : null;

    const blendedMedianSold =
      row.medianSoldWeight > 0
        ? Math.round(row.weightedMedianSold / row.medianSoldWeight)
        : null;

    const monthsInventory =
      row.sales_12mo === 0
        ? null
        : Number((row.active_count / (row.sales_12mo / 12)).toFixed(1));

    return {
      zone_name: row.zone_name,
      zone_slug: row.zone_slug,
      area_name: row.area_name,
      area_slug: row.area_slug,
      snapshot_date: row.snapshot_date,
      active_count: row.active_count,
      pending_count: row.pending_count,
      sales_12mo: row.sales_12mo,
      median_sold_price: blendedMedianSold,
      avg_sold_price_ft2: avgSoldPriceFt2,
      sold_avg_dom_12mo: avgDom,
      months_inventory: monthsInventory,
    };
  });
}

function sortRows(
  rows: (AreaSnapshotRow | CommunitySnapshot)[],
  sort: SortKey,
  dir: SortDir,
  mode: "area" | "community"
) {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    let aValue: string | number | null | undefined;
    let bValue: string | number | null | undefined;

    if (sort === "name") {
      aValue = mode === "area" ? (a as AreaSnapshotRow).area_name : (a as CommunitySnapshot).community_name;
      bValue = mode === "area" ? (b as AreaSnapshotRow).area_name : (b as CommunitySnapshot).community_name;
    } else {
      aValue = a[sort as keyof typeof a] as number | null | undefined;
      bValue = b[sort as keyof typeof b] as number | null | undefined;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return dir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const aNumber = Number(aValue ?? -Infinity);
    const bNumber = Number(bValue ?? -Infinity);

    return dir === "asc" ? aNumber - bNumber : bNumber - aNumber;
  });

  return sorted;
}

function homeHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir,
  zone: string,
  area: string
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);
  if (sort !== "active_count") params.set("sort", sort);
  if (!(sort === "active_count" && dir === "desc")) params.set("dir", dir);
  if (zone !== DEFAULT_ZONE_NAME) params.set("zone", zone);
  if (area !== "all") params.set("area", area);

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
}

function areaHref(
  zoneSlug: string,
  areaSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);
  const path = `/markets/${zoneSlug}/areas/${areaSlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function communityHierarchyHref(
  zoneSlug: string | null,
  areaSlug: string | null,
  communitySlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);

  if (!zoneSlug || !areaSlug) {
    return queryString
      ? `/communities/${communitySlug}?${queryString}`
      : `/communities/${communitySlug}`;
  }

  const path = `/markets/${zoneSlug}/areas/${areaSlug}/communities/${communitySlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function buildQueryString(
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

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
    "name",
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
    : "active_count";
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
    <td className={`whitespace-nowrap px-4 py-3 ${className}`}>{children}</td>
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

function sortHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir,
  zone: string,
  area: string
) {
  return `${homeHref(market, propertyType, sort, dir, zone, area)}#community-snapshot`;
}
