import Link from "next/link";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { buildIdxUrl } from "@/lib/idx";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import ToggleMetricCard from "@/app/components/ToggleMetricCard";
import MetricCard from "@/app/components/MetricCard";
import NearbySection from "@/app/components/NearbySection"

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type MetricGroup = "active" | "pending" | "sold_12mo";
type BedroomSegment = "all" | "0br" | "1br" | "2br" | "3br_plus";

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

  avg_sold_price: number | null;
  avg_sold_price_0br: number | null;
  avg_sold_price_1br: number | null;
  avg_sold_price_2br: number | null;
  avg_sold_price_3br_plus: number | null;

  avg_sold_price_ft2: number | null;
  avg_sold_price_ft2_0br: number | null;
  avg_sold_price_ft2_1br: number | null;
  avg_sold_price_ft2_2br: number | null;
  avg_sold_price_ft2_3br_plus: number | null;

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

  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;
  months_inventory_0br: number | null;
  months_inventory_1br: number | null;
  months_inventory_2br: number | null;
  months_inventory_3br_plus: number | null;
};

type DevelopmentListingDrilldown = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
  market_segment: MarketSegment;
  property_type_segment: PropertyTypeSegment;
  metric_group: MetricGroup;
  bedroom_segment: BedroomSegment;
  listing_count: number;
  listing_ids: string | null;
};

type DevelopmentProfile = {
  profile_title: string | null;
  description: string | null;
  overview: string | null;
  building_facts: string | null;
  location_description: string | null;
  lifestyle: string | null;
  searchpv_insights: string | null;
  buyer_notes: string | null;
  investor_notes: string | null;

  official_name: string | null;
  address: string | null;
  neighborhood_label: string | null;
  property_type: string | null;
  developer: string | null;
  website: string | null;

  completion_status: string | null;
  completion_year: number | null;
  year_built: number | null;
  num_buildings: number | null;
  num_units: number | null;
  residences: number | null;
  floors: number | null;
  stories: number | null;
  construction_type: string | null;
  architect: string | null;

  pet_policy: string | null;
  rental_policy: string | null;
  parking: string | null;
  views: string | null;
  beach_access: string | null;
  walkability_notes: string | null;

  has_pool: boolean | null;
  has_gym: boolean | null;
  has_security: boolean | null;
  has_elevator: boolean | null;
  has_parking: boolean | null;
  has_rooftop: boolean | null;
  has_jacuzzi: boolean | null;
  has_bbq: boolean | null;
  has_concierge: boolean | null;
  has_coworking: boolean | null;
  has_steam_room: boolean | null;
  has_sauna: boolean | null;
  has_spa: boolean | null;
  has_storage: boolean | null;
  has_lockoff_units: boolean | null;
  has_lobby: boolean | null;
  has_restaurant_retail: boolean | null;

  nearby_summary: string | null;
  nearby_restaurants_count: number | null;
  nearby_bars_count: number | null;
  nearby_galleries_count: number | null;
  nearby_cafes_count: number | null;
  nearby_beach_minutes: number | null;
  nearby_grocery_minutes: number | null;
  nearby_notes: string | null;

  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  notes: string | null;
};

