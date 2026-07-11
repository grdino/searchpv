import type { Metadata } from "next";
import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";
import ZoneAreaFilters from "@/app/components/ZoneAreaFilters";
import HierarchySelects from "@/app/components/HierarchySelects";
import Link from "next/link";
import SPVBranding from "@/app/components/SPVBranding";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import MainText from "./components/MainText";
import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import SPVHeroMission from "@/app/components/SPVHeroMission";

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

type DevelopmentSnapshot = {
  zone_name: string | null;
  zone_slug: string | null;
  area_name: string | null;
  area_slug: string | null;
  community_name: string | null;
  community_slug: string | null;
  development_name: string;
  development_slug: string;
  snapshot_date: string | null;

  property_count: number | null;
  condo_property_count: number | null;
  house_property_count: number | null;

  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;

  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  sold_avg_dom_12mo: number | null;
  months_inventory: number | null;
};

type CommunityListingDrilldown = {
  zone_slug: string | null;
  area_slug: string | null;
  community_name: string;
  community_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: string;
  listing_count: number | null;
  listing_ids: string | null;
};

type AreaListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: string;
  listing_count: number | null;
  listing_ids: string | null;
};

type DevelopmentListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
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

/*
  SEO metadata for the SearchPV homepage.

  This controls the browser title, Google search result title/description,
  canonical URL, and social sharing metadata. It does not change the visible
  page layout.
*/
export async function generateMetadata(): Promise<Metadata> {
  const title =
    "Puerto Vallarta & Riviera Nayarit Real Estate Market Intelligence | SearchPV";

  const description =
    "Explore current MLS inventory, pending listings, closed sales, pricing trends, days on market, and months of inventory for Puerto Vallarta and Riviera Nayarit communities.";

  const pageUrl = "https://searchpv.com/";

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "SearchPV",
      type: "website",
    },
  };
}

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
    community?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(params.propertyType);
  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  const selectedZone = params.zone ?? DEFAULT_ZONE_NAME;
  const selectedArea = params.area ?? "all";
  const selectedCommunity = params.community ?? "all";

  const { data: optionData, error: optionError } = await supabase
    .from("community_snapshot")
    .select("zone_name, zone_slug, area_name, area_slug, community_name, community_slug")
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

  let areaDrilldownQuery = supabase
    .from("area_listing_drilldown")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .eq("bedroom_segment", "all")
    .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (selectedZone !== "all") {
    areaDrilldownQuery = areaDrilldownQuery.eq("zone_slug", slugify(selectedZone));
  }

  const { data: areaDrilldownData, error: areaDrilldownError } =
    await areaDrilldownQuery;

  let developmentDrilldownQuery = supabase
    .from("development_listing_drilldown")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .eq("bedroom_segment", "all")
    .in("metric_group", ["active", "pending", "sold_12mo"]);

  let developmentQuery = supabase
    .from("development_snapshot")
    .select("*")
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  if (selectedZone !== "all") {
    const zoneSlug = slugify(selectedZone);
    developmentQuery = developmentQuery.eq("zone_slug", zoneSlug);
    developmentDrilldownQuery = developmentDrilldownQuery.eq("zone_slug", zoneSlug);
  }

  if (selectedArea !== "all") {
    const areaSlug = slugify(selectedArea);
    developmentQuery = developmentQuery.eq("area_slug", areaSlug);
    developmentDrilldownQuery = developmentDrilldownQuery.eq("area_slug", areaSlug);
  }

  if (selectedCommunity !== "all") {
    developmentQuery = developmentQuery.eq("community_slug", selectedCommunity);
    developmentDrilldownQuery = developmentDrilldownQuery.eq("community_slug", selectedCommunity);
  } else {
    developmentQuery = developmentQuery.limit(0);
    developmentDrilldownQuery = developmentDrilldownQuery.limit(0);
  }

  const { data: developmentData, error: developmentError } =
    await developmentQuery;

  const { data: developmentDrilldownData, error: developmentDrilldownError } =
    await developmentDrilldownQuery;

  if (
    error ||
    drilldownError ||
    areaDrilldownError ||
    developmentDrilldownError ||
    optionError ||
    developmentError
  ) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">Error loading market data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ??
            drilldownError?.message ??
            areaDrilldownError?.message ??
            developmentDrilldownError?.message ??
            optionError?.message ??
            developmentError?.message}
        </pre>
      </main>
    );
  }

  const rows = ((data ?? []) as CommunitySnapshot[]).filter(
    (row) => row.zone_name === selectedZone || selectedZone === "all"
  );

  const optionRows = (optionData ?? []) as Pick<
    CommunitySnapshot,
    | "zone_name"
    | "zone_slug"
    | "area_name"
    | "area_slug"
    | "community_name"
    | "community_slug"
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

  const communities = Array.from(
    new Map(
      rows
        .filter((row) => selectedArea !== "all" && row.area_name === selectedArea)
        .map((row) => [
          row.community_slug,
          {
            community_name: row.community_name,
            community_slug: row.community_slug,
            zone_slug: row.zone_slug,
            area_slug: row.area_slug,
          },
        ])
    ).values()
  ).sort((a, b) => a.community_name.localeCompare(b.community_name));

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

  const displayMode =
    selectedArea === "all"
      ? "area"
      : selectedCommunity === "all"
        ? "community"
        : "development";

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

  const developmentRows = sortRows(
    ((developmentData ?? []) as DevelopmentSnapshot[]).filter(
      (row) => (row.condo_property_count ?? 0) >= 2 || selectedPropertyType === "houses"
    ),
    selectedSort,
    selectedDir,
    "development"
  ) as DevelopmentSnapshot[];

  const displayedRows =
    displayMode === "area"
      ? areaRows
      : displayMode === "community"
        ? communityRows
        : developmentRows;

  const selectedCommunityName =
    selectedCommunity === "all"
      ? "All Communities"
      : communities.find((c) => c.community_slug === selectedCommunity)
          ?.community_name ?? "All Communities";

  const drilldownRows = (drilldownData ?? []) as CommunityListingDrilldown[];
  const drilldownLookup = new Map<string, CommunityListingDrilldown>();

  for (const row of drilldownRows) {
    drilldownLookup.set(
      drilldownKey(
        row.zone_slug,
        row.area_slug,
        row.community_slug,
        row.metric_group
      ),
      row
    );
  }

  const areaDrilldownRows =
    (areaDrilldownData ?? []) as AreaListingDrilldown[];
  const areaDrilldownLookup = new Map<string, AreaListingDrilldown>();

  for (const row of areaDrilldownRows) {
    areaDrilldownLookup.set(
      areaDrilldownKey(row.zone_slug, row.area_slug, row.metric_group),
      row
    );
  }

  const developmentDrilldownRows =
    (developmentDrilldownData ?? []) as DevelopmentListingDrilldown[];
  const developmentDrilldownLookup = new Map<string, DevelopmentListingDrilldown>();

  for (const row of developmentDrilldownRows) {
    developmentDrilldownLookup.set(
      developmentDrilldownKey(
        row.zone_slug,
        row.area_slug,
        row.community_slug,
        row.development_slug,
        row.metric_group
      ),
      row
    );
  }

  const snapshotDate =
    displayedRows.length > 0 && displayedRows[0].snapshot_date
      ? formatDateOnly(displayedRows[0].snapshot_date)
      : rows.length > 0 && rows[0].snapshot_date
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

