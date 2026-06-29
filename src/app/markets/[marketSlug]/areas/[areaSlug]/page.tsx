import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import ToggleMetricCard from "@/app/components/ToggleMetricCard";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type MetricGroup = "active" | "pending" | "sold_12mo";
type BedroomSegment = "all" | "0br" | "1br" | "2br" | "3br_plus";

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

  avg_sold_price: number | null;
  avg_sold_price_0br: number | null;
  avg_sold_price_1br: number | null;
  avg_sold_price_2br: number | null;
  avg_sold_price_3br_plus: number | null;

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

  avg_sold_price_m2: number | null;
  avg_sold_price_m2_0br: number | null;
  avg_sold_price_m2_1br: number | null;
  avg_sold_price_m2_2br: number | null;
  avg_sold_price_m2_3br_plus: number | null;

  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;
  months_inventory_0br: number | null;
  months_inventory_1br: number | null;
  months_inventory_2br: number | null;
  months_inventory_3br_plus: number | null;
};

type AreaListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: BedroomSegment;
  listing_count: number;
  listing_ids: string | null;
};

type CommunityListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: BedroomSegment;
  listing_count: number;
  listing_ids: string | null;
};

type AreaRollup = {
  zone_name: string | null;
  zone_slug: string | null;
  area_name: string | null;
  area_slug: string | null;
  snapshot_date: string | null;

  active_count: number;
  active_0br: number;
  active_1br: number;
  active_2br: number;
  active_3br_plus: number;

  pending_count: number;
  pending_0br: number;
  pending_1br: number;
  pending_2br: number;
  pending_3br_plus: number;

  sales_12mo: number;
  sales_0br_12mo: number;
  sales_1br_12mo: number;
  sales_2br_12mo: number;
  sales_3br_plus_12mo: number;

  avg_sold_price: number | null;
  avg_sold_price_0br: number | null;
  avg_sold_price_1br: number | null;
  avg_sold_price_2br: number | null;
  avg_sold_price_3br_plus: number | null;

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

  avg_sold_price_m2: number | null;
  avg_sold_price_m2_0br: number | null;
  avg_sold_price_m2_1br: number | null;
  avg_sold_price_m2_2br: number | null;
  avg_sold_price_m2_3br_plus: number | null;

  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;
  months_inventory_0br: number | null;
  months_inventory_1br: number | null;
  months_inventory_2br: number | null;
  months_inventory_3br_plus: number | null;
};

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{
    marketSlug: string;
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
    .from("community_snapshot")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  const { data: drilldownRows, error: drilldownError } = await supabase
    .from("area_listing_drilldown")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  const { data: communityDrilldownRows, error: communityDrilldownError } =
    await supabase
      .from("community_listing_drilldown")
      .select("*")
      .eq("zone_slug", routeParams.marketSlug)
      .eq("area_slug", routeParams.areaSlug)
      .eq("market_segment", selectedMarket)
      .eq("property_type_segment", selectedPropertyType)
      .eq("bedroom_segment", "all")
      .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (error || drilldownError || communityDrilldownError) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading area data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? drilldownError?.message ?? communityDrilldownError?.message}
        </pre>
      </main>
    );
  }

  const communityRows = ((data ?? []) as CommunitySnapshot[]).sort(
    (a, b) => Number(b.active_count ?? 0) - Number(a.active_count ?? 0)
  );

  const rollup = buildAreaRollup(
    communityRows,
    routeParams.marketSlug,
    routeParams.areaSlug
  );

  const areaDrilldownRows = (drilldownRows ?? []) as AreaListingDrilldown[];
  const communityDrilldownLookup = new Map<string, CommunityListingDrilldown>();

  for (const row of (communityDrilldownRows ?? []) as CommunityListingDrilldown[]) {
    communityDrilldownLookup.set(
      communityDrilldownKey(
        row.zone_slug,
        row.area_slug,
        row.community_slug,
        row.metric_group
      ),
      row
    );
  }

  function getAreaListingIds(
    metricGroup: MetricGroup,
    bedroomSegment: BedroomSegment
  ) {
    return (
      areaDrilldownRows.find(
        (r) =>
          r.metric_group === metricGroup &&
          r.bedroom_segment === bedroomSegment
      )?.listing_ids ?? null
    );
  }

  const areaName = rollup.area_name ?? formatSlugTitle(routeParams.areaSlug);
  const zoneName = rollup.zone_name ?? formatSlugTitle(routeParams.marketSlug);

  const snapshotDate = rollup.snapshot_date
    ? formatDate(rollup.snapshot_date)
    : "Unknown";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-slate-300 hover:underline">
            ← BACK TO SEARCHPV
          </Link>

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
              {areaName}
            </h1>

            <p
              style={{
                marginTop: "12px",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              {zoneName}
            </p>

            <p
              style={{
                marginTop: "18px",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              Snapshot Date: {snapshotDate}
            </p>

            <AreaSelectors
              marketSlug={routeParams.marketSlug}
              areaSlug={routeParams.areaSlug}
              selectedMarket={selectedMarket}
              selectedPropertyType={selectedPropertyType}
            />
          </div>
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
          <Link
            href="/"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
            }}
          >
            SearchPV
          </Link>

          {" > "}

          <Link
            href="/"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
            }}
          >
            {zoneName}
          </Link>

          {" > "}

          <span>{areaName}</span>

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

      {communityRows.length === 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="rounded-xl bg-white p-8 shadow">
            <h2 className="text-xl font-bold">No data available</h2>
            <p className="mt-2 text-slate-600">
              There are no {areaName} records for this combination of filters.
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard
              label="Active Listings"
              value={
                <IdxListingLink listingIds={getAreaListingIds("active", "all")}>
                  {rollup.active_count}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("active", "0br")}
                  >
                    {rollup.active_0br}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("active", "1br")}
                  >
                    {rollup.active_1br}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("active", "2br")}
                  >
                    {rollup.active_2br}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("active", "3br_plus")}
                  >
                    {rollup.active_3br_plus}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Pending Listings"
              value={
                <IdxListingLink
                  listingIds={getAreaListingIds("pending", "all")}
                >
                  {rollup.pending_count}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("pending", "0br")}
                  >
                    {rollup.pending_0br}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("pending", "1br")}
                  >
                    {rollup.pending_1br}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("pending", "2br")}
                  >
                    {rollup.pending_2br}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink
                    listingIds={getAreaListingIds("pending", "3br_plus")}
                  >
                    {rollup.pending_3br_plus}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Closed Sales - 12 Mo"
              value={
                <ContactAreaLink
                  zoneName={rollup.zone_name}
                  areaName={rollup.area_name}
                  market={selectedMarket}
                  propertyType={selectedPropertyType}
                  listingCount={rollup.sales_12mo}
                >
                  {rollup.sales_12mo}
                </ContactAreaLink>
              }
              breakdown={{
                studio: (
                  <ContactAreaLink
                    zoneName={rollup.zone_name}
                    areaName={rollup.area_name}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={rollup.sales_0br_12mo}
                    bedroom="0br"
                  >
                    {rollup.sales_0br_12mo}
                  </ContactAreaLink>
                ),
                oneBed: (
                  <ContactAreaLink
                    zoneName={rollup.zone_name}
                    areaName={rollup.area_name}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={rollup.sales_1br_12mo}
                    bedroom="1br"
                  >
                    {rollup.sales_1br_12mo}
                  </ContactAreaLink>
                ),
                twoBed: (
                  <ContactAreaLink
                    zoneName={rollup.zone_name}
                    areaName={rollup.area_name}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={rollup.sales_2br_12mo}
                    bedroom="2br"
                  >
                    {rollup.sales_2br_12mo}
                  </ContactAreaLink>
                ),
                threeBedPlus: (
                  <ContactAreaLink
                    zoneName={rollup.zone_name}
                    areaName={rollup.area_name}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={rollup.sales_3br_plus_12mo}
                    bedroom="3br_plus"
                  >
                    {rollup.sales_3br_plus_12mo}
                  </ContactAreaLink>
                ),
              }}
            />

            <ToggleMetricCard
              label="Sold Price"
              optionA={{
                key: "median",
                label: "Median",
                format: "money",
                value: rollup.median_sold_price,
                breakdown: {
                  studio: rollup.median_sold_price_0br,
                  oneBed: rollup.median_sold_price_1br,
                  twoBed: rollup.median_sold_price_2br,
                  threeBedPlus: rollup.median_sold_price_3br_plus,
                },
              }}
              optionB={{
                key: "average",
                label: "Average",
                format: "money",
                value: rollup.avg_sold_price,
                breakdown: {
                  studio: rollup.avg_sold_price_0br,
                  oneBed: rollup.avg_sold_price_1br,
                  twoBed: rollup.avg_sold_price_2br,
                  threeBedPlus: rollup.avg_sold_price_3br_plus,
                },
              }}
            />

            <ToggleMetricCard
              label="Price / Measure"
              optionA={{
                key: "ft2",
                label: "$/ft²",
                format: "priceMeasure",
                value: rollup.avg_sold_price_ft2,
                breakdown: {
                  studio: rollup.avg_sold_price_ft2_0br,
                  oneBed: rollup.avg_sold_price_ft2_1br,
                  twoBed: rollup.avg_sold_price_ft2_2br,
                  threeBedPlus: rollup.avg_sold_price_ft2_3br_plus,
                },
              }}
              optionB={{
                key: "m2",
                label: "$/m²",
                format: "priceMeasure",
                value: rollup.avg_sold_price_m2,
                breakdown: {
                  studio: rollup.avg_sold_price_m2_0br,
                  oneBed: rollup.avg_sold_price_m2_1br,
                  twoBed: rollup.avg_sold_price_m2_2br,
                  threeBedPlus: rollup.avg_sold_price_m2_3br_plus,
                },
              }}
            />

            <MetricCard
              label="Months Inventory"
              value={formatNumber(rollup.months_inventory)}
              breakdown={{
                studio: formatNumber(rollup.months_inventory_0br),
                oneBed: formatNumber(rollup.months_inventory_1br),
                twoBed: formatNumber(rollup.months_inventory_2br),
                threeBedPlus: formatNumber(rollup.months_inventory_3br_plus),
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
                <strong>{areaName}</strong>, there are currently{" "}
                <strong>{rollup.active_count}</strong> active listings,{" "}
                <strong>{rollup.pending_count}</strong> pending listings, and{" "}
                <strong>{rollup.sales_12mo}</strong> closed sales over the past
                12 months. The median sold price is{" "}
                <strong>{formatMoney(rollup.median_sold_price)}</strong>, with
                average sold pricing around{" "}
                <strong>{formatMoney(rollup.avg_sold_price_ft2)}</strong> per
                square foot. Current months of inventory is{" "}
                <strong>{formatNumber(rollup.months_inventory)}</strong>.
              </p>
            </div>
          </div>

          <div style={{ paddingTop: "48px" }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
              <h2 className="text-2xl font-bold">Community Snapshot</h2>
              <p className="mt-2 text-sm text-slate-600">
                Communities in {areaName}
              </p>

              <p className="mt-4 text-xs text-slate-500 md:hidden">
                ← Swipe to see additional columns →
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[850px] text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <Th>Community</Th>
                      <ThRight>Active</ThRight>
                      <ThRight>Pending</ThRight>
                      <ThRight>Sales 12 Mo</ThRight>
                      <ThRight>Median Sold</ThRight>
                      <ThRight>Avg $/ft²</ThRight>
                      <ThRight>DOM</ThRight>
                      <ThRight>MOI</ThRight>
                    </tr>
                  </thead>

                  <tbody>
                    {communityRows.map((community) => (
                      <tr
                        key={`${community.zone_slug}-${community.area_slug}-${community.community_slug}`}
                        className="border-t"
                      >
                        <Td>
                          <Link
                            href={communityHref(
                              routeParams.marketSlug,
                              routeParams.areaSlug,
                              community.community_slug,
                              selectedMarket,
                              selectedPropertyType
                            )}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {community.community_name}
                          </Link>
                        </Td>
                        <TdRight>
                          <IdxListingLink
                            listingIds={
                              communityDrilldownLookup.get(
                                communityDrilldownKey(
                                  community.zone_slug,
                                  community.area_slug,
                                  community.community_slug,
                                  "active"
                                )
                              )?.listing_ids
                            }
                          >
                            {community.active_count ?? 0}
                          </IdxListingLink>
                        </TdRight>
                        <TdRight>
                          <IdxListingLink
                            listingIds={
                              communityDrilldownLookup.get(
                                communityDrilldownKey(
                                  community.zone_slug,
                                  community.area_slug,
                                  community.community_slug,
                                  "pending"
                                )
                              )?.listing_ids
                            }
                          >
                            {community.pending_count ?? 0}
                          </IdxListingLink>
                        </TdRight>
                        <TdRight>
                          <ContactCommunityLink
                            zoneName={community.zone_name}
                            areaName={community.area_name}
                            communityName={community.community_name}
                            market={selectedMarket}
                            propertyType={selectedPropertyType}
                            listingCount={
                              communityDrilldownLookup.get(
                                communityDrilldownKey(
                                  community.zone_slug,
                                  community.area_slug,
                                  community.community_slug,
                                  "sold_12mo"
                                )
                              )?.listing_count ?? community.sales_12mo ?? 0
                            }
                          >
                            {community.sales_12mo ?? 0}
                          </ContactCommunityLink>
                        </TdRight>
                        <TdRight>
                          {formatMoney(community.median_sold_price)}
                        </TdRight>
                        <TdRight>
                          {formatMoney(community.avg_sold_price_ft2)}
                        </TdRight>
                        <TdRight>
                          {formatNumber(community.sold_avg_dom_12mo)}
                        </TdRight>
                        <TdRight>{formatNumber(community.months_inventory)}</TdRight>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function AreaSelectors({
  marketSlug,
  areaSlug,
  selectedMarket,
  selectedPropertyType,
}: {
  marketSlug: string;
  areaSlug: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
}) {
  const baseStyle: CSSProperties = {
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

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
    maxWidth: "360px",
  };

  const selectedStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: "#ffffff",
    color: "#020617",
    borderColor: "#ffffff",
  };

  const unselectedStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: "transparent",
    color: "#ffffff",
  };

  return (
    <div style={{ marginTop: "18px" }}>
      <div style={rowStyle}>
        <a
          href={areaHref(marketSlug, areaSlug, selectedMarket, "all")}
          style={
            selectedPropertyType === "all" ? selectedStyle : unselectedStyle
          }
        >
          All
        </a>

        <a
          href={areaHref(marketSlug, areaSlug, selectedMarket, "condos")}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={areaHref(marketSlug, areaSlug, selectedMarket, "houses")}
          style={
            selectedPropertyType === "houses" ? selectedStyle : unselectedStyle
          }
        >
          Houses
        </a>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <a
          href={areaHref(marketSlug, areaSlug, "all", selectedPropertyType)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={areaHref(
            marketSlug,
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
          href={areaHref(marketSlug, areaSlug, "resale", selectedPropertyType)}
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
  value: ReactNode;
  breakdown?: {
    studio: ReactNode;
    oneBed: ReactNode;
    twoBed: ReactNode;
    threeBedPlus: ReactNode;
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
  children: ReactNode;
}) {
  if (!listingIds) return <span>{children}</span>;

  return (
    <a
      href={buildIdxUrl(listingIds)}
      className="font-semibold text-blue-700 hover:underline"
    >
      {children}
    </a>
  );
}


function communityDrilldownKey(
  zoneSlug: string | null,
  areaSlug: string | null,
  communitySlug: string,
  metricGroup: MetricGroup
) {
  return `${zoneSlug ?? ""}|${areaSlug ?? ""}|${communitySlug}|${metricGroup}`;
}

function ContactCommunityLink({
  zoneName,
  areaName,
  communityName,
  market,
  propertyType,
  listingCount,
  bedroom = "all",
  children,
}: {
  zoneName: string | null;
  areaName: string | null;
  communityName: string;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  listingCount: number;
  bedroom?: string;
  children: ReactNode;
}) {
  const params = new URLSearchParams();

  if (zoneName) params.set("zone", zoneName);
  if (areaName) params.set("area", areaName);
  params.set("community", communityName);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", "sold_12mo");
  params.set("bedroom", bedroom);
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

function ContactAreaLink({
  zoneName,
  areaName,
  market,
  propertyType,
  listingCount,
  bedroom = "all",
  children,
}: {
  zoneName: string | null;
  areaName: string | null;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  listingCount: number;
  bedroom?: string;
  children: ReactNode;
}) {
  const params = new URLSearchParams();

  if (zoneName) params.set("zone", zoneName);
  if (areaName) params.set("area", areaName);

  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", "sold_12mo");
  params.set("bedroom", bedroom);
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

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}

function ThRight({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-right font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function TdRight({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-right">{children}</td>;
}

function buildAreaRollup(
  rows: CommunitySnapshot[],
  marketSlug: string,
  areaSlug: string
): AreaRollup {
  const firstRow = rows[0];

  const activeCount = sum(rows, "active_count");
  const sales12mo = sum(rows, "sales_12mo");

  const sales0br = sum(rows, "sales_0br_12mo");
  const sales1br = sum(rows, "sales_1br_12mo");
  const sales2br = sum(rows, "sales_2br_12mo");
  const sales3br = sum(rows, "sales_3br_plus_12mo");

  const active0br = sum(rows, "active_0br");
  const active1br = sum(rows, "active_1br");
  const active2br = sum(rows, "active_2br");
  const active3br = sum(rows, "active_3br_plus");

  return {
    zone_name: firstRow?.zone_name ?? formatSlugTitle(marketSlug),
    zone_slug: firstRow?.zone_slug ?? marketSlug,
    area_name: firstRow?.area_name ?? formatSlugTitle(areaSlug),
    area_slug: firstRow?.area_slug ?? areaSlug,
    snapshot_date: firstRow?.snapshot_date ?? null,

    active_count: activeCount,
    active_0br: active0br,
    active_1br: active1br,
    active_2br: active2br,
    active_3br_plus: active3br,

    pending_count: sum(rows, "pending_count"),
    pending_0br: sum(rows, "pending_0br"),
    pending_1br: sum(rows, "pending_1br"),
    pending_2br: sum(rows, "pending_2br"),
    pending_3br_plus: sum(rows, "pending_3br_plus"),

    sales_12mo: sales12mo,
    sales_0br_12mo: sales0br,
    sales_1br_12mo: sales1br,
    sales_2br_12mo: sales2br,
    sales_3br_plus_12mo: sales3br,

    avg_sold_price: weightedAverage(rows, "avg_sold_price", "sales_12mo"),
    avg_sold_price_0br: weightedAverage(rows, "avg_sold_price_0br", "sales_0br_12mo"),
    avg_sold_price_1br: weightedAverage(rows, "avg_sold_price_1br", "sales_1br_12mo"),
    avg_sold_price_2br: weightedAverage(rows, "avg_sold_price_2br", "sales_2br_12mo"),
    avg_sold_price_3br_plus: weightedAverage(rows, "avg_sold_price_3br_plus", "sales_3br_plus_12mo"),

    median_sold_price: weightedAverage(rows, "median_sold_price", "sales_12mo"),
    median_sold_price_0br: weightedAverage(rows, "median_sold_price_0br", "sales_0br_12mo"),
    median_sold_price_1br: weightedAverage(rows, "median_sold_price_1br", "sales_1br_12mo"),
    median_sold_price_2br: weightedAverage(rows, "median_sold_price_2br", "sales_2br_12mo"),
    median_sold_price_3br_plus: weightedAverage(rows, "median_sold_price_3br_plus", "sales_3br_plus_12mo"),

    avg_sold_price_ft2: weightedAverage(rows, "avg_sold_price_ft2", "sales_12mo"),
    avg_sold_price_ft2_0br: weightedAverage(rows, "avg_sold_price_ft2_0br", "sales_0br_12mo"),
    avg_sold_price_ft2_1br: weightedAverage(rows, "avg_sold_price_ft2_1br", "sales_1br_12mo"),
    avg_sold_price_ft2_2br: weightedAverage(rows, "avg_sold_price_ft2_2br", "sales_2br_12mo"),
    avg_sold_price_ft2_3br_plus: weightedAverage(rows, "avg_sold_price_ft2_3br_plus", "sales_3br_plus_12mo"),

    avg_sold_price_m2: weightedAverage(rows, "avg_sold_price_m2", "sales_12mo"),
    avg_sold_price_m2_0br: weightedAverage(rows, "avg_sold_price_m2_0br", "sales_0br_12mo"),
    avg_sold_price_m2_1br: weightedAverage(rows, "avg_sold_price_m2_1br", "sales_1br_12mo"),
    avg_sold_price_m2_2br: weightedAverage(rows, "avg_sold_price_m2_2br", "sales_2br_12mo"),
    avg_sold_price_m2_3br_plus: weightedAverage(rows, "avg_sold_price_m2_3br_plus", "sales_3br_plus_12mo"),

    sold_avg_dom_12mo: weightedAverage(rows, "sold_avg_dom_12mo", "sales_12mo"),

    months_inventory: monthsInventory(activeCount, sales12mo),
    months_inventory_0br: monthsInventory(active0br, sales0br),
    months_inventory_1br: monthsInventory(active1br, sales1br),
    months_inventory_2br: monthsInventory(active2br, sales2br),
    months_inventory_3br_plus: monthsInventory(active3br, sales3br),
  };
}

function sum(rows: CommunitySnapshot[], key: keyof CommunitySnapshot) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function weightedAverage(
  rows: CommunitySnapshot[],
  valueKey: keyof CommunitySnapshot,
  weightKey: keyof CommunitySnapshot
) {
  let totalWeight = 0;
  let totalValue = 0;

  rows.forEach((row) => {
    const value = Number(row[valueKey] ?? 0);
    const weight = Number(row[weightKey] ?? 0);

    if (value > 0 && weight > 0) {
      totalValue += value * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return null;

  return Math.round(totalValue / totalWeight);
}

function monthsInventory(activeCount: number, sales12mo: number) {
  if (!sales12mo) return null;
  return Number((activeCount / (sales12mo / 12)).toFixed(1));
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
