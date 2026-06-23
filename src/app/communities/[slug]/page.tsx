import { buildIdxUrl } from "@/lib/idx";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MainSloganBranding from "@/app/components/MainSloganBranding"

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

type CommunityListingDrilldown = {
  community_name: string;
  community_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: BedroomSegment;
  listing_count: number | null;
  listing_ids: string | null;
};

type PageContent = {
  title: string | null;
  body: string;
};

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
    zone?: string;
    area?: string;
  }>;
}) {
  const routeParams = await params;
  const slug = routeParams.slug;

  const queryParams = await searchParams;

  const selectedMarket = getMarketSegment(queryParams.market);
  const selectedPropertyType = getPropertyTypeSegment(queryParams.propertyType);
  const selectedZone = queryParams.zone;
  const selectedArea = queryParams.area;

  let snapshotQuery = supabase
    .from("community_snapshot")
    .select("*")
    .eq("community_slug", slug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);

  if (selectedZone) {
    snapshotQuery = snapshotQuery.eq("zone_name", selectedZone);
  }

  if (selectedArea) {
    snapshotQuery = snapshotQuery.eq("area_name", selectedArea);
  }

  const { data, error } = await snapshotQuery.maybeSingle();

  const { data: drilldownData, error: drilldownError } = await supabase
    .from("community_listing_drilldown")
    .select("*")
    .eq("community_slug", slug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .in("metric_group", ["active", "pending", "sold_12mo"]);

  if (error || drilldownError) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading community data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? drilldownError?.message}
        </pre>
      </main>
    );
  }

  const row = data as CommunitySnapshot | null;
  const communityName = row?.community_name ?? formatSlugTitle(slug);

  let contentRows: PageContent[] = [];

  if (row?.zone_slug && row?.area_slug && row?.community_slug) {
    const { data: contentData } = await supabase
      .from("page_content")
      .select("title, body")
      .eq("content_type", "description")
      .eq("entity_type", "community")
      .eq("zone_slug", row.zone_slug)
      .eq("area_slug", row.area_slug)
      .eq("community_slug", row.community_slug)
      .order("sort_order", { ascending: true });

    contentRows = (contentData ?? []) as PageContent[];
  }
  const drilldownRows = (drilldownData ?? []) as CommunityListingDrilldown[];

  const drilldownLookup = new Map<string, CommunityListingDrilldown>();

  for (const drilldownRow of drilldownRows) {
    drilldownLookup.set(
      drilldownKey(drilldownRow.metric_group, drilldownRow.bedroom_segment),
      drilldownRow
    );
  }

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
            href={homeHref(
              selectedMarket,
              selectedPropertyType,
              selectedZone,
              selectedArea
            )}
            className="text-sm text-slate-300 hover:underline"
          >
            ← BACK TO COMMUNITY LIST
          </Link>

          <div
            style={{
              marginTop: "32px",
              textAlign: "left",
            }}
          >
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
              slug={slug}
              selectedMarket={selectedMarket}
              selectedPropertyType={selectedPropertyType}
              selectedZone={selectedZone}
              selectedArea={selectedArea}
            />
          </div>
        </div>
      </section>

            {row && (
              <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-2">
                <div
                  className="mx-auto max-w-6xl overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-semibold text-slate-700"
                  title={`${row.zone_name} > ${row.area_name} > ${row.community_name}`}
                >
                  <span>{row.zone_name}</span>

                  {" > "}

                  <Link
                    href={areaHref(
                      row.zone_slug!,
                      row.area_slug!,
                      selectedMarket,
                      selectedPropertyType
                    )}
                    className="text-blue-700 hover:underline"
                  >
                    {row.area_name}
                  </Link>

                  {" > "}

                  <span>{row.community_name}</span>
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
                <IdxListingLink
                  listingIds={getListingIds(drilldownLookup, "active", "all")}
                >
                  {row.active_count ?? 0}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink
                    listingIds={getListingIds(drilldownLookup, "active", "0br")}
                  >
                    {row.active_0br ?? 0}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink
                    listingIds={getListingIds(drilldownLookup, "active", "1br")}
                  >
                    {row.active_1br ?? 0}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink
                    listingIds={getListingIds(drilldownLookup, "active", "2br")}
                  >
                    {row.active_2br ?? 0}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink
                    listingIds={getListingIds(
                      drilldownLookup,
                      "active",
                      "3br_plus"
                    )}
                  >
                    {row.active_3br_plus ?? 0}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Pending Listings"
              value={
                <IdxListingLink
                  listingIds={getListingIds(drilldownLookup, "pending", "all")}
                >
                  {row.pending_count ?? 0}
                </IdxListingLink>
              }
              breakdown={{
                studio: (
                  <IdxListingLink
                    listingIds={getListingIds(
                      drilldownLookup,
                      "pending",
                      "0br"
                    )}
                  >
                    {row.pending_0br ?? 0}
                  </IdxListingLink>
                ),
                oneBed: (
                  <IdxListingLink
                    listingIds={getListingIds(
                      drilldownLookup,
                      "pending",
                      "1br"
                    )}
                  >
                    {row.pending_1br ?? 0}
                  </IdxListingLink>
                ),
                twoBed: (
                  <IdxListingLink
                    listingIds={getListingIds(
                      drilldownLookup,
                      "pending",
                      "2br"
                    )}
                  >
                    {row.pending_2br ?? 0}
                  </IdxListingLink>
                ),
                threeBedPlus: (
                  <IdxListingLink
                    listingIds={getListingIds(
                      drilldownLookup,
                      "pending",
                      "3br_plus"
                    )}
                  >
                    {row.pending_3br_plus ?? 0}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Closed Sales - 12 Mo"
              value={
                <ContactListingLink
                  communityName={communityName}
                  market={selectedMarket}
                  propertyType={selectedPropertyType}
                  metricGroup="sold_12mo"
                  bedroomSegment="all"
                  listingCount={row.sales_12mo ?? 0}
                  zoneName={row.zone_name}
                  areaName={row.area_name}
                >
                  {row.sales_12mo ?? 0}
                </ContactListingLink>
              }
              breakdown={{
                studio: (
                  <ContactListingLink
                    communityName={communityName}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    metricGroup="sold_12mo"
                    bedroomSegment="0br"
                    listingCount={row.sales_0br_12mo ?? 0}
                    >zoneName={row.zone_name}
                    areaName={row.area_name}
                    {row.sales_0br_12mo ?? 0}
                  </ContactListingLink>
                ),
                oneBed: (
                  <ContactListingLink
                    communityName={communityName}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    metricGroup="sold_12mo"
                    bedroomSegment="1br"
                    listingCount={row.sales_1br_12mo ?? 0}
                    zoneName={row.zone_name}
                    areaName={row.area_name}
                  >
                    {row.sales_1br_12mo ?? 0}
                  </ContactListingLink>
                ),
                twoBed: (
                  <ContactListingLink
                    communityName={communityName}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    metricGroup="sold_12mo"
                    bedroomSegment="2br"
                    listingCount={row.sales_2br_12mo ?? 0}
                    zoneName={row.zone_name}
                    areaName={row.area_name}
                  >
                    {row.sales_2br_12mo ?? 0}
                  </ContactListingLink>
                ),
                threeBedPlus: (
                  <ContactListingLink
                    communityName={communityName}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    metricGroup="sold_12mo"
                    bedroomSegment="3br_plus"
                    listingCount={row.sales_3br_plus_12mo ?? 0}
                    zoneName={row.zone_name}
                    areaName={row.area_name}
                  >
                    {row.sales_3br_plus_12mo ?? 0}
                  </ContactListingLink>
                ),
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
                For {formatMarketDescription(selectedMarket)}{" "}
                {formatPropertyTypeDescription(selectedPropertyType)} in {communityName},{" "}
                there are currently <strong>{row.active_count ?? 0}</strong> active listings,{" "}
                <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
                <strong>{row.sales_12mo ?? 0}</strong> closed sales over the past 12 months.
                The median sold price is <strong>{formatMoney(row.median_sold_price)}</strong>,
                with average sold pricing around{" "}
                <strong>{formatMoney(row.avg_sold_price_ft2)}</strong> per square foot.
                Current months of inventory is{" "}
                <strong>{formatNumber(row.months_inventory)}</strong>.
              </p>
            </div>
          </div>
          {contentRows.length > 0 && (
            <div style={{ paddingTop: "12px" }}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  padding: "32px",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
                  border: "1px solid #f1f5f9",
                }}
              >
                {contentRows.map((content) => (
                  <div key={content.title ?? content.body.slice(0, 40)}>
                    <h2 className="text-2xl font-bold">
                      {content.title ?? `About ${communityName}`}
                    </h2>

                    <p className="mt-4 leading-7 text-slate-700">
                      {content.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function CommunitySelectors({
  slug,
  selectedMarket,
  selectedPropertyType,
  selectedZone,
  selectedArea,
}: {
  slug: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedZone?: string;
  selectedArea?: string;
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
          href={communityHref(slug, selectedMarket, "all", selectedZone, selectedArea)}
          style={selectedPropertyType === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref(slug, selectedMarket, "condos", selectedZone, selectedArea)}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={communityHref(slug, selectedMarket, "houses", selectedZone, selectedArea)}
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
          href={communityHref(slug, "all", selectedPropertyType, selectedZone, selectedArea)}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={communityHref(slug, "pre_construction", selectedPropertyType, selectedZone, selectedArea)}
          style={
            selectedMarket === "pre_construction"
              ? selectedStyle
              : unselectedStyle
          }
        >
          Pre-Construction
        </a>

        <a
          href={communityHref(slug, "resale", selectedPropertyType, selectedZone, selectedArea)}
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
  zoneName,
  areaName,
  children,
}: {
  communityName: string;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  metricGroup: MetricGroup;
  bedroomSegment: BedroomSegment;
  listingCount: number;
  zoneName?: string | null;
  areaName?: string | null;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  params.set("community", communityName);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", metricGroup);
  params.set("bedroom", bedroomSegment);
  params.set("count", String(listingCount));
  if (zoneName) params.set("zone", zoneName);
  if (areaName) params.set("area", areaName);

  return (
    <Link
      href={`/contact?${params.toString()}`}
      className="font-semibold text-blue-700 hover:underline"
    >
      {children}
    </Link>
  );
}

function getListingIds(
  drilldownLookup: Map<string, CommunityListingDrilldown>,
  metricGroup: MetricGroup,
  bedroomSegment: BedroomSegment
) {
  return drilldownLookup.get(drilldownKey(metricGroup, bedroomSegment))
    ?.listing_ids;
}

function drilldownKey(metricGroup: MetricGroup, bedroomSegment: BedroomSegment) {
  return `${metricGroup}|${bedroomSegment}`;
}

function areaHref(
  zoneSlug: string,
  areaSlug: string,
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
    ? `/areas/${zoneSlug}/${areaSlug}?${queryString}`
    : `/areas/${zoneSlug}/${areaSlug}`;
}

function communityHref(
  slug: string,
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

  return queryString
    ? `/communities/${slug}?${queryString}`
    : `/communities/${slug}`;
}

function homeHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  zone?: string,
  area?: string
) {
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  if (zone) {
    params.set("zone", zone);
  }

  if (area) {
    params.set("area", area);
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