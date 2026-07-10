import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import ClosedListingFilters from "@/app/components/ClosedListingFilters";
import ClosedSalesMonthlyChart from "@/app/components/ClosedSalesMonthlyChart";

// ***********************************************
// Import dynamic Metadata
// ***********************************************
import { buildMarketSeo } from "@/lib/seo";
// 
// ***********************************************

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type SortKey =
  | "mls"
  | "development_name"
  | "unit"
  | "community_name"
  | "beds"
  | "sold_price"
  | "final_list_price"
  | "sold_to_final_list_pct"
  | "sold_price_per_sqft"
  | "days_on_market"
  | "sold_date";
type SortDir = "asc" | "desc";
type RangeKey = "90d" | "6mo" | "12mo" | "all" | "custom";
type SummaryMode = "median" | "avg";
type AreaUnit = "ft2" | "m2";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

// ******************************************************************
// function generateMetadata
// Generates dynamic metadata with the help of buildMarketSeo in lib
// ******************************************************************
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    market?: string;
    propertyType?: string;
    zone?: string;
    area?: string;
    community?: string;
    development?: string;
    range?: string;
  }>;
}): Promise<Metadata> {
  const params = await searchParams;

  const seo = buildMarketSeo({
    pageType: "closed-sales",
    market: getMarketSegment(params.market),
    propertyType: getPropertyTypeSegment(params.propertyType),
    zone: params.zone,
    area: params.area,
    community: params.community,
    development: params.development,
    range: getRangeKey(params.range),
    canonicalPath: "/market-intelligence/closed-sales",
  });

  return seo;
}