export default async function DevelopmentPage({
  params,
  searchParams,
}: {
  params: Promise<{
    marketSlug: string;
    areaSlug: string;
    communitySlug: string;
    developmentSlug: string;
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
    .from("development_snapshot")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("development_slug", routeParams.developmentSlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType)
    .maybeSingle();

  const { data: profileData, error: profileError } = await supabase
    .from("development_profile")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("development_slug", routeParams.developmentSlug)
    .maybeSingle();

  const { data: drilldownRows, error: drilldownError } = await supabase
    .from("development_listing_drilldown")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("development_slug", routeParams.developmentSlug)
    .eq("market_segment", selectedMarket)
    .eq("property_type_segment", selectedPropertyType);



  const { data: nearbyRollupData, error: nearbyRollupError } = await supabase
    .from("development_nearby_rollup")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("development_slug", routeParams.developmentSlug)
    .maybeSingle();

  const { data: nearbyPlacesData, error: nearbyPlacesError } = await supabase
    .from("development_nearby")
    .select("*")
    .eq("zone_slug", routeParams.marketSlug)
    .eq("area_slug", routeParams.areaSlug)
    .eq("community_slug", routeParams.communitySlug)
    .eq("development_slug", routeParams.developmentSlug)
    .eq("is_highlight", true)
    .order("display_order", { ascending: true })
    .limit(8);

  if (
        error ||
        drilldownError ||
        profileError ||
        nearbyRollupError ||
        nearbyPlacesError
      ) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">Error loading development data.</p>
        <pre className="mt-4 text-sm">
          {error?.message ?? drilldownError?.message ?? profileError?.message}
        </pre>
      </main>
    );
  }

  const row = data as DevelopmentSnapshot | null;
  const profile = profileData as DevelopmentProfile | null;

  const drilldownRowsTyped =
    (drilldownRows ?? []) as DevelopmentListingDrilldown[];

  function getListingIds(
    metricGroup: MetricGroup,
    bedroomSegment: BedroomSegment
  ) {
    return (
      drilldownRowsTyped.find(
        (r) =>
          r.metric_group === metricGroup &&
          r.bedroom_segment === bedroomSegment
      )?.listing_ids ?? null
    );
  }

  const developmentName =
    row?.development_name ?? formatSlugTitle(routeParams.developmentSlug);

  const communityName =
    row?.community_name ?? formatSlugTitle(routeParams.communitySlug);

  const areaName = row?.area_name ?? formatSlugTitle(routeParams.areaSlug);
  const zoneName = row?.zone_name ?? formatSlugTitle(routeParams.marketSlug);

  const snapshotDate = row?.snapshot_date
    ? formatDate(row.snapshot_date)
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
              {developmentName}
            </h1>

            <p
              style={{
                marginTop: "12px",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              {zoneName} &gt; {areaName} &gt; {communityName}
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

            <DevelopmentSelectors
              marketSlug={routeParams.marketSlug}
              areaSlug={routeParams.areaSlug}
              communitySlug={routeParams.communitySlug}
              developmentSlug={routeParams.developmentSlug}
              selectedMarket={selectedMarket}
              selectedPropertyType={selectedPropertyType}
            />
          </div>
        </div>
      </section>

      {row && (
        <StickyBreadcrumb
          zoneName={zoneName}
          areaName={areaName}
          communityName={communityName}
          developmentName={developmentName}
          marketSlug={routeParams.marketSlug}
          areaSlug={routeParams.areaSlug}
          communitySlug={routeParams.communitySlug}
          selectedMarket={selectedMarket}
          selectedPropertyType={selectedPropertyType}
        />
      )}

      {!row ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="rounded-xl bg-white p-8 shadow">
            <h2 className="text-xl font-bold">No data available</h2>
            <p className="mt-2 text-slate-600">
              There are no {developmentName} records for this combination of
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
                  <IdxListingLink
                    listingIds={getListingIds("active", "3br_plus")}
                  >
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
                  <IdxListingLink
                    listingIds={getListingIds("pending", "3br_plus")}
                  >
                    {row.pending_3br_plus ?? 0}
                  </IdxListingLink>
                ),
              }}
            />

            <MetricCard
              label="Closed Sales - 12 Mo"
              value={
                <ContactLink
                  row={row}
                  market={selectedMarket}
                  propertyType={selectedPropertyType}
                  listingCount={row.sales_12mo ?? 0}
                  bedroomSegment="all"
                >
                  {row.sales_12mo ?? 0}
                </ContactLink>
              }
              breakdown={{
                studio: (
                  <ContactLink
                    row={row}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={row.sales_0br_12mo ?? 0}
                    bedroomSegment="0br"
                  >
                    {row.sales_0br_12mo ?? 0}
                  </ContactLink>
                ),
                oneBed: (
                  <ContactLink
                    row={row}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={row.sales_1br_12mo ?? 0}
                    bedroomSegment="1br"
                  >
                    {row.sales_1br_12mo ?? 0}
                  </ContactLink>
                ),
                twoBed: (
                  <ContactLink
                    row={row}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={row.sales_2br_12mo ?? 0}
                    bedroomSegment="2br"
                  >
                    {row.sales_2br_12mo ?? 0}
                  </ContactLink>
                ),
                threeBedPlus: (
                  <ContactLink
                    row={row}
                    market={selectedMarket}
                    propertyType={selectedPropertyType}
                    listingCount={row.sales_3br_plus_12mo ?? 0}
                    bedroomSegment="3br_plus"
                  >
                    {row.sales_3br_plus_12mo ?? 0}
                  </ContactLink>
                ),
              }}
            />

            <ToggleMetricCard
              label="Sold Price"
              optionA={{
                key: "median",
                label: "Median",
                format: "money",
                value: row.median_sold_price ?? null,
                breakdown: {
                  studio: row.median_sold_price_0br ?? null,
                  oneBed: row.median_sold_price_1br ?? null,
                  twoBed: row.median_sold_price_2br ?? null,
                  threeBedPlus: row.median_sold_price_3br_plus ?? null,
                },
              }}
              optionB={{
                key: "average",
                label: "Average",
                format: "money",
                value: row.avg_sold_price ?? null,
                breakdown: {
                  studio: row.avg_sold_price_0br ?? null,
                  oneBed: row.avg_sold_price_1br ?? null,
                  twoBed: row.avg_sold_price_2br ?? null,
                  threeBedPlus: row.avg_sold_price_3br_plus ?? null,
                },
              }}
            />

            <ToggleMetricCard
              label="Price / Measure"
              optionA={{
                key: "ft2",
                label: "$/Ft²",
                format: "priceMeasure",
                value: row.avg_sold_price_ft2 ?? null,
                breakdown: {
                  studio: row.avg_sold_price_ft2_0br ?? null,
                  oneBed: row.avg_sold_price_ft2_1br ?? null,
                  twoBed: row.avg_sold_price_ft2_2br ?? null,
                  threeBedPlus: row.avg_sold_price_ft2_3br_plus ?? null,
                },
              }}
              optionB={{
                key: "m2",
                label: "$/M²",
                format: "priceMeasure",
                value: row.avg_sold_price_m2 ?? null,
                breakdown: {
                  studio: row.avg_sold_price_m2_0br ?? null,
                  oneBed: row.avg_sold_price_m2_1br ?? null,
                  twoBed: row.avg_sold_price_m2_2br ?? null,
                  threeBedPlus: row.avg_sold_price_m2_3br_plus ?? null,
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

          <MarketSummarySection
            developmentName={developmentName}
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            row={row}
          />

          <SearchPVMarketInsightSection
            developmentName={developmentName}
            activeCount={row.active_count ?? 0}
            pendingCount={row.pending_count ?? 0}
            sales12mo={row.sales_12mo ?? 0}
            monthsInventory={row.months_inventory ?? null}
            medianSoldPrice={row.median_sold_price ?? null}
            avgSoldPriceFt2={row.avg_sold_price_ft2 ?? null}
            soldAvgDom={row.sold_avg_dom_12mo ?? null}
            manualInsight={profile?.searchpv_insights}
          />

          <DevelopmentProfileSection
            developmentName={developmentName}
            communityName={communityName}
            areaName={areaName}
            profile={profile}
          />

          <NearbySection
            developmentName={developmentName}
            rollup={nearbyRollupData}
            places={nearbyPlacesData ?? []}
          />
        </section>
      )}
    </main>
  );
}