/*
  Structured data for the homepage.

  WebSite identifies SearchPV as a real website and brand property.

  SearchAction is included because the homepage functions as a market search
  and filtering interface. The target uses your existing query-string pattern.

  Organization identifies SearchPV as the publisher/brand behind the site.
*/
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SearchPV",
  url: "https://searchpv.com/",
  description:
    "Puerto Vallarta and Riviera Nayarit real estate market intelligence using MLS inventory, pending listings, closed sales, pricing trends, and months of inventory.",
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://searchpv.com/?community={community}",
    "query-input": "required name=community",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SearchPV",
  url: "https://searchpv.com/",
  logo: "https://searchpv.com/icon.png",
  description:
    "SearchPV provides Puerto Vallarta and Riviera Nayarit real estate market intelligence by area, community, and development.",
};

  const communityOptions =
    selectedArea === "all"
      ? []
      : [
          {
            label: "All Communities",
            href: homeHref(
              selectedMarket,
              selectedPropertyType,
              selectedSort,
              selectedDir,
              selectedZone,
              selectedArea,
              "all"
            ),
          },
          ...communities.map((community) => ({
            label: community.community_name,
            href: homeHref(
              selectedMarket,
              selectedPropertyType,
              selectedSort,
              selectedDir,
              selectedZone,
              selectedArea,
              community.community_slug
            ),
          })),
        ];

  const developmentOptions =
    selectedCommunity === "all"
      ? []
      : developmentRows
          .map((development) => ({
            label: development.development_name,
            href: developmentHref(
              development.zone_slug,
              development.area_slug,
              development.community_slug,
              development.development_slug,
              selectedMarket,
              selectedPropertyType
            ),
          }))
          .sort((a, b) =>
            a.label.localeCompare(b.label, "en", {
              sensitivity: "base",
              numeric: true,
            })
          );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Structured data only. Not visible on the page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Header />

            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <SPVHeroMission />
{/*    
          <MainSloganBranding />
          <MainText />
*/}

          <HomeSelectors
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
            selectedZone={selectedZone}
            selectedArea={selectedArea}
            selectedCommunity={selectedCommunity}
            zones={zones}
            areas={areas}
          />

          <HierarchySelects
            communityOptions={communityOptions}
            developmentOptions={developmentOptions}
            selectedCommunityLabel={selectedCommunityName}
            selectedDevelopmentLabel={
              displayMode === "development" && developmentRows.length > 0
                ? "Choose Development"
                : undefined
            }
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-0 pb-6 md:px-8 md:pt-2 md:pb-10">
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
            Current Filters
          </div>

          <div className="ml-4 mt-2 text-slate-600">
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

            {selectedCommunity !== "all" && selectedZoneSlug && selectedAreaSlug && (
              <>
                {" > "}
                <Link
                  href={communityHref(
                    selectedZoneSlug,
                    selectedAreaSlug,
                    selectedCommunity,
                    selectedMarket,
                    selectedPropertyType
                  )}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {selectedCommunityName}
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
          </div>

          <div className="ml-4 mt-2 font-bold text-slate-500">
            {displayedRows.length.toLocaleString()}{" "}
            {displayMode === "area"
              ? "areas"
              : displayMode === "community"
                ? "communities"
                : "developments"}{" "}
            shown
          </div>
        </div>
        
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
            Selected Market
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm text-slate-700">
            <div>
              <div className="text-lg font-bold leading-none text-slate-950">
                {totalActive.toLocaleString()}
              </div>
              <div className="mt-1">Active</div>
            </div>

            <div>
              <div className="text-lg font-bold leading-none text-slate-950">
                {totalPending.toLocaleString()}
              </div>
              <div className="mt-1">Pending</div>
            </div>

            <div>
              <div className="text-lg font-bold leading-none text-slate-950">
                {totalSales.toLocaleString()}
              </div>
              <div className="mt-1 hidden sm:block">Closed Sales - 12 Mo</div>
              <div className="mt-1 sm:hidden">Closed Sales-12 Mo</div>
            </div>
          </div>
        </div>

        <h2 id="community-snapshot" className="mt-8 text-2xl font-bold">
          {displayMode === "area"
            ? "Area Snapshot"
            : displayMode === "community"
              ? "Community Snapshot"
              : "Development Snapshot"}
        </h2>

        <p className="text-sm text-slate-500">Data Current As Of: {snapshotDate}</p>

        <p className="mt-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

        <div className="mt-1 max-h-[70vh] overflow-auto rounded-xl bg-white shadow md:max-h-[65vh]">
          <table className="min-w-[900px] text-sm">
            <thead className="bg-slate-100 text-slate-700 shadow-sm">
              <tr>
                <SortableTh
                  label={
                    displayMode === "area"
                      ? "Area"
                      : displayMode === "community"
                        ? "Community"
                        : "Development"
                  }
                  sortKey="name"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  selectedMarket={selectedMarket}
                  selectedPropertyType={selectedPropertyType}
                  selectedZone={selectedZone}
                  selectedArea={selectedArea}
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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
                  selectedCommunity={selectedCommunity}
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

                      <Td>
                        <IdxListingLink
                          listingIds={
                            areaDrilldownLookup.get(
                              areaDrilldownKey(row.zone_slug, row.area_slug, "active")
                            )?.listing_ids
                          }
                        >
                          {row.active_count}
                        </IdxListingLink>
                      </Td>
                      <Td>
                        <IdxListingLink
                          listingIds={
                            areaDrilldownLookup.get(
                              areaDrilldownKey(row.zone_slug, row.area_slug, "pending")
                            )?.listing_ids
                          }
                        >
                          {row.pending_count}
                        </IdxListingLink>
                      </Td>
                      <Td>
                        <ClosedSalesListingLink
                          listingIds={
                            areaDrilldownLookup.get(
                              areaDrilldownKey(row.zone_slug, row.area_slug, "sold_12mo")
                            )?.listing_ids
                          }
                        >
                          {row.sales_12mo}
                        </ClosedSalesListingLink>
                      </Td>
                      <Td>{formatMoney(row.median_sold_price)}</Td>
                      <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                      <Td>{formatNumber(row.sold_avg_dom_12mo)}</Td>
                      <Td>{formatNumber(row.months_inventory)}</Td>
                    </tr>
                  ))
                : displayMode === "community"
                  ? communityRows.map((row) => {
                      const activeDrilldown = drilldownLookup.get(
                        drilldownKey(row.zone_slug, row.area_slug, row.community_slug, "active")
                      );

                      const pendingDrilldown = drilldownLookup.get(
                        drilldownKey(row.zone_slug, row.area_slug, row.community_slug, "pending")
                      );

                      const soldDrilldown = drilldownLookup.get(
                        drilldownKey(row.zone_slug, row.area_slug, row.community_slug, "sold_12mo")
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
                              href={communityHref(
                                row.zone_slug ?? "",
                                row.area_slug ?? "",
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
                            <ClosedSalesListingLink listingIds={soldDrilldown?.listing_ids}>
                              {row.sales_12mo ?? 0}
                            </ClosedSalesListingLink>
                          </Td>

                          <Td>{formatMoney(row.median_sold_price)}</Td>
                          <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                          <Td>{formatNumber(row.sold_avg_dom_12mo)}</Td>
                          <Td>{formatNumber(row.months_inventory)}</Td>
                        </tr>
                      );
                    })
                  : developmentRows.map((row) => (
                      <tr
                        key={`${row.zone_slug}-${row.area_slug}-${row.community_slug}-${row.development_slug}`}
                        className="border-t"
                      >
                        <Td className="sticky left-0 z-10 bg-white border-r border-slate-200">
                          <Link
                            href={developmentHref(
                              row.zone_slug,
                              row.area_slug,
                              row.community_slug,
                              row.development_slug,
                              selectedMarket,
                              selectedPropertyType
                            )}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {row.development_name}
                          </Link>
                        </Td>

                        <Td>
                          <IdxListingLink
                            listingIds={
                              developmentDrilldownLookup.get(
                                developmentDrilldownKey(
                                  row.zone_slug ?? "",
                                  row.area_slug ?? "",
                                  row.community_slug ?? "",
                                  row.development_slug,
                                  "active"
                                )
                              )?.listing_ids
                            }
                          >
                            {row.active_count ?? 0}
                          </IdxListingLink>
                        </Td>
                        <Td>
                          <IdxListingLink
                            listingIds={
                              developmentDrilldownLookup.get(
                                developmentDrilldownKey(
                                  row.zone_slug ?? "",
                                  row.area_slug ?? "",
                                  row.community_slug ?? "",
                                  row.development_slug,
                                  "pending"
                                )
                              )?.listing_ids
                            }
                          >
                            {row.pending_count ?? 0}
                          </IdxListingLink>
                        </Td>
                        <Td>
                          <ClosedSalesListingLink
                            listingIds={
                              developmentDrilldownLookup.get(
                                developmentDrilldownKey(
                                  row.zone_slug ?? "",
                                  row.area_slug ?? "",
                                  row.community_slug ?? "",
                                  row.development_slug,
                                  "sold_12mo"
                                )
                              )?.listing_ids
                            }
                          >
                            {row.sales_12mo ?? 0}
                          </ClosedSalesListingLink>
                        </Td>
                        <Td>{formatMoney(row.median_sold_price)}</Td>
                        <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                        <Td>{formatNumber(row.sold_avg_dom_12mo)}</Td>
                        <Td>{formatNumber(row.months_inventory)}</Td>
                      </tr>
                    ))}
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
  selectedCommunity,
  zones,
  areas,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
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
    border: "1px solid #ffffff",
  };

  const unselectedStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: "transparent",
    color: "#ffffff",
    border: "1px solid #94a3b8",
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
            selectedArea,
            selectedCommunity
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
            selectedArea,
            selectedCommunity
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
            selectedArea,
            selectedCommunity
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
            selectedArea,
            selectedCommunity
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
            selectedArea,
            selectedCommunity
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
            selectedArea,
            selectedCommunity
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
  selectedCommunity,
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
  selectedCommunity: string;
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
          selectedArea,
          selectedCommunity
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