export default async function ClosedSalesPage({
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
    development?: string;
    range?: string;
    startDate?: string;
    endDate?: string;
    priceMode?: string;
    areaMode?: string;
    areaUnit?: string;
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
  const selectedDevelopment = params.development ?? "all";

  const selectedRange = getRangeKey(params.range);
  const selectedPriceMode = getSummaryMode(params.priceMode);
  const selectedAreaMode = getSummaryMode(params.areaMode);
  const selectedAreaUnit = getAreaUnit(params.areaUnit);

  const { startDate: selectedStartDate, endDate: selectedEndDate } =
    resolveDateRange(selectedRange, params.startDate, params.endDate);

  const chartStartDate = getChartStartDate();
  const chartEndDate = formatISODate(new Date());

  let optionQuery = supabase
    .from("closed_listing_list")
    .select("zone_name, area_name, community_name, development_name");

  if (selectedMarket !== "all") {
    optionQuery = optionQuery.eq("market_segment", selectedMarket);
  }

  if (selectedPropertyType !== "all") {
    optionQuery = optionQuery.eq("property_type_segment", selectedPropertyType);
  }

  if (selectedStartDate) {
    optionQuery = optionQuery.gte("sold_date", selectedStartDate);
  }

  if (selectedEndDate) {
    optionQuery = optionQuery.lte("sold_date", selectedEndDate);
  }

  const optionPageSize = 1000;
  let optionRows: any[] = [];
  let optionError: any = null;

  for (let from = 0; from < 50000; from += optionPageSize) {
    const { data: batch, error } = await optionQuery.range(
      from,
      from + optionPageSize - 1
    );

    if (error) {
      optionError = error;
      break;
    }

    optionRows = optionRows.concat(batch ?? []);

    if (!batch || batch.length < optionPageSize) break;
  }

  let query = supabase
    .from("closed_listing_list")
    .select("*", { count: "exact" })
    .order(selectedSort, { ascending: selectedDir === "asc" })
    .limit(10000);

  query = applyFilters(query, {
    selectedMarket,
    selectedPropertyType,
    selectedZone,
    selectedArea,
    selectedCommunity,
    selectedDevelopment,
    selectedStartDate,
    selectedEndDate,
  });

  const { data, error, count } = await query;

  let summaryQueryBase = supabase
    .from("closed_listing_list")
    .select("mls, sold_date, sold_price, sold_price_per_sqft, sold_price_per_sqm, bedroom_segment");

  summaryQueryBase = applyFilters(summaryQueryBase, {
    selectedMarket,
    selectedPropertyType,
    selectedZone,
    selectedArea,
    selectedCommunity,
    selectedDevelopment,
    selectedStartDate,
    selectedEndDate,
  });

  const pageSize = 1000;
  let summaryRows: any[] = [];
  let summaryError: any = null;

  for (let from = 0; from < 10000; from += pageSize) {
    const { data: batch, error } = await summaryQueryBase.range(
      from,
      from + pageSize - 1
    );

    if (error) {
      summaryError = error;
      break;
    }

    summaryRows = summaryRows.concat(batch ?? []);

    if (!batch || batch.length < pageSize) break;
  }

  let chartQueryBase = supabase
    .from("closed_listing_list")
    .select("mls, sold_date");

  chartQueryBase = applyFilters(chartQueryBase, {
    selectedMarket,
    selectedPropertyType,
    selectedZone,
    selectedArea,
    selectedCommunity,
    selectedDevelopment,
    selectedStartDate: chartStartDate,
    selectedEndDate: chartEndDate,
  });

  const { data: chartData, error: chartError } = await chartQueryBase.limit(10000);

  if (error || optionError || summaryError || chartError) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">Error loading closed sales.</p>
        <pre className="mt-4 text-sm">
          {error?.message ??
            optionError?.message ??
            summaryError?.message ??
            chartError?.message}
        </pre>
      </main>
    );
  }

  const listings = data ?? [];
  const summary = summaryRows ?? [];

  const chartRows = chartData ?? [];

  function closedSalesSearchHref(rows: typeof summary) {
    return `/market-intelligence/closed-sales/search-results?mls=${rows
      .map((row) => row.mls)
      .filter(Boolean)
      .join(",")}`;
  }

  const closedSalesHref = closedSalesSearchHref(summary);

  const studioHref = closedSalesSearchHref(
    summary.filter((row) => row.bedroom_segment === "0br")
  );

  const oneBrHref = closedSalesSearchHref(
    summary.filter((row) => row.bedroom_segment === "1br")
  );

  const twoBrHref = closedSalesSearchHref(
    summary.filter((row) => row.bedroom_segment === "2br")
  );

  const threeBrHref = closedSalesSearchHref(
    summary.filter((row) => row.bedroom_segment === "3br_plus")
  );

  const zones = Array.from(
    new Set(optionRows.map((row) => row.zone_name).filter(Boolean))
  ).sort();

  const areas = Array.from(
    new Set(
      optionRows
        .filter((row) => selectedZone === "all" || row.zone_name === selectedZone)
        .map((row) => row.area_name)
        .filter(Boolean)
    )
  ).sort();

  const communities =
    selectedArea === "all"
      ? []
      : Array.from(
          new Set(
            optionRows
              .filter((row) => selectedZone === "all" || row.zone_name === selectedZone)
              .filter((row) => row.area_name === selectedArea)
              .map((row) => row.community_name)
              .filter(Boolean)
          )
        ).sort();

  const developments =
    selectedCommunity === "all"
      ? []
      : Array.from(
          new Set(
            optionRows
              .filter((row) => selectedZone === "all" || row.zone_name === selectedZone)
              .filter((row) => selectedArea === "all" || row.area_name === selectedArea)
              .filter((row) => row.community_name === selectedCommunity)
              .map((row) => row.development_name)
              .filter(Boolean)
          )
        ).sort();

  const totalClosedSales = count ?? listings.length;

  const soldPrices = values(summary, "sold_price");
  const soldPriceFt2 = values(summary, "sold_price_per_sqft");
  const soldPriceM2 = values(summary, "sold_price_per_sqm");

  const totalVolume = soldPrices.reduce((sum, value) => sum + value, 0);

  const medianSoldPrice = median(soldPrices);
  const avgSoldPrice = average(soldPrices);

  const medianSoldPriceFt2 = median(soldPriceFt2);
  const avgSoldPriceFt2 = average(soldPriceFt2);

  const medianSoldPriceM2 = median(soldPriceM2);
  const avgSoldPriceM2 = average(soldPriceM2);

  const displayedSoldPrice =
    selectedPriceMode === "avg" ? avgSoldPrice : medianSoldPrice;

  const displayedAreaPrice =
    selectedAreaUnit === "m2"
      ? selectedAreaMode === "avg"
        ? avgSoldPriceM2
        : medianSoldPriceM2
      : selectedAreaMode === "avg"
        ? avgSoldPriceFt2
        : medianSoldPriceFt2;

  const countByBedroom = bedroomBreakdown(summary, (rows) =>
    rows.length.toLocaleString()
  );

  const volumeByBedroom = bedroomBreakdown(summary, (rows) =>
    formatMoney(
      rows.reduce((sum, row) => sum + Number(row.sold_price ?? 0), 0)
    )
  );

  const priceByBedroom = bedroomBreakdown(summary, (rows) => {
    const bedroomPrices = values(rows, "sold_price");
    return formatMoney(
      selectedPriceMode === "avg" ? average(bedroomPrices) : median(bedroomPrices)
    );
  });

  const areaPriceByBedroom = bedroomBreakdown(summary, (rows) => {
    const bedroomAreaPrices = values(
      rows,
      selectedAreaUnit === "m2" ? "sold_price_per_sqm" : "sold_price_per_sqft"
    );

    return formatMoney(
      selectedAreaMode === "avg"
        ? average(bedroomAreaPrices)
        : median(bedroomAreaPrices)
    );
  });

  function tableSortHref(sortKey: SortKey) {
  const nextDir: SortDir =
    selectedSort === sortKey && selectedDir === "desc" ? "asc" : "desc";

  const queryParams = new URLSearchParams();

  if (selectedMarket !== "all") queryParams.set("market", selectedMarket);
  if (selectedPropertyType !== "all") queryParams.set("propertyType", selectedPropertyType);
  if (sortKey !== "sold_date") queryParams.set("sort", sortKey);
  if (!(sortKey === "sold_date" && nextDir === "desc")) queryParams.set("dir", nextDir);
  if (selectedZone !== DEFAULT_ZONE_NAME) queryParams.set("zone", selectedZone);
  if (selectedArea !== "all") queryParams.set("area", selectedArea);
  if (selectedCommunity !== "all") queryParams.set("community", selectedCommunity);
  if (selectedDevelopment !== "all") queryParams.set("development", selectedDevelopment);
  if (selectedRange !== "12mo") queryParams.set("range", selectedRange);

  if (selectedRange === "custom") {
    if (selectedStartDate) queryParams.set("startDate", selectedStartDate);
    if (selectedEndDate) queryParams.set("endDate", selectedEndDate);
  }

  if (selectedPriceMode !== "median") queryParams.set("priceMode", selectedPriceMode);
  if (selectedAreaMode !== "median") queryParams.set("areaMode", selectedAreaMode);
  if (selectedAreaUnit !== "ft2") queryParams.set("areaUnit", selectedAreaUnit);

  const queryString = queryParams.toString();

  return queryString
    ? `/market-intelligence/closed-sales?${queryString}#closed-sales`
    : "/market-intelligence/closed-sales#closed-sales";
}

  function summaryHref(
    priceMode: SummaryMode,
    areaMode: SummaryMode,
    areaUnit: AreaUnit
  ) {
    const queryParams = new URLSearchParams();

    if (selectedMarket !== "all") queryParams.set("market", selectedMarket);
    if (selectedPropertyType !== "all") queryParams.set("propertyType", selectedPropertyType);
    if (selectedSort !== "sold_date") queryParams.set("sort", selectedSort);
    if (!(selectedSort === "sold_date" && selectedDir === "desc")) queryParams.set("dir", selectedDir);
    if (selectedZone !== DEFAULT_ZONE_NAME) queryParams.set("zone", selectedZone);
    if (selectedArea !== "all") queryParams.set("area", selectedArea);
    if (selectedCommunity !== "all") queryParams.set("community", selectedCommunity);
    if (selectedDevelopment !== "all") queryParams.set("development", selectedDevelopment);
    if (selectedRange !== "12mo") queryParams.set("range", selectedRange);

    if (selectedRange === "custom") {
      if (selectedStartDate) queryParams.set("startDate", selectedStartDate);
      if (selectedEndDate) queryParams.set("endDate", selectedEndDate);
    }

    if (priceMode !== "median") queryParams.set("priceMode", priceMode);
    if (areaMode !== "median") queryParams.set("areaMode", areaMode);
    if (areaUnit !== "ft2") queryParams.set("areaUnit", areaUnit);

    const queryString = queryParams.toString();

    return queryString
      ? `/market-intelligence/closed-sales?${queryString}#closed-sales-summary`
      : "/market-intelligence/closed-sales#closed-sales-summary";
      }

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
            Closed sales reports with sold price, final list price, days on
            market, sold-to-list ratio, price per ft², and SearchPV market
            context.
          </p>

          <ClosedListingFilters
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
            selectedZone={selectedZone}
            selectedArea={selectedArea}
            selectedCommunity={selectedCommunity}
            selectedDevelopment={selectedDevelopment}
            selectedRange={selectedRange}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
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
            <Link href="/" className="underline hover:text-sky-200">
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
              href="/market-intelligence/closed-sales"
              className="underline hover:text-sky-200"
            >
              Closed Sales
            </Link>
          </div>

          <div className="mt-1 text-xs font-semibold leading-snug text-slate-200">
            {formatSelectedFilters(
              selectedMarket,
              selectedPropertyType,
              selectedZone,
              selectedArea,
              selectedCommunity,
              selectedDevelopment,
              selectedStartDate,
              selectedEndDate
            )}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">
          <ClosedSalesMonthlyChart
            rows={chartRows}
            selectedRange={selectedRange}
            variant="compact"
          />
        </div>

        <div
          id="closed-sales-summary"
          className="scroll-mt-6 mt-6 rounded-xl bg-white p-6 shadow"
        >
          <p className="text-sm font-semibold text-slate-500">
            Showing Sales From
          </p>

          <p className="mt-1 text-lg font-bold">
            {formatDateLong(selectedStartDate) || "All Time"} through{" "}
            {formatDateLong(selectedEndDate) || "Today"}
          </p>
        </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SummaryCard
            label="Closed Sales"
            value={totalClosedSales.toLocaleString()}
            valueHref={closedSalesHref}
            byBedroom={[
              {
                label: "Studio",
                value: countByBedroom[0].value,
                href: studioHref,
              },
              {
                label: "1BR",
                value: countByBedroom[1].value,
                href: oneBrHref,
              },
              {
                label: "2BR",
                value: countByBedroom[2].value,
                href: twoBrHref,
              },
              {
                label: "3BR+",
                value: countByBedroom[3].value,
                href: threeBrHref,
              },
            ]}
          />

          <SummaryCard
            label="Closed Volume"
            value={formatMoney(totalVolume)}
            byBedroom={volumeByBedroom}
          />

          <SummaryCard
            label={`${selectedPriceMode === "avg" ? "Avg" : "Median"} Sold Price`}
            value={formatMoney(displayedSoldPrice)}
            controls={
              <ToggleLinks
                options={[
                  {
                    label: "Med",
                    href: summaryHref("median", selectedAreaMode, selectedAreaUnit),
                    selected: selectedPriceMode === "median",
                  },
                  {
                    label: "Avg",
                    href: summaryHref("avg", selectedAreaMode, selectedAreaUnit),
                    selected: selectedPriceMode === "avg",
                  },
                ]}
              />
            }
            byBedroom={priceByBedroom}
          />

          <SummaryCard
            label={`${selectedAreaMode === "avg" ? "Avg" : "Median"} $/${
              selectedAreaUnit === "m2" ? "m²" : "ft²"
            }`}
            value={formatMoney(displayedAreaPrice)}
            controls={
              <div className="flex items-center gap-2">
                <ToggleLinks
                  options={[
                    {
                      label: "Med",
                      href: summaryHref(selectedPriceMode, "median", selectedAreaUnit),
                      selected: selectedAreaMode === "median",
                    },
                    {
                      label: "Avg",
                      href: summaryHref(selectedPriceMode, "avg", selectedAreaUnit),
                      selected: selectedAreaMode === "avg",
                    },
                  ]}
                />

                <ToggleLinks
                  options={[
                    {
                      label: "ft²",
                      href: summaryHref(selectedPriceMode, selectedAreaMode, "ft2"),
                      selected: selectedAreaUnit === "ft2",
                    },
                    {
                      label: "m²",
                      href: summaryHref(selectedPriceMode, selectedAreaMode, "m2"),
                      selected: selectedAreaUnit === "m2",
                    },
                  ]}
                />
              </div>
            }
            byBedroom={areaPriceByBedroom}
          />
        </div>

        <h1 id="closed-sales" className="scroll-mt-6 mt-8 text-2xl font-bold">
          Closed Sales
        </h1>

        <p className="text-sm text-slate-500">
          Showing up to 500 results. Use filters or closed sale date range to
          narrow the list.
        </p>

        <div className="mt-3 max-h-[70vh] overflow-auto rounded-xl bg-white shadow">
          <table className="min-w-[1050px] border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <SortableTh label="MLS" sortKey="mls" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("mls")} stickyLeft />
                <SortableTh label="Property" sortKey="development_name" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("development_name")} />
                <SortableTh label="Unit" sortKey="unit" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("unit")} />
                <SortableTh label="Community" sortKey="community_name" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("community_name")} />
                <SortableTh label="Beds" sortKey="beds" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("beds")} />
                <SortableTh label="Sold Price" sortKey="sold_price" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("sold_price")} />
                <SortableTh label="Final List" sortKey="final_list_price" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("final_list_price")} />
                <SortableTh label="Sold/List" sortKey="sold_to_final_list_pct" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("sold_to_final_list_pct")} />
                <SortableTh label="$/ft²" sortKey="sold_price_per_sqft" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("sold_price_per_sqft")} />
                <SortableTh label="DOM" sortKey="days_on_market" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("days_on_market")} />
                <SortableTh label="Sold Date" sortKey="sold_date" selectedSort={selectedSort} selectedDir={selectedDir} href={tableSortHref("sold_date")} />
              </tr>
            </thead>

            <tbody>
              {listings.map((listing) => (
                <tr key={listing.mls} className="border-t">
                  <Td stickyLeft>
                    <Link
                      href={`/market-intelligence/closed-sales/${listing.mls}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {listing.mls}
                    </Link>
                  </Td>
                  <Td>{listing.development_name || listing.address || "-"}</Td>
                  <Td>{listing.unit || "-"}</Td>
                  <Td>{listing.community_name || "-"}</Td>
                  <Td>{formatNumber(listing.beds)}</Td>
                  <Td>{formatMoney(listing.sold_price)}</Td>
                  <Td>{formatMoney(listing.final_list_price)}</Td>
                  <Td>{formatPercent(listing.sold_to_final_list_pct)}</Td>
                  <Td>{formatMoney(listing.sold_price_per_sqft)}</Td>
                  <Td>{formatNumber(listing.days_on_market)}</Td>
                  <Td>{formatDate(listing.sold_date)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
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
      {controls && <div className="mb-3">{controls}</div>}

      <p className="text-sm text-slate-500">{label}</p>

      {valueHref ? (
        <Link
          href={valueHref}
          className="mt-3 block text-4xl font-bold text-blue-700 hover:underline"
        >
          {value}
        </Link>
      ) : (
        <p className="mt-3 text-4xl font-bold text-slate-950">
          {value}
        </p>
      )}

      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          By Bedroom
        </p>

        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-700">
          {byBedroom.map((item, index) => (
            <span key={item.label}>
              {index > 0 && <span className="mr-2 text-slate-300">|</span>}
              {item.label}{" "}
              {item.href ? (
                <Link
                  href={item.href}
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
  options: { label: string; href: string; selected: boolean }[];
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

function applyFilters(query: any, filters: any) {
  let nextQuery = query;

  if (filters.selectedMarket !== "all") nextQuery = nextQuery.eq("market_segment", filters.selectedMarket);
  if (filters.selectedPropertyType !== "all") nextQuery = nextQuery.eq("property_type_segment", filters.selectedPropertyType);
  if (filters.selectedZone !== "all") nextQuery = nextQuery.eq("zone_name", filters.selectedZone);
  if (filters.selectedArea !== "all") nextQuery = nextQuery.eq("area_name", filters.selectedArea);
  if (filters.selectedCommunity !== "all") nextQuery = nextQuery.eq("community_name", filters.selectedCommunity);
  if (filters.selectedDevelopment !== "all") nextQuery = nextQuery.eq("development_name", filters.selectedDevelopment);
  if (filters.selectedStartDate) nextQuery = nextQuery.gte("sold_date", filters.selectedStartDate);
  if (filters.selectedEndDate) nextQuery = nextQuery.lte("sold_date", filters.selectedEndDate);

  return nextQuery;
}

function bedroomBreakdown(
  rows: any[],
  calculate: (rows: any[]) => string
) {
  const groups = [
    { key: "0br", label: "Studio" },
    { key: "1br", label: "1BR" },
    { key: "2br", label: "2BR" },
    { key: "3br_plus", label: "3BR+" },
  ];

  return groups.map((group) => ({
    label: group.label,
    value: calculate(rows.filter((row) => row.bedroom_segment === group.key)),
  }));
}

function values(rows: any[], field: string) {
  return rows
    .map((row) => Number(row[field] ?? 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);

  if (values.length % 2 === 0) {
    return Math.round((values[middle - 1] + values[middle]) / 2);
  }

  return Math.round(values[middle]);
}

function resolveDateRange(range: RangeKey, startDate?: string, endDate?: string) {
  const today = new Date();
  const end = formatISODate(today);

  if (range === "custom") {
    return { startDate: startDate ?? "", endDate: endDate ?? "" };
  }

  if (range === "all") {
    return { startDate: "", endDate: "" };
  }

  const monthCount =
    range === "90d" ? 3 : range === "6mo" ? 6 : 12;

  const start = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1), 1);

  return {
    startDate: formatISODate(start),
    endDate: end,
  };
}

function getChartStartDate() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 12, 1);

  return formatISODate(start);
}

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRangeKey(value?: string): RangeKey {
  if (value === "90d") return "90d";
  if (value === "6mo") return "6mo";
  if (value === "all") return "all";
  if (value === "custom") return "custom";
  return "12mo";
}

function getSummaryMode(value?: string): SummaryMode {
  return value === "avg" ? "avg" : "median";
}

function getAreaUnit(value?: string): AreaUnit {
  return value === "m2" ? "m2" : "ft2";
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
    "mls",
    "development_name",
    "unit",
    "community_name",
    "beds",
    "sold_price",
    "final_list_price",
    "sold_to_final_list_pct",
    "sold_price_per_sqft",
    "days_on_market",
    "sold_date",
  ];

  return allowed.includes(value as SortKey) ? (value as SortKey) : "sold_date";
}

function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
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
  const isSelected = selectedSort === sortKey;
  const arrow = isSelected ? (selectedDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      className={`sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold ${
        stickyLeft ? "left-0 z-40 shadow-[2px_0_0_#e2e8f0]" : ""
      }`}
    >
      <Link href={href} className="hover:underline">
        {label}
        {arrow}
      </Link>
    </th>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
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
      className={`whitespace-nowrap px-4 py-3 ${
        stickyLeft
          ? "sticky left-0 z-20 bg-white shadow-[2px_0_0_#e2e8f0]"
          : "bg-white"
      }`}
    >
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

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSelectedFilters(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  zone: string,
  area: string,
  community: string,
  development: string,
  startDate: string,
  endDate: string
) {
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

  if (zone) parts.push(zone);
  if (area !== "all") parts.push(area);
  if (community !== "all") parts.push(community);
  if (development !== "all") parts.push(development);

  if (startDate || endDate) {
    parts.push(
      `${formatDateShort(startDate) || "All Time"} – ${
        formatDateShort(endDate) || "Today"
      }`
    );
  }

  return parts.join(" • ");
}

function formatDateShort(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}