function StickyBreadcrumb({
  zoneName,
  areaName,
  communityName,
  developmentName,
  marketSlug,
  areaSlug,
  communitySlug,
  selectedMarket,
  selectedPropertyType,
}: {
  zoneName: string;
  areaName: string;
  communityName: string;
  developmentName: string;
  marketSlug: string;
  areaSlug: string;
  communitySlug: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
}) {
  return (
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
        <Link href="/" style={{ color: "#ffffff", textDecoration: "underline" }}>
          {zoneName}
        </Link>
        {" > "}
        <Link
          href={areaHref(
            marketSlug,
            areaSlug,
            selectedMarket,
            selectedPropertyType
          )}
          style={{ color: "#ffffff", textDecoration: "underline" }}
        >
          {areaName}
        </Link>
        {" > "}
        <Link
          href={communityHref(
            marketSlug,
            areaSlug,
            communitySlug,
            selectedMarket,
            selectedPropertyType
          )}
          style={{ color: "#ffffff", textDecoration: "underline" }}
        >
          {communityName}
        </Link>
        {" > "}
        <span>{developmentName}</span>

        <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
          {formatSelectedFilters(selectedMarket, selectedPropertyType)}
        </div>
      </div>
    </div>
  );
}

function MarketSummarySection({
  developmentName,
  selectedMarket,
  selectedPropertyType,
  row,
}: {
  developmentName: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  row: DevelopmentSnapshot;
}) {
  return (
    <div style={{ paddingTop: "48px" }}>
      <section
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
          <strong>{developmentName}</strong>, there are currently{" "}
          <strong>{row.active_count ?? 0}</strong> active listings,{" "}
          <strong>{row.pending_count ?? 0}</strong> pending listings, and{" "}
          <strong>{row.sales_12mo ?? 0}</strong> closed sales over the past 12
          months. The median sold price is{" "}
          <strong>{formatMoney(row.median_sold_price)}</strong>, with average
          sold pricing around{" "}
          <strong>{formatMoney(row.avg_sold_price_ft2)}</strong> per square
          foot. Current months of inventory is{" "}
          <strong>{formatNumber(row.months_inventory)}</strong>.
        </p>
      </section>
    </div>
  );
}

