import type { Metadata } from "next";
import Header from "@/app/components/Header";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buildIdxUrl } from "@/lib/idx";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import ToggleMetricCard from "@/app/components/ToggleMetricCard";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";

type SortKey =
  | "development"
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

  avg_sold_price: number | null;

  avg_sold_price_0br: number | null;
  avg_sold_price_1br: number | null;
  avg_sold_price_2br: number | null;
  avg_sold_price_3br_plus: number | null;

  median_sold_price_ft2: number | null;
  median_sold_price_ft2_0br: number | null;
  median_sold_price_ft2_1br: number | null;
  median_sold_price_ft2_2br: number | null;
  median_sold_price_ft2_3br_plus: number | null;

  avg_sold_price_m2: number | null;
  avg_sold_price_m2_0br: number | null;
  avg_sold_price_m2_1br: number | null;
  avg_sold_price_m2_2br: number | null;
  avg_sold_price_m2_3br_plus: number | null;

  median_sold_price_m2: number | null;
  median_sold_price_m2_0br: number | null;
  median_sold_price_m2_1br: number | null;
  median_sold_price_m2_2br: number | null;
  median_sold_price_m2_3br_plus: number | null;
};

type CommunityListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: "active" | "pending" | "sold_12mo";
  bedroom_segment: "all" | "0br" | "1br" | "2br" | "3br_plus";
  listing_count: number;
  listing_ids: string | null;
};

type DevelopmentListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: "active" | "pending" | "sold_12mo";
  bedroom_segment: "all" | "0br" | "1br" | "2br" | "3br_plus";
  listing_count: number;
  listing_ids: string | null;
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
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;

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

/*
  SEO metadata for community pages.

  This controls the browser title, Google search result title/description,
  canonical URL, and social sharing metadata. It does not change the visible
  page layout.
*/
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    marketSlug: string;
    areaSlug: string;
    communitySlug: string;
  }>;
}): Promise<Metadata> {
  const routeParams = await params;

  const communityName = formatSlugTitle(routeParams.communitySlug);
  const areaName = formatSlugTitle(routeParams.areaSlug);
  const zoneName = formatSlugTitle(routeParams.marketSlug);

  const pageUrl = `https://searchpv.com/markets/${routeParams.marketSlug}/areas/${routeParams.areaSlug}/communities/${routeParams.communitySlug}`;

  const title = `${communityName} Real Estate Market | ${zoneName} | SearchPV`;

  const description = `Current inventory, pricing, sales activity, development snapshots, and market trends for ${communityName} in ${areaName}, ${zoneName}.`;

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

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{
    marketSlug: string;
    areaSlug: string;
    communitySlug: string;
  }>;
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const routeParams = await params;
  const queryParams = await searchParams;

  const selectedMarket = getMarketSegment(queryParams.market);
  const selectedPropertyType = getPropertyTypeSegment(queryParams.propertyType);

  const selectedSort = getSortKey(queryParams.sort);
  const selectedDir = getSortDir(queryParams.dir);

  const { data, error } = await supabase
    .from("community_snapshot")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .maybeSingle();

  const { data: drilldownRows } = await supabase
    .from("community_listing_drilldown")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  const { data: developmentData, error: developmentError } = await supabase
    .from("development_snapshot")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  const { data: developmentDrilldownRows, error: developmentDrilldownError } =
    await supabase
      .from("development_listing_drilldown")
      .select("*")
      .eq("zone_slug", routeParams.marketSlug)
      .eq("area_slug", routeParams.areaSlug)
      .eq("community_slug", routeParams.communitySlug)
      .eq("market_segment", selectedMarket)
      .eq("property_type_segment", selectedPropertyType)
      .eq("bedroom_segment", "all")
      .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (error || developmentError || developmentDrilldownError) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading community data.</p>
        <pre className="mt-4 text-sm">{error?.message ?? developmentError?.message ?? developmentDrilldownError?.message}</pre>
      </main>
    );
  }

  const row = data as CommunitySnapshot | null;
  const drilldownRowsTyped =
  (drilldownRows ?? []) as CommunityListingDrilldown[];

  const developmentRows = sortDevelopmentRows(
    ((developmentData ?? []) as DevelopmentSnapshot[]).filter((development) => {
      if (selectedPropertyType === "houses") return true;

      return Number(development.condo_property_count ?? 0) >= 2;
    }),
    selectedSort,
    selectedDir
  );

  function getListingIds(
    metricGroup: "active" | "pending" | "sold_12mo",
    bedroomSegment: "all" | "0br" | "1br" | "2br" | "3br_plus"
  ) {
    return (
      drilldownRowsTyped.find(
        (r) =>
          r.metric_group === metricGroup &&
          r.bedroom_segment === bedroomSegment
      )?.listing_ids ?? null
    );
  }

  const developmentDrilldownLookup = new Map<string, DevelopmentListingDrilldown>();

  for (const row of (developmentDrilldownRows ?? []) as DevelopmentListingDrilldown[]) {
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

  const communityName =
  row?.community_name ?? formatSlugTitle(routeParams.communitySlug);

const areaName = row?.area_name ?? formatSlugTitle(routeParams.areaSlug);
const zoneName = row?.zone_name ?? formatSlugTitle(routeParams.marketSlug);

const snapshotDate = row?.snapshot_date
  ? formatDate(row.snapshot_date)
  : "Unknown";

/*
  Structured data for Google.

  BreadcrumbList helps search engines understand the page hierarchy:
  SearchPV > Zone > Area > Community.

  Place helps search engines understand that this page represents a real
  community/location, not just a generic statistics page.
*/
const pageUrl = `https://searchpv.com/markets/${routeParams.marketSlug}/areas/${routeParams.areaSlug}/communities/${routeParams.communitySlug}`;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "SearchPV",
      item: "https://searchpv.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: zoneName,
      item: `https://searchpv.com/markets/${routeParams.marketSlug}`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: areaName,
      item: `https://searchpv.com/markets/${routeParams.marketSlug}/areas/${routeParams.areaSlug}`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: communityName,
      item: pageUrl,
    },
  ],
};

const placeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Place",
  name: communityName,
  url: pageUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: communityName,
    addressRegion: areaName,
    addressCountry: "MX",
  },
  containedInPlace: {
    "@type": "Place",
    name: zoneName,
  },
};

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Structured data only. Not visible on the page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
     />
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div style={{ marginTop: "32px", textAlign: "left" }}>
            <MainSloganBranding />

            <h1
              style={{
                marginTop: "10px",
                fontSize: "28px",
                lineHeight: "1.2",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              {communityName}
            </h1>

            {row && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "#cbd5e1",
                }}
              >
                {row.zone_name} &gt; {row.area_name}
              </p>
            )}

            <p
              style={{
                marginTop: "18px",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              Data Current As Of: {snapshotDate}
            </p>

            <CommunitySelectors
              marketSlug={routeParams.marketSlug}
              areaSlug={routeParams.areaSlug}
              communitySlug={routeParams.communitySlug}
              selectedMarket={selectedMarket}
              selectedPropertyType={selectedPropertyType}
            />
          </div>
        </div>
      </section>

      {row && (
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
            <Link
              href="/"
              style={{ color: "#ffffff", textDecoration: "underline" }}
            >
              {row.zone_name}
            </Link>

            {" > "}

            <Link
              href={areaHref(
                routeParams.marketSlug,
                routeParams.areaSlug,
                selectedMarket,
                selectedPropertyType
              )}
              style={{ color: "#ffffff", textDecoration: "underline" }}
            >
              {row.area_name}
            </Link>

            {" > "}

            <span>{row.community_name}</span>

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
      )}

      {!row ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="rounded-xl bg-white p-8 shadow">
            <h2 className="text-xl font-bold">No data available</h2>
            <p className="mt-2 text-slate-600">
              There are no {communityName} records for this combination of
              filters.
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard
              label="Active Listings"
              value={
                <IdxListingLink listingIds={getListingIds("active", "all")}>
                  {row.active_count ?? 0}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink listingIds={getListingIds("active", "0br")}>
                    {row.active_0br ?? 0}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink listingIds={getListingIds("active", "1br")}>
                    {row.active_1br ?? 0}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink listingIds={getListingIds("active", "2br")}>
                    {row.active_2br ?? 0}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink listingIds={getListingIds("active", "3br_plus")}>
                    {row.active_3br_plus ?? 0}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Pending Listings"
              value={
                <IdxListingLink listingIds={getListingIds("pending", "all")}>
                  {row.pending_count ?? 0}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink listingIds={getListingIds("pending", "0br")}>
                    {row.pending_0br ?? 0}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink listingIds={getListingIds("pending", "1br")}>
                    {row.pending_1br ?? 0}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink listingIds={getListingIds("pending", "2br")}>
                    {row.pending_2br ?? 0}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink listingIds={getListingIds("pending", "3br_plus")}>
                    {row.pending_3br_plus ?? 0}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Closed Sales - 12 Mo"
              value={
                <ClosedSalesListingLink listingIds={getListingIds("sold_12mo", "all")}>
                  {row.sales_12mo ?? 0}
                </ClosedSalesListingLink>
              }
              breakdown={{
                studio: (
                  <ClosedSalesListingLink listingIds={getListingIds("sold_12mo", "0br")}>
                    {row.sales_0br_12mo ?? 0}
                  </ClosedSalesListingLink>
                ),
                oneBed: (
                  <ClosedSalesListingLink listingIds={getListingIds("sold_12mo", "1br")}>
                    {row.sales_1br_12mo ?? 0}
                  </ClosedSalesListingLink>
                ),
                twoBed: (
                  <ClosedSalesListingLink listingIds={getListingIds("sold_12mo", "2br")}>
                    {row.sales_2br_12mo ?? 0}
                  </ClosedSalesListingLink>
                ),
                threeBedPlus: (
                  <ClosedSalesListingLink listingIds={getListingIds("sold_12mo", "3br_plus")}>
                    {row.sales_3br_plus_12mo ?? 0}
                  </ClosedSalesListingLink>
                ),
              }}
            />

            <ToggleMetricCard
              label="Sold Price"
              optionA={{
                key: "median",
                label: "Median",
                format: "money",
                value: row?.median_sold_price ?? null,
                breakdown: {
                  studio: row?.median_sold_price_0br ?? null,
                  oneBed: row?.median_sold_price_1br ?? null,
                  twoBed: row?.median_sold_price_2br ?? null,
                  threeBedPlus: row?.median_sold_price_3br_plus ?? null,
                },
              }}
              optionB={{
                key: "average",
                label: "Average",
                format: "money",
                value: row?.avg_sold_price ?? null,
                breakdown: {
                  studio: row?.avg_sold_price_0br ?? null,
                  oneBed: row?.avg_sold_price_1br ?? null,
                  twoBed: row?.avg_sold_price_2br ?? null,
                  threeBedPlus: row?.avg_sold_price_3br_plus ?? null,
                },
              }}
            />

            <ToggleMetricCard
              label="Price / Measure"
              optionA={{
                key: "ft2",
                label: "$/Ft²",
                format: "priceMeasure",
                value: row?.avg_sold_price_ft2 ?? null,
                breakdown: {
                  studio: row?.avg_sold_price_ft2_0br ?? null,
                  oneBed: row?.avg_sold_price_ft2_1br ?? null,
                  twoBed: row?.avg_sold_price_ft2_2br ?? null,
                  threeBedPlus: row?.avg_sold_price_ft2_3br_plus ?? null,
                },
              }}
              optionB={{
                key: "m2",
                label: "$/M²",
                format: "priceMeasure",
                value: row?.avg_sold_price_m2 ?? null,
                breakdown: {
                  studio: row?.avg_sold_price_m2_0br ?? null,
                  oneBed: row?.avg_sold_price_m2_1br ?? null,
                  twoBed: row?.avg_sold_price_m2_2br ?? null,
                  threeBedPlus: row?.avg_sold_price_m2_3br_plus ?? null,
                },
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
                For {formatMarketDescription(selectedMarket)}{" "}
                {formatPropertyTypeDescription(selectedPropertyType)} in{" "}
                <strong>{row.community_name}</strong>, there are currently{" "}
                <strong>{row.active_count ?? 0}</strong> active listings,{" "}
                <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
                <strong>{row.sales_12mo ?? 0}</strong> closed sales over the
                past 12 months. The median sold price is{" "}
                <strong>{formatMoney(row.median_sold_price)}</strong>, with
                average sold pricing around{" "}
                <strong>{formatMoney(row.avg_sold_price_ft2)}</strong> per
                square foot. Current months of inventory is{" "}
                <strong>{formatNumber(row.months_inventory)}</strong>.
              </p>
            </div>
          </div>

          <div id="development-snapshot" style={{ paddingTop: "48px" }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
              <h2 className="text-2xl font-bold">Development Snapshot</h2>
              <p className="mt-2 text-sm text-slate-600">
                Developments in {row.community_name}
              </p>

              {developmentRows.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No developments match this combination of filters.
                </p>
              ) : (
                <>
                  <p className="mt-4 text-xs text-slate-500 md:hidden">
                    ← Swipe to see additional columns →
                  </p>

                  <div
                    style={{
                      marginTop: "16px",
                      maxHeight: "620px",
                      width: "100%",
                      maxWidth: "100%",
                      overflowX: "auto",
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-x pan-y",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <table
                      style={{
                        minWidth: "900px",
                        width: "max-content",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        fontSize: "14px",
                      }}
                    >
                      <thead>
                        <tr>
                          <SortableTh
                            label="Development"
                            sortKey="development"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "development", selectedSort, selectedDir)}
                            stickyLeft
                          />
                          <SortableThRight
                            label="Active"
                            sortKey="active_count"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "active_count", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="Pending"
                            sortKey="pending_count"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "pending_count", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="Sales 12 Mo"
                            sortKey="sales_12mo"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "sales_12mo", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="Median Sold"
                            sortKey="median_sold_price"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "median_sold_price", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="Avg $/ft²"
                            sortKey="avg_sold_price_ft2"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "avg_sold_price_ft2", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="DOM"
                            sortKey="sold_avg_dom_12mo"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "sold_avg_dom_12mo", selectedSort, selectedDir)}
                          />
                          <SortableThRight
                            label="MOI"
                            sortKey="months_inventory"
                            selectedSort={selectedSort}
                            selectedDir={selectedDir}
                            href={communitySortHref(routeParams.marketSlug, routeParams.areaSlug, routeParams.communitySlug, selectedMarket, selectedPropertyType, "months_inventory", selectedSort, selectedDir)}
                          />
                        </tr>
                      </thead>

                      <tbody>
                        {developmentRows.map((development) => (
                          <tr
                            key={`${development.zone_slug}-${development.area_slug}-${development.community_slug}-${development.development_slug}`}
                          >
                            <StickyTd>
                              <Link
                                href={developmentHref(
                                  routeParams.marketSlug,
                                  routeParams.areaSlug,
                                  routeParams.communitySlug,
                                  development.development_slug,
                                  selectedMarket,
                                  selectedPropertyType
                                )}
                                className="font-semibold text-blue-700 hover:underline"
                              >
                                {development.development_name}
                              </Link>
                            </StickyTd>

                            <TdRight>
                              <IdxListingLink
                                listingIds={
                                  developmentDrilldownLookup.get(
                                    developmentDrilldownKey(
                                      development.zone_slug,
                                      development.area_slug,
                                      development.community_slug,
                                      development.development_slug,
                                      "active"
                                    )
                                  )?.listing_ids
                                }
                              >
                                {development.active_count ?? 0}
                              </IdxListingLink>
                            </TdRight>

                            <TdRight>
                              <IdxListingLink
                                listingIds={
                                  developmentDrilldownLookup.get(
                                    developmentDrilldownKey(
                                      development.zone_slug,
                                      development.area_slug,
                                      development.community_slug,
                                      development.development_slug,
                                      "pending"
                                    )
                                  )?.listing_ids
                                }
                              >
                                {development.pending_count ?? 0}
                              </IdxListingLink>
                            </TdRight>

                            <TdRight>
                              <ClosedSalesListingLink
                                listingIds={
                                  developmentDrilldownLookup.get(
                                    developmentDrilldownKey(
                                      development.zone_slug,
                                      development.area_slug,
                                      development.community_slug,
                                      development.development_slug,
                                      "sold_12mo"
                                    )
                                  )?.listing_ids
                                }
                              >
                                {development.sales_12mo ?? 0}
                              </ClosedSalesListingLink>
                            </TdRight>

                            <TdRight>{formatMoney(development.median_sold_price)}</TdRight>
                            <TdRight>{formatMoney(development.avg_sold_price_ft2)}</TdRight>
                            <TdRight>{formatNumber(development.sold_avg_dom_12mo)}</TdRight>
                            <TdRight>{formatNumber(development.months_inventory)}</TdRight>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function CommunitySelectors({
  marketSlug,
  areaSlug,
  communitySlug,
  selectedMarket,
  selectedPropertyType,
}: {
  marketSlug: string;
  areaSlug: string;
  communitySlug: string;
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
          href={communityHref(marketSlug, areaSlug, communitySlug, selectedMarket, "all")}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref(marketSlug, areaSlug, communitySlug, selectedMarket, "condos")}
          style={selectedPropertyType === "condos" ? selectedStyle : unselectedStyle}
        >
          Condos
        </a>

        <a
          href={communityHref(marketSlug, areaSlug, communitySlug, selectedMarket, "houses")}
          style={selectedPropertyType === "houses" ? selectedStyle : unselectedStyle}
        >
          Houses
        </a>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <a
          href={communityHref(marketSlug, areaSlug, communitySlug, "all", selectedPropertyType)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref(
            marketSlug,
            areaSlug,
            communitySlug,
            "pre_construction",
            selectedPropertyType
          )}
          style={selectedMarket === "pre_construction" ? selectedStyle : unselectedStyle}
        >
          Pre-Construction
        </a>

        <a
          href={communityHref(marketSlug, areaSlug, communitySlug, "resale", selectedPropertyType)}
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
  value: React.ReactNode;
  breakdown?: {
    studio: React.ReactNode;
    oneBed: React.ReactNode;
    twoBed: React.ReactNode;
    threeBedPlus: React.ReactNode;
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
      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>

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

function IdxListingLink({
  listingIds,
  children,
}: {
  listingIds?: string | null;
  children: React.ReactNode;
}) {
  if (!listingIds) {
    return <span>{children}</span>;
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
  listingIds?: string | null;
  children: React.ReactNode;
}) {
  if (!listingIds) {
    return <span>{children}</span>;
  }

  return (
    <Link
      href={`/market-intelligence/closed-sales/search-results?mls=${listingIds}`}
      className="font-semibold text-blue-700 hover:underline"
    >
      {children}
    </Link>
  );
}

function developmentDrilldownKey(
  zoneSlug: string | null,
  areaSlug: string | null,
  communitySlug: string | null,
  developmentSlug: string,
  metricGroup: "active" | "pending" | "sold_12mo"
) {
  return `${zoneSlug ?? ""}|${areaSlug ?? ""}|${communitySlug ?? ""}|${developmentSlug}|${metricGroup}`;
}

function ContactDevelopmentLink({
  development,
  market,
  propertyType,
  listingCount,
  children,
}: {
  development: DevelopmentSnapshot;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  listingCount: number;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  params.set("zone", development.zone_name ?? "");
  params.set("area", development.area_name ?? "");
  params.set("community", development.community_name ?? "");
  params.set("development", development.development_name);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", "sold_12mo");
  params.set("bedroom", "all");
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

function ContactLink({
  row,
  market,
  propertyType,
  listingCount,
  children,
}: {
  row: CommunitySnapshot;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  listingCount: number;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  params.set("zone", row.zone_name ?? "");
  params.set("area", row.area_name ?? "");
  params.set("community", row.community_name);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", "sold_12mo");
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


function developmentHref(
  marketSlug: string,
  areaSlug: string,
  communitySlug: string,
  developmentSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const queryString = params.toString();

  const path = `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}/developments/${developmentSlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function communityHref(
  marketSlug: string,
  areaSlug: string,
  communitySlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const queryString = params.toString();

  const path = `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function areaHref(
  marketSlug: string,
  areaSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const queryString = params.toString();
  const path = `/markets/${marketSlug}/areas/${areaSlug}`;

  return queryString ? `${path}?${queryString}` : path;
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

function formatSlugTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function formatDate(value: string) {
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

function formatCurrencyNumber(value: number | null) {
  if (value === null || value === undefined) return "-";

  return "$" + Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function SortableTh({
  label,
  sortKey,
  selectedSort,
  selectedDir,
  href,
  stickyLeft = false,
}: {
  label: string;
  sortKey: SortKey;
  selectedSort: SortKey;
  selectedDir: SortDir;
  href: string;
  stickyLeft?: boolean;
}) {
  const active = selectedSort === sortKey;
  const arrow = active ? (selectedDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      style={{
        position: "sticky",
        top: 0,
        left: stickyLeft ? 0 : undefined,
        zIndex: stickyLeft ? 30 : 20,
        backgroundColor: "#f1f5f9",
        padding: "12px 16px",
        textAlign: "left",
        fontWeight: 700,
        whiteSpace: "nowrap",
        width: stickyLeft ? "180px" : undefined,
        minWidth: stickyLeft ? "180px" : undefined,
        maxWidth: stickyLeft ? "180px" : undefined,
        borderBottom: "1px solid #e2e8f0",
        boxShadow: stickyLeft ? "2px 0 0 #e2e8f0" : undefined,
      }}
    >
      <Link href={href} className="text-slate-700 hover:text-blue-700">
        {label}
        {arrow}
      </Link>
    </th>
  );
}

function SortableThRight(props: Omit<Parameters<typeof SortableTh>[0], "stickyLeft">) {
  const active = props.selectedSort === props.sortKey;
  const arrow = active ? (props.selectedDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backgroundColor: "#f1f5f9",
        padding: "12px 16px",
        textAlign: "right",
        fontWeight: 700,
        whiteSpace: "nowrap",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <Link href={props.href} className="text-slate-700 hover:text-blue-700">
        {props.label}
        {arrow}
      </Link>
    </th>
  );
}

function StickyTd({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        position: "sticky",
        left: 0,
        zIndex: 10,
        backgroundColor: "#ffffff",
        padding: "12px 16px",
        whiteSpace: "nowrap",
        width: "180px",
        minWidth: "180px",
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        borderTop: "1px solid #e2e8f0",
        boxShadow: "2px 0 0 #e2e8f0",
      }}
    >
      {children}
    </td>
  );
}

function TdRight({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: "right",
        whiteSpace: "nowrap",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      {children}
    </td>
  );
}

function getSortKey(value?: string): SortKey {
  if (
    value === "development" ||
    value === "active_count" ||
    value === "pending_count" ||
    value === "sales_12mo" ||
    value === "median_sold_price" ||
    value === "avg_sold_price_ft2" ||
    value === "sold_avg_dom_12mo" ||
    value === "months_inventory"
  ) {
    return value;
  }

  return "active_count";
}

function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function sortDevelopmentRows(
  rows: DevelopmentSnapshot[],
  sortKey: SortKey,
  sortDir: SortDir
) {
  return [...rows].sort((a, b) => {
    const direction = sortDir === "asc" ? 1 : -1;

    if (sortKey === "development") {
      return direction * a.development_name.localeCompare(b.development_name);
    }

    const aValue = Number(a[sortKey] ?? 0);
    const bValue = Number(b[sortKey] ?? 0);

    return direction * (aValue - bValue);
  });
}

function communitySortHref(
  marketSlug: string,
  areaSlug: string,
  communitySlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  nextSort: SortKey,
  currentSort: SortKey,
  currentDir: SortDir
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);

  const nextDir =
    currentSort === nextSort && currentDir === "desc" ? "asc" : "desc";

  params.set("sort", nextSort);
  params.set("dir", nextDir);

  return `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}?${params.toString()}#development-snapshot`;
}