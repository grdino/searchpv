import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import AreaPriceMetricCard from "@/app/components/market-listings/AreaPriceMetricCard";
import MarketListingFilters from "@/app/components/market-listings/MarketListingFilters";
import MarketListingHistoryChart from "@/app/components/market-listings/MarketListingHistoryChart";

import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Active Listings | SearchPV Market Intelligence",
  description:
    "Explore active Puerto Vallarta real estate listings, inventory value, list prices, price per square foot, and days on market.",
};

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type BedroomSegment = "all" | "0br" | "1br" | "2br" | "3br_plus";

type SortKey =
  | "mls"
  | "development_name"
  | "unit_id"
  | "community_name"
  | "beds"
  | "current_price"
  | "price_per_sqft"
  | "dom";

type SortDir = "asc" | "desc";
type SummaryMode = "median" | "avg";
type AreaUnit = "ft2" | "m2";

type ActiveListing = {
  snapshot_date: string | null;
  market_segment: string | null;
  bedroom_segment: string | null;

  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;

  prprty_type: string | null;
  market_type: string | null;

  mls: string | number | null;
  address: string | null;
  development: string | null;
  unit_id: string | null;

  beds: number | null;
  baths: number | null;
  sqft: number | null;
  sqm: number | null;

  original_price: number | null;
  current_price: number | null;

  price_changes: number | null;
  price_change_amount: number | null;
  price_change_percent: number | null;

  price_per_sqft: number | null;
  price_per_sqm: number | null;
  dom: number | null;
};

type HistoryRow = {
  snapshot_date: string;
  active_listing_count: number | null;
  inventory_value: number | null;
  median_list_price: number | null;
  median_price_per_sqft: number | null;
  median_price_per_sqm: number | null;
  median_dom: number | null;
};

type SearchParams = {
  market?: string;
  propertyType?: string;
  bedrooms?: string;

  sort?: string;
  dir?: string;

  zone?: string;
  area?: string;
  community?: string;
  development?: string;

  priceMode?: string;
  areaMode?: string;
  areaUnit?: string;
};

const DEFAULT_ZONE_NAME = "Puerto Vallarta";
const BASE_PATH = "/market-intelligence/active-listings";
const MAX_LISTING_ROWS = 500;