function SearchPVMarketInsightSection({
  developmentName,
  activeCount,
  pendingCount,
  sales12mo,
  monthsInventory,
  medianSoldPrice,
  avgSoldPriceFt2,
  soldAvgDom,
  manualInsight,
}: {
  developmentName: string;
  activeCount: number;
  pendingCount: number;
  sales12mo: number;
  monthsInventory: number | null;
  medianSoldPrice: number | null;
  avgSoldPriceFt2: number | null;
  soldAvgDom: number | null;
  manualInsight?: string | null;
}) {
  const insight =
    cleanText(manualInsight) ??
    buildDynamicSearchPVInsights({
      developmentName,
      activeCount,
      pendingCount,
      sales12mo,
      monthsInventory,
      medianSoldPrice,
      avgSoldPriceFt2,
      soldAvgDom,
    });

  return (
    <div style={{ paddingTop: "48px" }}>
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          SearchPV Market Insight
        </div>

        <h2 className="mt-2 text-2xl font-bold">Current Market Read</h2>

        <p className="mt-4 leading-7 text-slate-700">{insight}</p>
      </section>
    </div>
  );
}

function DevelopmentProfileSection({
  developmentName,
  communityName,
  areaName,
  profile,
}: {
  developmentName: string;
  communityName: string;
  areaName: string;
  profile: DevelopmentProfile | null;
}) {
  const overview = cleanText(profile?.overview ?? profile?.description);
  const buildingFacts = cleanText(profile?.building_facts);
  const locationDescription = cleanText(profile?.location_description);
  const lifestyle = cleanText(profile?.lifestyle);
  const buyerNotes = cleanText(profile?.buyer_notes);
  const investorNotes = cleanText(profile?.investor_notes);

  const hasAnyProfileContent =
    overview ||
    buildingFacts ||
    locationDescription ||
    lifestyle ||
    buyerNotes ||
    investorNotes ||
    hasBuildingFactData(profile) ||
    hasConfirmedAmenityData(profile);

  return (
    <div style={{ paddingTop: "48px" }}>
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">About {developmentName}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Development profile and building context
            </p>
          </div>

          {!hasAnyProfileContent && (
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Profile pending
            </span>
          )}
        </div>

        {!hasAnyProfileContent && (
          <p className="mt-5 leading-7 text-slate-700">
            This development profile has not yet been completed. The live
            SearchPV market statistics and Market Insight above are available
            now; building history, amenities, policies, lifestyle notes, and
            buyer guidance will be added as this profile is researched.
          </p>
        )}

        {overview && <ProfileTextSection title="Overview" text={overview} />}

        <BuildingFactsTable
          developmentName={developmentName}
          communityName={communityName}
          areaName={areaName}
          profile={profile}
        />

        {buildingFacts && (
          <ProfileTextSection title="Building Facts" text={buildingFacts} />
        )}

        {hasConfirmedAmenityData(profile) && <AmenitiesSection profile={profile} />}

        {locationDescription && (
          <ProfileTextSection title="Location" text={locationDescription} />
        )}

        {lifestyle && (
          <ProfileTextSection title="Lifestyle" text={lifestyle} />
        )}

        {buyerNotes && (
          <ProfileTextSection title="Buyer Notes" text={buyerNotes} />
        )}

        {investorNotes && (
          <ProfileTextSection title="Investor Notes" text={investorNotes} />
        )}

        {profile?.website && (
          <section className="mt-10 border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-lg font-bold">Website</h3>

            <a
              href={profile.website}
              className="font-semibold text-blue-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit official website
            </a>
          </section>
        )}
      </section>
    </div>
  );
}