function ClosedSalesListingLink({
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
    <Link
      href={`/market-intelligence/closed-sales/search-results?mls=${listingIds}`}
      rel="nofollow"
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
  const map = new Map<string, AreaSnapshotRow & {
    weightedSoldPriceFt2: number;
    weightedDom: number;
    weightedMedianSold: number;
    medianSoldWeight: number;
  }>();

  rows.forEach((row) => {
    if (!row.zone_slug || !row.zone_name || !row.area_slug || !row.area_name) {
      return;
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

    existing.active_count += row.active_count ?? 0;
    existing.pending_count += row.pending_count ?? 0;
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
  });

  const areaRows = Array.from(map.values()).map((row) => {
    const avgSoldPriceFt2 =
      row.sales_12mo > 0
        ? Math.round(row.weightedSoldPriceFt2 / row.sales_12mo)
        : null;

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
      ...row,
      median_sold_price: blendedMedianSold,
      avg_sold_price_ft2: avgSoldPriceFt2,
      sold_avg_dom_12mo: avgDom,
      months_inventory: monthsInventory,
    };
  });

  return areaRows;
}

function sortRows(
  rows: (AreaSnapshotRow | CommunitySnapshot | DevelopmentSnapshot)[],
  sort: SortKey,
  dir: SortDir,
  mode: "area" | "community" | "development"
) {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    let aValue: string | number | null | undefined;
    let bValue: string | number | null | undefined;

    if (sort === "name") {
      if (mode === "area") {
        aValue = (a as AreaSnapshotRow).area_name;
        bValue = (b as AreaSnapshotRow).area_name;
      } else if (mode === "community") {
        aValue = (a as CommunitySnapshot).community_name;
        bValue = (b as CommunitySnapshot).community_name;
      } else {
        aValue = (a as DevelopmentSnapshot).development_name;
        bValue = (b as DevelopmentSnapshot).development_name;
      }
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
  area: string,
  community: string
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);
  if (sort !== "active_count") params.set("sort", sort);
  if (!(sort === "active_count" && dir === "desc")) params.set("dir", dir);
  if (zone !== DEFAULT_ZONE_NAME) params.set("zone", zone);
  if (area !== "all") params.set("area", area);
  if (community !== "all") params.set("community", community);

  const queryString = params.toString();

  return queryString ? `/?${queryString}#market-explorer` : "/#market-explorer";
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

function communityHref(
  marketSlug: string,
  areaSlug: string,
  communitySlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);
  const path = `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function developmentHref(
  marketSlug: string | null,
  areaSlug: string | null,
  communitySlug: string | null,
  developmentSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);

  if (!marketSlug || !areaSlug || !communitySlug) {
    return "/";
  }

  const path = `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}/developments/${developmentSlug}`;

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


function areaDrilldownKey(
  zoneSlug: string,
  areaSlug: string,
  metricGroup: MetricGroup
) {
  return `${zoneSlug}|${areaSlug}|${metricGroup}`;
}

function developmentDrilldownKey(
  zoneSlug: string,
  areaSlug: string,
  communitySlug: string,
  developmentSlug: string,
  metricGroup: MetricGroup
) {
  return `${zoneSlug}|${areaSlug}|${communitySlug}|${developmentSlug}|${metricGroup}`;
}

function ContactDevelopmentListingLink({
  developmentName,
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
  developmentName: string;
  communityName: string | null;
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
  if (communityName) params.set("community", communityName);
  params.set("development", developmentName);
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

function drilldownKey(
  zoneSlug: string | null,
  areaSlug: string | null,
  communitySlug: string,
  metricGroup: MetricGroup
) {
  return `${zoneSlug ?? ""}|${areaSlug ?? ""}|${communitySlug}|${metricGroup}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  area: string,
  community: string
) {
  return homeHref(
    market,
    propertyType,
    sort,
    dir,
    zone,
    area,
    community
  );
}