export default async function ActiveListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(params.propertyType);
  const selectedBedrooms = getBedroomSegment(params.bedrooms);

  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  const selectedZone = params.zone ?? DEFAULT_ZONE_NAME;
  const selectedArea = params.area ?? "all";
  const selectedCommunity = params.community ?? "all";
  const selectedDevelopment = params.development ?? "all";

  const selectedPriceMode = getSummaryMode(params.priceMode);
  const selectedAreaMode = getSummaryMode(params.areaMode);
  const selectedAreaUnit = getAreaUnit(params.areaUnit);

  /*
   * Load the geography choices using the broad category filters.
   * The selected geographic levels are applied below in memory so that each
   * dropdown can contain only valid children of its selected parent.
   */
  let optionQuery = supabase
    .from("active_listing")
    .select(
      `
        zone_name,
        area_name,
        community_name,
        development_name,
        prprty_type,
        market_segment,
        bedroom_segment
      `
    );

  optionQuery = applyCategoryFilters(optionQuery, {
    selectedMarket,
    selectedPropertyType,
    selectedBedrooms,
  });

  const optionResult = await loadAllRows(optionQuery, 50000);

  /*
   * Load all rows needed for summary calculations.
   *
   * This is separate from the visible table because the table is limited to
   * 500 rows while summary values must represent the entire filtered result.
   */
  let summaryQuery = supabase
    .from("active_listing")
    .select(
      `
        mls,
        current_price,
        price_per_sqft,
        price_per_sqm,
        dom,
        bedroom_segment
      `
    );

  summaryQuery = applyListingFilters(summaryQuery, {
    selectedMarket,
    selectedPropertyType,
    selectedBedrooms,
    selectedZone,
    selectedArea,
    selectedCommunity,
    selectedDevelopment,
  });

  const summaryResult = await loadAllRows(summaryQuery, 50000);

  /*
   * Load the visible detail rows.
   */
  let listingQuery = supabase
    .from("active_listing")
    .select(
      `
        snapshot_date,
        market_segment,
        bedroom_segment,
        zone_name,
        area_name,
        community_name,
        development_name,
        prprty_type,
        market_type,
        mls,
        address,
        development,
        unit_id,
        beds,
        baths,
        sqft,
        sqm,
        original_price,
        current_price,
        price_changes,
        price_change_amount,
        price_change_percent,
        price_per_sqft,
        price_per_sqm,
        dom
      `,
      { count: "exact" }
    );

  listingQuery = applyListingFilters(listingQuery, {
    selectedMarket,
    selectedPropertyType,
    selectedBedrooms,
    selectedZone,
    selectedArea,
    selectedCommunity,
    selectedDevelopment,
  });

  const listingResult = await listingQuery
    .order(selectedSort, {
      ascending: selectedDir === "asc",
      nullsFirst: false,
    })
    .limit(MAX_LISTING_ROWS);

  /*
   * Historical summary comes from the public SQL function rather than direct
   * access to historical inventory rows.
   */
  const historyResult = await supabase.rpc(
    "active_listing_history_summary",
    {
      p_market_segment:
        selectedMarket === "all" ? null : selectedMarket,

      p_property_type:
        selectedPropertyType === "all"
          ? null
          : selectedPropertyType,

      p_bedroom_segment:
        selectedBedrooms === "all"
          ? null
          : selectedBedrooms,

      p_zone_name:
        selectedZone === "all"
          ? null
          : selectedZone,

      p_area_name:
        selectedArea === "all"
          ? null
          : selectedArea,

      p_community_name:
        selectedCommunity === "all"
          ? null
          : selectedCommunity,

      p_development_name:
        selectedDevelopment === "all"
          ? null
          : selectedDevelopment,
    }
  );

  const firstError =
    optionResult.error ??
    summaryResult.error ??
    listingResult.error ??
    historyResult.error;

  if (firstError) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
        <h1 className="text-3xl font-bold">SearchPV</h1>

        <p className="mt-4 font-semibold text-red-700">
          Error loading active listings.
        </p>

        <pre className="mt-4 overflow-auto rounded-lg bg-white p-4 text-sm shadow">
          {firstError.message}
        </pre>
      </main>
    );
  }

  const optionRows = optionResult.rows;
  const summaryRows = summaryResult.rows;
  const listings = (listingResult.data ?? []) as ActiveListing[];
  const historyRows = (historyResult.data ?? []) as HistoryRow[];

  const zones = uniqueValues(optionRows, "zone_name");

  const areas = uniqueValues(
    optionRows.filter(
      (row) =>
        selectedZone === "all" ||
        row.zone_name === selectedZone
    ),
    "area_name"
  );

  const communities =
    selectedArea === "all"
      ? []
      : uniqueValues(
          optionRows
            .filter(
              (row) =>
                selectedZone === "all" ||
                row.zone_name === selectedZone
            )
            .filter(
              (row) => row.area_name === selectedArea
            ),
          "community_name"
        );

  const developments =
    selectedCommunity === "all"
      ? []
      : uniqueValues(
          optionRows
            .filter(
              (row) =>
                selectedZone === "all" ||
                row.zone_name === selectedZone
            )
            .filter(
              (row) =>
                selectedArea === "all" ||
                row.area_name === selectedArea
            )
            .filter(
              (row) =>
                row.community_name === selectedCommunity
            ),
          "development_name"
        );

  const activeListingCount =
    listingResult.count ?? summaryRows.length;

  const listPrices = numericValues(summaryRows, "current_price");
  const pricesPerSqft = numericValues(summaryRows, "price_per_sqft");
  const pricesPerSqm = numericValues(summaryRows, "price_per_sqm");
  const daysOnMarket = numericValues(summaryRows, "dom", true);

  const inventoryValue = listPrices.reduce(
    (total, value) => total + value,
    0
  );

  const displayedListPrice =
    selectedPriceMode === "avg"
      ? average(listPrices)
      : median(listPrices);

  const displayedAreaPrice =
    selectedAreaUnit === "m2"
      ? selectedAreaMode === "avg"
        ? average(pricesPerSqm)
        : median(pricesPerSqm)
      : selectedAreaMode === "avg"
        ? average(pricesPerSqft)
        : median(pricesPerSqft);

  const displayedDom = median(daysOnMarket);

  const countByBedroom = bedroomBreakdown(
    summaryRows,
    (rows) => rows.length.toLocaleString("en-US")
  );

  const volumeByBedroom = bedroomBreakdown(
    summaryRows,
    (rows) =>
      formatMoney(
        numericValues(rows, "current_price").reduce(
          (total, value) => total + value,
          0
        )
      )
  );

  const priceByBedroom = bedroomBreakdown(
    summaryRows,
    (rows) => {
      const values = numericValues(rows, "current_price");

      return formatMoney(
        selectedPriceMode === "avg"
          ? average(values)
          : median(values)
      );
    }
  );

  const areaPriceByBedroom = bedroomBreakdown(
    summaryRows,
    (rows) => {
      const field =
        selectedAreaUnit === "m2"
          ? "price_per_sqm"
          : "price_per_sqft";

      const values = numericValues(rows, field);

      return formatMoney(
        selectedAreaMode === "avg"
          ? average(values)
          : median(values)
      );
    }
  );

  const domByBedroom = bedroomBreakdown(
    summaryRows,
    (rows) =>
      formatNumber(
        median(numericValues(rows, "dom", true))
      )
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Header />

            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Explore current active inventory, asking prices, price per
            square foot, days on market, and historical listing trends
            throughout Puerto Vallarta and Banderas Bay.
          </p>

          <MarketListingFilters
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedBedrooms={selectedBedrooms}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
            selectedZone={selectedZone}
            selectedArea={selectedArea}
            selectedCommunity={selectedCommunity}
            selectedDevelopment={selectedDevelopment}
            zones={zones}
            areas={areas}
            communities={communities}
            developments={developments}
          />
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-700 px-4 py-3">
        <div className="mx-auto max-w-6xl text-center text-sm font-bold text-white">
          <div className="truncate">
            <Link
              href="/"
              className="underline hover:text-sky-200"
            >
              SearchPV
            </Link>

            {" > "}

            <Link
              href="/market-intelligence"
              className="underline hover:text-sky-200"
            >
              Market Intelligence
            </Link>

            {" > "}

            <Link
              href={BASE_PATH}
              className="underline hover:text-sky-200"
            >
              Active Listings
            </Link>
          </div>

          <div className="mt-1 text-xs font-semibold leading-snug text-slate-200">
            {formatSelectedFilters({
              market: selectedMarket,
              propertyType: selectedPropertyType,
              bedrooms: selectedBedrooms,
              zone: selectedZone,
              area: selectedArea,
              community: selectedCommunity,
              development: selectedDevelopment,
            })}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-4xl">
          <MarketListingHistoryChart rows={historyRows} />
        </div>

        <div
          id="active-listing-summary"
          className="scroll-mt-24 mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <SummaryCard
            label="Active Listings"
            value={activeListingCount.toLocaleString("en-US")}
            valueHref={activeListingsResultsHref("all")}
            byBedroom={countByBedroom.map((item) => ({
              ...item,
              href: activeListingsResultsHref(
                bedroomSegmentFromLabel(item.label)
              ),
            }))}
          />

          <SummaryCard
            label="Inventory Value"
            value={formatMoney(inventoryValue)}
            byBedroom={volumeByBedroom}
          />

          <SummaryCard
            label={`${
              selectedPriceMode === "avg"
                ? "Average"
                : "Median"
            } List Price`}
            value={formatMoney(displayedListPrice)}
            controls={
              <ToggleLinks
                options={[
                  {
                    label: "Med",
                    href: summaryHref({
                      priceMode: "median",
                      areaMode: selectedAreaMode,
                      areaUnit: selectedAreaUnit,
                    }),
                    selected:
                      selectedPriceMode === "median",
                  },
                  {
                    label: "Avg",
                    href: summaryHref({
                      priceMode: "avg",
                      areaMode: selectedAreaMode,
                      areaUnit: selectedAreaUnit,
                    }),
                    selected:
                      selectedPriceMode === "avg",
                  },
                ]}
              />
            }
            byBedroom={priceByBedroom}
          />

          <AreaPriceMetricCard
            value={displayedAreaPrice}
            selectedMode={selectedAreaMode}
            selectedUnit={selectedAreaUnit}
            medianHref={summaryHref({
              priceMode: selectedPriceMode,
              areaMode: "median",
              areaUnit: selectedAreaUnit,
            })}
            averageHref={summaryHref({
              priceMode: selectedPriceMode,
              areaMode: "avg",
              areaUnit: selectedAreaUnit,
            })}
            squareFeetHref={summaryHref({
              priceMode: selectedPriceMode,
              areaMode: selectedAreaMode,
              areaUnit: "ft2",
            })}
            squareMetersHref={summaryHref({
              priceMode: selectedPriceMode,
              areaMode: selectedAreaMode,
              areaUnit: "m2",
            })}
            byBedroom={areaPriceByBedroom}
          />

          <SummaryCard
            label="Median Days on Market"
            value={formatNumber(displayedDom)}
            byBedroom={domByBedroom}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              id="active-listings"
              className="scroll-mt-24 text-2xl font-bold"
            >
              Active Listings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Showing up to {MAX_LISTING_ROWS.toLocaleString("en-US")}{" "}
              listings from{" "}
              {activeListingCount.toLocaleString("en-US")} matching
              results.
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

        <div className="mt-3 max-h-[70vh] overflow-auto rounded-xl bg-white shadow">
          <table className="min-w-[1250px] border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <SortableTh
                  label="MLS"
                  sortKey="mls"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("mls")}
                  stickyLeft
                />

                <SortableTh
                  label="Property"
                  sortKey="development_name"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("development_name")}
                />

                <SortableTh
                  label="Unit"
                  sortKey="unit_id"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("unit_id")}
                />

                <SortableTh
                  label="Community"
                  sortKey="community_name"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("community_name")}
                />

                <SortableTh
                  label="Beds"
                  sortKey="beds"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("beds")}
                />

                <Th>Baths</Th>
                <Th>Sq Ft</Th>

                <SortableTh
                  label="List Price"
                  sortKey="current_price"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("current_price")}
                />

                <SortableTh
                  label="$/ft²"
                  sortKey="price_per_sqft"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("price_per_sqft")}
                />

                <SortableTh
                  label="DOM"
                  sortKey="dom"
                  selectedSort={selectedSort}
                  selectedDir={selectedDir}
                  href={tableSortHref("dom")}
                />

                <Th>Price Changes</Th>
                <Th>Change</Th>
              </tr>
            </thead>

            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="bg-white px-4 py-10 text-center text-slate-500"
                  >
                    No active listings match the selected filters.
                  </td>
                </tr>
              ) : (
                listings.map((listing, index) => (
                  <tr
                    key={`${listing.mls ?? "listing"}-${index}`}
                  >
                    <Td stickyLeft>
                      {listing.mls ? (
                        <a
                          href={buildIdxUrl(String(listing.mls))}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {listing.mls}
                        </a>
                      ) : (
                        "-"
                      )}
                    </Td>

                    <Td>
                      {listing.development_name ||
                        listing.development ||
                        listing.address ||
                        "-"}
                    </Td>

                    <Td>{listing.unit_id || "-"}</Td>
                    <Td>{listing.community_name || "-"}</Td>
                    <Td>{formatNumber(listing.beds)}</Td>
                    <Td>{formatNumber(listing.baths)}</Td>
                    <Td>{formatNumber(listing.sqft)}</Td>
                    <Td>{formatMoney(listing.current_price)}</Td>
                    <Td>{formatMoney(listing.price_per_sqft)}</Td>
                    <Td>{formatNumber(listing.dom)}</Td>
                    <Td>{formatNumber(listing.price_changes)}</Td>
                    <Td>
                      {formatSignedPercent(
                        listing.price_change_percent
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );

  function tableSortHref(sortKey: SortKey) {
    const nextDirection: SortDir =
      selectedSort === sortKey && selectedDir === "desc"
        ? "asc"
        : "desc";

    return buildPageHref(
      {
        sort: sortKey,
        dir: nextDirection,
      },
      "active-listings"
    );
  }

  function summaryHref({
    priceMode,
    areaMode,
    areaUnit,
  }: {
    priceMode: SummaryMode;
    areaMode: SummaryMode;
    areaUnit: AreaUnit;
  }) {
    return buildPageHref(
      {
        priceMode,
        areaMode,
        areaUnit,
      },
      "active-listing-summary"
    );
  }

  function activeListingsResultsHref(
    bedroomSegment: BedroomSegment
  ) {
    const queryParams = new URLSearchParams();

    if (selectedMarket !== "all") {
      queryParams.set("market", selectedMarket);
    }

    if (selectedPropertyType !== "all") {
      queryParams.set(
        "propertyType",
        selectedPropertyType
      );
    }

    const effectiveBedrooms =
      bedroomSegment === "all"
        ? selectedBedrooms
        : bedroomSegment;

    if (effectiveBedrooms !== "all") {
      queryParams.set(
        "bedrooms",
        effectiveBedrooms
      );
    }

    if (selectedZone !== DEFAULT_ZONE_NAME) {
      queryParams.set("zone", selectedZone);
    }

    if (selectedArea !== "all") {
      queryParams.set("area", selectedArea);
    }

    if (selectedCommunity !== "all") {
      queryParams.set(
        "community",
        selectedCommunity
      );
    }

    if (selectedDevelopment !== "all") {
      queryParams.set(
        "development",
        selectedDevelopment
      );
    }

    const queryString = queryParams.toString();
    const basePath =
      "/market-intelligence/active-listings/search-results";

    return queryString
      ? `${basePath}?${queryString}`
      : basePath;
  }

  function buildPageHref(
    updates: Partial<{
      priceMode: SummaryMode;
      areaMode: SummaryMode;
      areaUnit: AreaUnit;
      sort: SortKey;
      dir: SortDir;
    }>,
    anchor?: string
  ) {
    const values = {
      priceMode: selectedPriceMode,
      areaMode: selectedAreaMode,
      areaUnit: selectedAreaUnit,
      sort: selectedSort,
      dir: selectedDir,
      ...updates,
    };

    const queryParams = new URLSearchParams();

    if (selectedMarket !== "all") {
      queryParams.set("market", selectedMarket);
    }

    if (selectedPropertyType !== "all") {
      queryParams.set(
        "propertyType",
        selectedPropertyType
      );
    }

    if (selectedBedrooms !== "all") {
      queryParams.set("bedrooms", selectedBedrooms);
    }

    if (values.sort !== "current_price") {
      queryParams.set("sort", values.sort);
    }

    if (
      !(
        values.sort === "current_price" &&
        values.dir === "desc"
      )
    ) {
      queryParams.set("dir", values.dir);
    }

    if (selectedZone !== DEFAULT_ZONE_NAME) {
      queryParams.set("zone", selectedZone);
    }

    if (selectedArea !== "all") {
      queryParams.set("area", selectedArea);
    }

    if (selectedCommunity !== "all") {
      queryParams.set(
        "community",
        selectedCommunity
      );
    }

    if (selectedDevelopment !== "all") {
      queryParams.set(
        "development",
        selectedDevelopment
      );
    }

    if (values.priceMode !== "median") {
      queryParams.set("priceMode", values.priceMode);
    }

    if (values.areaMode !== "median") {
      queryParams.set("areaMode", values.areaMode);
    }

    if (values.areaUnit !== "ft2") {
      queryParams.set("areaUnit", values.areaUnit);
    }

    const queryString = queryParams.toString();
    const href = queryString
      ? `${BASE_PATH}?${queryString}`
      : BASE_PATH;

    return anchor ? `${href}#${anchor}` : href;
  }
}

function applyCategoryFilters(
  query: any,
  filters: {
    selectedMarket: MarketSegment;
    selectedPropertyType: PropertyTypeSegment;
    selectedBedrooms: BedroomSegment;
  }
) {
  let nextQuery = query;

  if (filters.selectedMarket !== "all") {
    nextQuery = nextQuery.eq(
      "market_segment",
      filters.selectedMarket
    );
  }

  if (filters.selectedPropertyType !== "all") {
    nextQuery = nextQuery.eq(
      "prprty_type",
      propertyTypeDatabaseValue(
        filters.selectedPropertyType
      )
    );
  }

  if (filters.selectedBedrooms !== "all") {
    nextQuery = nextQuery.eq(
      "bedroom_segment",
      filters.selectedBedrooms
    );
  }

  return nextQuery;
}

function applyListingFilters(
  query: any,
  filters: {
    selectedMarket: MarketSegment;
    selectedPropertyType: PropertyTypeSegment;
    selectedBedrooms: BedroomSegment;
    selectedZone: string;
    selectedArea: string;
    selectedCommunity: string;
    selectedDevelopment: string;
  }
) {
  let nextQuery = applyCategoryFilters(query, filters);

  if (filters.selectedZone !== "all") {
    nextQuery = nextQuery.eq(
      "zone_name",
      filters.selectedZone
    );
  }

  if (filters.selectedArea !== "all") {
    nextQuery = nextQuery.eq(
      "area_name",
      filters.selectedArea
    );
  }

  if (filters.selectedCommunity !== "all") {
    nextQuery = nextQuery.eq(
      "community_name",
      filters.selectedCommunity
    );
  }

  if (filters.selectedDevelopment !== "all") {
    nextQuery = nextQuery.eq(
      "development_name",
      filters.selectedDevelopment
    );
  }

  return nextQuery;
}

async function loadAllRows(
  query: any,
  maximumRows: number
): Promise<{
  rows: any[];
  error: { message: string } | null;
}> {
  const pageSize = 1000;
  const rows: any[] = [];

  for (
    let from = 0;
    from < maximumRows;
    from += pageSize
  ) {
    const { data, error } = await query.range(
      from,
      Math.min(
        from + pageSize - 1,
        maximumRows - 1
      )
    );

    if (error) {
      return {
        rows,
        error,
      };
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return {
    rows,
    error: null,
  };
}

function propertyTypeDatabaseValue(
  value: PropertyTypeSegment
) {
  if (value === "condos") return "Condos";
  if (value === "houses") return "Houses";

  return "";
}

function uniqueValues(
  rows: any[],
  field: string
): string[] {
  return Array.from(
    new Set(
      rows
        .map((row) => row[field])
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
    )
  ).sort((a, b) => a.localeCompare(b));
}

function numericValues(
  rows: any[],
  field: string,
  allowZero = false
) {
  return rows
    .map((row) => Number(row[field]))
    .filter(
      (value) =>
        Number.isFinite(value) &&
        (allowZero ? value >= 0 : value > 0)
    )
    .sort((a, b) => a - b);
}

function average(values: number[]) {
  if (values.length === 0) return null;

  return (
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

function median(values: number[]) {
  if (values.length === 0) return null;

  const middle = Math.floor(values.length / 2);

  if (values.length % 2 === 0) {
    return (
      values[middle - 1] + values[middle]
    ) / 2;
  }

  return values[middle];
}

function bedroomBreakdown(
  rows: any[],
  calculate: (rows: any[]) => string
) {
  const groups = [
    {
      key: "0br",
      label: "Studio",
    },
    {
      key: "1br",
      label: "1BR",
    },
    {
      key: "2br",
      label: "2BR",
    },
    {
      key: "3br_plus",
      label: "3BR+",
    },
  ];

  return groups.map((group) => ({
    label: group.label,
    value: calculate(
      rows.filter(
        (row) =>
          row.bedroom_segment === group.key
      )
    ),
  }));
}

function SummaryCard({
  label,
  value,
  valueHref,
  controls,
  byBedroom,
}: {
  label: string;
  value: string;
  valueHref?: string;
  controls?: React.ReactNode;
  byBedroom: {
    label: string;
    value: string;
    href?: string;
  }[];
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      {controls && (
        <div className="mb-3">{controls}</div>
      )}

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold text-slate-950">
        {valueHref ? (
          <Link
            href={valueHref}
            rel="nofollow"
            className="text-blue-700 hover:underline"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </p>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          By Bedroom
        </p>

        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-700">
          {byBedroom.map((item, index) => (
            <span key={item.label}>
              {index > 0 && (
                <span className="mr-2 text-slate-300">
                  |
                </span>
              )}

              {item.label}{" "}

              {item.href ? (
                <Link
                  href={item.href}
                  rel="nofollow"
                  className="font-bold text-blue-700 hover:underline"
                >
                  {item.value}
                </Link>
              ) : (
                <span className="font-bold text-slate-950">
                  {item.value}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleLinks({
  options,
}: {
  options: {
    label: string;
    href: string;
    selected: boolean;
  }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-300 text-[10px] font-bold">
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          className={`px-2 py-1 ${
            option.selected
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
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
  const selected = selectedSort === sortKey;
  const arrow = selected
    ? selectedDir === "asc"
      ? " ▲"
      : " ▼"
    : "";

  return (
    <th
      className={`sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold ${
        stickyLeft
          ? "left-0 z-40 shadow-[2px_0_0_#e2e8f0]"
          : ""
      }`}
    >
      <Link
        href={href}
        className="hover:underline"
      >
        {label}
        {arrow}
      </Link>
    </th>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({
  children,
  stickyLeft = false,
}: {
  children: React.ReactNode;
  stickyLeft?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-t border-slate-100 px-4 py-3 ${
        stickyLeft
          ? "sticky left-0 z-10 bg-white shadow-[2px_0_0_#e2e8f0]"
          : "bg-white"
      }`}
    >
      {children}
    </td>
  );
}

function getMarketSegment(
  value?: string
): MarketSegment {
  if (value === "pre_construction") {
    return "pre_construction";
  }

  if (value === "resale") {
    return "resale";
  }

  return "all";
}

function getPropertyTypeSegment(
  value?: string
): PropertyTypeSegment {
  if (value === "condos") return "condos";
  if (value === "houses") return "houses";

  return "all";
}

function getBedroomSegment(
  value?: string
): BedroomSegment {
  if (value === "0br") return "0br";
  if (value === "1br") return "1br";
  if (value === "2br") return "2br";
  if (value === "3br_plus") {
    return "3br_plus";
  }

  return "all";
}

function getSortKey(value?: string): SortKey {
  const allowed: SortKey[] = [
    "mls",
    "development_name",
    "unit_id",
    "community_name",
    "beds",
    "current_price",
    "price_per_sqft",
    "dom",
  ];

  return allowed.includes(value as SortKey)
    ? (value as SortKey)
    : "current_price";
}

function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function getSummaryMode(
  value?: string
): SummaryMode {
  return value === "avg" ? "avg" : "median";
}

function getAreaUnit(value?: string): AreaUnit {
  return value === "m2" ? "m2" : "ft2";
}

function formatMoney(value: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

function formatSignedPercent(
  value: number | null
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "-";
  }

  const number = Number(value);

  if (number > 0) {
    return `+${number.toFixed(1)}%`;
  }

  return `${number.toFixed(1)}%`;
}

function formatSelectedFilters({
  market,
  propertyType,
  bedrooms,
  zone,
  area,
  community,
  development,
}: {
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  bedrooms: BedroomSegment;
  zone: string;
  area: string;
  community: string;
  development: string;
}) {
  const parts: string[] = [];

  parts.push(
    market === "all"
      ? "All Markets"
      : market === "pre_construction"
        ? "Pre-Construction"
        : "Resale"
  );

  parts.push(
    propertyType === "all"
      ? "All Property Types"
      : propertyType === "condos"
        ? "Condos"
        : "Houses"
  );

  parts.push(
    bedrooms === "all"
      ? "All Bedrooms"
      : bedrooms === "0br"
        ? "Studios"
        : bedrooms === "1br"
          ? "1 Bedroom"
          : bedrooms === "2br"
            ? "2 Bedrooms"
            : "3+ Bedrooms"
  );

  if (zone === "all") {
    parts.push("All Zones");
  } else {
    parts.push(zone);
  }

  if (area !== "all") parts.push(area);
  if (community !== "all") parts.push(community);
  if (development !== "all") {
    parts.push(development);
  }

  return parts.join(" • ");
}

function bedroomSegmentFromLabel(
  label: string
): BedroomSegment {
  if (label === "Studio") return "0br";
  if (label === "1BR") return "1br";
  if (label === "2BR") return "2br";
  if (label === "3BR+") return "3br_plus";

  return "all";
}