function BuildingFactsTable({
  developmentName,
  communityName,
  areaName,
  profile,
}: {
  developmentName: string;
  communityName: string;
  areaName: string;
  profile: DevelopmentProfile | null;
}) {
  const facts = [
    ["Development", profile?.official_name ?? developmentName],
    ["Community", communityName],
    ["Area", areaName],
    ["Address", profile?.address],
    ["Neighborhood", profile?.neighborhood_label],
    ["Property Type", profile?.property_type],
    ["Completion Status", profile?.completion_status],
    ["Completion Year", profile?.completion_year ?? profile?.year_built],
    ["Residences / Units", profile?.residences ?? profile?.num_units],
    ["Buildings", profile?.num_buildings],
    ["Floors / Stories", profile?.floors ?? profile?.stories],
    ["Developer", profile?.developer],
    ["Architect", profile?.architect],
    ["Construction", profile?.construction_type],
    ["Views", profile?.views],
    ["Beach Access", profile?.beach_access],
    ["Parking", profile?.parking],
    ["Pet Policy", profile?.pet_policy],
    ["Rental Policy", profile?.rental_policy],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  if (facts.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h3 className="text-lg font-bold">Building Facts</h3>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <tbody>
            {facts.map(([label, value]) => (
              <tr key={String(label)} className="border-t first:border-t-0">
                <td className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-600">
                  {label}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AmenitiesSection({ profile }: { profile: DevelopmentProfile | null }) {
  const amenities = [
    ["Pool", profile?.has_pool],
    ["Rooftop", profile?.has_rooftop],
    ["Gym", profile?.has_gym],
    ["Security", profile?.has_security],
    ["Elevator", profile?.has_elevator],
    ["Parking", profile?.has_parking],
    ["Jacuzzi", profile?.has_jacuzzi],
    ["BBQ", profile?.has_bbq],
    ["Concierge", profile?.has_concierge],
    ["Coworking", profile?.has_coworking],
    ["Steam Room", profile?.has_steam_room],
    ["Sauna", profile?.has_sauna],
    ["Spa", profile?.has_spa],
    ["Storage", profile?.has_storage],
    ["Lock-Off Units", profile?.has_lockoff_units],
    ["Lobby", profile?.has_lobby],
    ["Retail / Dining", profile?.has_restaurant_retail],
  ].filter(([, active]) => active === true) as [string, boolean][];

  if (amenities.length === 0) return null;

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <h3 className="mb-4 text-lg font-bold">Amenities</h3>

      <div className="flex flex-wrap gap-2">
        {amenities.map(([label]) => (
          <span
            key={label}
            className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white"
          >
            ✓ {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProfileTextSection({ title, text }: { title: string; text: string }) {
  const cleaned = cleanText(text);
  if (!cleaned) return null;

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <p className="whitespace-pre-line leading-7 text-slate-700">
        {cleaned}
      </p>
    </section>
  );
}

function NearbyStat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function DevelopmentSelectors({
  marketSlug,
  areaSlug,
  communitySlug,
  developmentSlug,
  selectedMarket,
  selectedPropertyType,
}: {
  marketSlug: string;
  areaSlug: string;
  communitySlug: string;
  developmentSlug: string;
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
}) {
  const baseStyle = {
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
  } as const;

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
    maxWidth: "360px",
  } as const;

  const selectedStyle = {
    ...baseStyle,
    backgroundColor: "#ffffff",
    color: "#020617",
    borderColor: "#ffffff",
  };

  const unselectedStyle = {
    ...baseStyle,
    backgroundColor: "transparent",
    color: "#ffffff",
  };

  return (
    <div style={{ marginTop: "18px" }}>
      <div style={rowStyle}>
        <a
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
            selectedMarket,
            "all"
          )}
          style={
            selectedPropertyType === "all" ? selectedStyle : unselectedStyle
          }
        >
          All
        </a>

        <a
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
            selectedMarket,
            "condos"
          )}
          style={
            selectedPropertyType === "condos" ? selectedStyle : unselectedStyle
          }
        >
          Condos
        </a>

        <a
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
            selectedMarket,
            "houses"
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
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
            "all",
            selectedPropertyType
          )}
          style={selectedMarket === "all" ? selectedStyle : unselectedStyle}
        >
          All
        </a>

        <a
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
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
          href={developmentHref(
            marketSlug,
            areaSlug,
            communitySlug,
            developmentSlug,
            "resale",
            selectedPropertyType
          )}
          style={selectedMarket === "resale" ? selectedStyle : unselectedStyle}
        >
          Resale
        </a>
      </div>
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

function ContactLink({
  row,
  market,
  propertyType,
  listingCount,
  bedroomSegment,
  children,
}: {
  row: DevelopmentSnapshot;
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  listingCount: number;
  bedroomSegment: BedroomSegment;
  children: ReactNode;
}) {
  const params = new URLSearchParams();

  params.set("zone", row.zone_name ?? "");
  params.set("area", row.area_name ?? "");
  params.set("community", row.community_name ?? "");
  params.set("development", row.development_name);
  params.set("market", market);
  params.set("propertyType", propertyType);
  params.set("metric", "sold_12mo");
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

function buildDynamicSearchPVInsights({
  developmentName,
  activeCount,
  pendingCount,
  sales12mo,
  monthsInventory,
  medianSoldPrice,
  avgSoldPriceFt2,
  soldAvgDom,
}: {
  developmentName: string;
  activeCount: number;
  pendingCount: number;
  sales12mo: number;
  monthsInventory: number | null;
  medianSoldPrice: number | null;
  avgSoldPriceFt2: number | null;
  soldAvgDom: number | null;
}) {
  const sentences: string[] = [];

  sentences.push(
    `Based on the latest SearchPV MLS snapshot, ${developmentName} currently has ${activeCount.toLocaleString()} active ${
      activeCount === 1 ? "listing" : "listings"
    }, ${pendingCount.toLocaleString()} pending ${
      pendingCount === 1 ? "listing" : "listings"
    }, and ${sales12mo.toLocaleString()} closed ${
      sales12mo === 1 ? "sale" : "sales"
    } over the past 12 months.`
  );

  if (monthsInventory === null || sales12mo === 0) {
    sentences.push(
      "There is not enough recent closed-sales activity to calculate a meaningful months-of-inventory figure."
    );
  } else if (sales12mo < 5) {
    sentences.push(
      `The current months-of-inventory figure is ${formatNumber(monthsInventory)}, but it should be interpreted with caution because it is based on fewer than five closed sales over the past 12 months.`
    );
  } else if (monthsInventory < 3) {
    sentences.push(
      `With approximately ${formatNumber(monthsInventory)} months of inventory, available supply is limited relative to the recent sales pace.`
    );
  } else if (monthsInventory <= 6) {
    sentences.push(
      `With approximately ${formatNumber(monthsInventory)} months of inventory, supply appears relatively balanced against the recent sales pace.`
    );
  } else if (monthsInventory <= 12) {
    sentences.push(
      `With approximately ${formatNumber(monthsInventory)} months of inventory, buyers may have more selection than in tighter inventory conditions.`
    );
  } else {
    sentences.push(
      `With approximately ${formatNumber(monthsInventory)} months of inventory, current supply is elevated compared with the recent sales pace. This figure should be interpreted in context, especially when recent sales volume is limited.`
    );
  }

  const pricingParts: string[] = [];

  if (medianSoldPrice) {
    pricingParts.push(`a median sold price of ${formatMoney(medianSoldPrice)}`);
  }

  if (avgSoldPriceFt2) {
    pricingParts.push(
      `average sold pricing near ${formatMoney(avgSoldPriceFt2)} per square foot`
    );
  }

  if (soldAvgDom) {
    pricingParts.push(
      `an average marketing period of about ${formatNumber(soldAvgDom)} days for homes sold during the past 12 months`
    );
  }

  if (pricingParts.length > 0) {
    sentences.push(`Recent sales show ${pricingParts.join(", ")}.`);
  }

  return sentences.join(" ");
}

function hasBuildingFactData(profile: DevelopmentProfile | null) {
  if (!profile) return false;

  return [
    profile.official_name,
    profile.address,
    profile.neighborhood_label,
    profile.property_type,
    profile.completion_status,
    profile.completion_year,
    profile.year_built,
    profile.residences,
    profile.num_units,
    profile.num_buildings,
    profile.floors,
    profile.stories,
    profile.developer,
    profile.architect,
    profile.construction_type,
    profile.views,
    profile.beach_access,
    profile.parking,
    profile.pet_policy,
    profile.rental_policy,
  ].some((value) => value !== null && value !== undefined && value !== "");
}

function hasConfirmedAmenityData(profile: DevelopmentProfile | null) {
  if (!profile) return false;

  return [
    profile.has_pool,
    profile.has_gym,
    profile.has_security,
    profile.has_elevator,
    profile.has_parking,
    profile.has_rooftop,
    profile.has_jacuzzi,
    profile.has_bbq,
    profile.has_concierge,
    profile.has_coworking,
    profile.has_steam_room,
    profile.has_sauna,
    profile.has_spa,
    profile.has_storage,
    profile.has_lockoff_units,
    profile.has_lobby,
    profile.has_restaurant_retail,
  ].some((value) => value === true);
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
  const queryString = buildQueryString(market, propertyType);
  const path = `/markets/${marketSlug}/areas/${areaSlug}/communities/${communitySlug}`;

  return queryString ? `${path}?${queryString}` : path;
}

function areaHref(
  marketSlug: string,
  areaSlug: string,
  market: MarketSegment,
  propertyType: PropertyTypeSegment
) {
  const queryString = buildQueryString(market, propertyType);
  const path = `/markets/${marketSlug}/areas/${areaSlug}`;

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

function cleanText(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed.toLowerCase() === "null") return null;

  return trimmed;
}