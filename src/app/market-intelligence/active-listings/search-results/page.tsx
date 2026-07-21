import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/Header";
import { buildIdxUrl } from "@/lib/idx";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Active Listings Search Results | SearchPV",
  robots: {
    index: false,
    follow: true,
  },
};

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type BedroomSegment = "all" | "0br" | "1br" | "2br" | "3br_plus";
type SortDir = "asc" | "desc";

type SortKey =
  | "mls"
  | "development_name"
  | "unit_id"
  | "community_name"
  | "beds"
  | "baths"
  | "sqft"
  | "current_price"
  | "price_per_sqft"
  | "dom";

type SearchParams = {
  market?: string;
  propertyType?: string;
  bedrooms?: string;

  zone?: string;
  area?: string;
  community?: string;
  development?: string;

  sort?: string;
  dir?: string;
};

type ActiveListingRow = {
  mls: string | number | null;

  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;

  address: string | null;
  unit_id: string | null;

  prprty_type: string | null;
  market_type: string | null;
  market_segment: string | null;
  bedroom_segment: string | null;

  beds: number | null;
  baths: number | null;
  sqft: number | null;
  sqm: number | null;

  original_price: number | null;
  current_price: number | null;
  price_per_sqft: number | null;
  price_per_sqm: number | null;

  price_changes: number | null;
  price_change_amount: number | null;
  price_change_percent: number | null;

  dom: number | null;
};

const sortableColumns = {
  mls: "MLS",
  development_name: "Development",
  unit_id: "Unit",
  community_name: "Community",
  beds: "Beds",
  baths: "Baths",
  sqft: "Ft²",
  current_price: "List Price",
  price_per_sqft: "$/Ft²",
  dom: "DOM",
} as const;

const DEFAULT_ZONE_NAME = "Puerto Vallarta";
const BASE_PATH =
  "/market-intelligence/active-listings/search-results";

export default async function ActiveListingsSearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(
    params.propertyType
  );
  const selectedBedrooms = getBedroomSegment(params.bedrooms);

  const selectedZone = params.zone ?? DEFAULT_ZONE_NAME;
  const selectedArea = params.area ?? "all";
  const selectedCommunity = params.community ?? "all";
  const selectedDevelopment = params.development ?? "all";

  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  let query = supabase.from("active_listing").select(`
    mls,
    zone_name,
    area_name,
    community_name,
    development_name,
    address,
    unit_id,
    prprty_type,
    market_type,
    market_segment,
    bedroom_segment,
    beds,
    baths,
    sqft,
    sqm,
    original_price,
    current_price,
    price_per_sqft,
    price_per_sqm,
    price_changes,
    price_change_amount,
    price_change_percent,
    dom
  `);

  if (selectedMarket !== "all") {
    query = query.eq("market_segment", selectedMarket);
  }

  if (selectedPropertyType !== "all") {
    query = query.eq(
      "prprty_type",
      propertyTypeDatabaseValue(selectedPropertyType)
    );
  }

  if (selectedBedrooms !== "all") {
    query = query.eq("bedroom_segment", selectedBedrooms);
  }

  if (selectedZone !== "all") {
    query = query.eq("zone_name", selectedZone);
  }

  if (selectedArea !== "all") {
    query = query.eq("area_name", selectedArea);
  }

  if (selectedCommunity !== "all") {
    query = query.eq("community_name", selectedCommunity);
  }

  if (selectedDevelopment !== "all") {
    query = query.eq("development_name", selectedDevelopment);
  }

  const { data, error } = await query
    .order(selectedSort, {
      ascending: selectedDir === "asc",
      nullsFirst: false,
    })
    .limit(10000);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ActiveListingRow[];

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Header />

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Market Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Active Listings Search Results
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Current active MLS listings matching the selected market,
              property, bedroom and geographic filters.
            </p>

            <p className="mt-3 text-sm font-semibold text-slate-200">
              {formatSelectedFilters({
                market: selectedMarket,
                propertyType: selectedPropertyType,
                bedrooms: selectedBedrooms,
                zone: selectedZone,
                area: selectedArea,
                community: selectedCommunity,
                development: selectedDevelopment,
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow">
          <div>
            <p className="text-sm text-slate-500">Showing</p>

            <p className="text-2xl font-bold text-slate-950">
              {rows.length.toLocaleString("en-US")} active listing
              {rows.length === 1 ? "" : "s"}
            </p>
          </div>

          <Link
            href={buildReturnHref({
              market: selectedMarket,
              propertyType: selectedPropertyType,
              bedrooms: selectedBedrooms,
              zone: selectedZone,
              area: selectedArea,
              community: selectedCommunity,
              development: selectedDevelopment,
            })}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Active Listings
          </Link>
        </div>

        <p className="mb-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-[1250px] border-collapse text-sm">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                <tr>
                  {Object.entries(sortableColumns).map(
                    ([key, label]) => (
                      <SortableTh
                        key={key}
                        label={label}
                        sortKey={key as SortKey}
                        currentSort={selectedSort}
                        currentDir={selectedDir}
                        params={{
                          market: selectedMarket,
                          propertyType: selectedPropertyType,
                          bedrooms: selectedBedrooms,
                          zone: selectedZone,
                          area: selectedArea,
                          community: selectedCommunity,
                          development: selectedDevelopment,
                        }}
                      />
                    )
                  )}

                  <Th>Original Price</Th>
                  <Th>Price Changes</Th>
                  <Th>Total Change</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr
                    key={`${row.mls ?? "listing"}-${index}`}
                    className="hover:bg-slate-50"
                  >
                    <Td>
                      {row.mls ? (
                        <a
                          href={buildIdxUrl(String(row.mls))}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {row.mls}
                        </a>
                      ) : (
                        "—"
                      )}
                    </Td>

                    <Td>
                      {row.development_name ||
                        row.address ||
                        "—"}
                    </Td>

                    <Td>{row.unit_id || "—"}</Td>
                    <Td>{row.community_name || "—"}</Td>
                    <Td>{formatNumber(row.beds)}</Td>
                    <Td>{formatNumber(row.baths)}</Td>
                    <Td>{formatNumber(row.sqft)}</Td>

                    <Td strong>
                      {formatCurrency(row.current_price)}
                    </Td>

                    <Td>
                      {formatCurrency(row.price_per_sqft)}
                    </Td>

                    <Td>{formatNumber(row.dom)}</Td>

                    <Td>
                      {formatCurrency(row.original_price)}
                    </Td>

                    <Td>
                      {formatNumber(row.price_changes)}
                    </Td>

                    <Td>
                      {formatSignedPercent(
                        row.price_change_percent
                      )}
                    </Td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No active MLS listings were found for the
                      selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function SortableTh({
  label,
  sortKey,
  currentSort,
  currentDir,
  params,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  params: {
    market: MarketSegment;
    propertyType: PropertyTypeSegment;
    bedrooms: BedroomSegment;
    zone: string;
    area: string;
    community: string;
    development: string;
  };
}) {
  const isActive = currentSort === sortKey;

  const nextDir: SortDir =
    isActive && currentDir === "asc" ? "desc" : "asc";

  const arrow = isActive
    ? currentDir === "asc"
      ? " ↑"
      : " ↓"
    : "";

  const href = buildSearchResultsHref({
    ...params,
    sort: sortKey,
    dir: nextDir,
  });

  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
      <Link
        href={href}
        rel="nofollow"
        className="hover:text-slate-950"
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
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-3 ${
        strong ? "font-semibold" : ""
      }`}
    >
      {children}
    </td>
  );
}

function buildSearchResultsHref({
  market,
  propertyType,
  bedrooms,
  zone,
  area,
  community,
  development,
  sort = "current_price",
  dir = "desc",
}: {
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  bedrooms: BedroomSegment;
  zone: string;
  area: string;
  community: string;
  development: string;
  sort?: SortKey;
  dir?: SortDir;
}) {
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  if (bedrooms !== "all") {
    params.set("bedrooms", bedrooms);
  }

  if (zone !== DEFAULT_ZONE_NAME) {
    params.set("zone", zone);
  }

  if (area !== "all") {
    params.set("area", area);
  }

  if (community !== "all") {
    params.set("community", community);
  }

  if (development !== "all") {
    params.set("development", development);
  }

  if (sort !== "current_price") {
    params.set("sort", sort);
  }

  if (!(sort === "current_price" && dir === "desc")) {
    params.set("dir", dir);
  }

  const queryString = params.toString();

  return queryString
    ? `${BASE_PATH}?${queryString}`
    : BASE_PATH;
}

function buildReturnHref({
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
  const params = new URLSearchParams();

  if (market !== "all") {
    params.set("market", market);
  }

  if (propertyType !== "all") {
    params.set("propertyType", propertyType);
  }

  if (bedrooms !== "all") {
    params.set("bedrooms", bedrooms);
  }

  if (zone !== DEFAULT_ZONE_NAME) {
    params.set("zone", zone);
  }

  if (area !== "all") {
    params.set("area", area);
  }

  if (community !== "all") {
    params.set("community", community);
  }

  if (development !== "all") {
    params.set("development", development);
  }

  const queryString = params.toString();
  const basePath = "/market-intelligence/active-listings";

  return queryString
    ? `${basePath}?${queryString}`
    : basePath;
}

function propertyTypeDatabaseValue(
  value: PropertyTypeSegment
) {
  if (value === "condos") return "Condos";
  if (value === "houses") return "Houses";

  return "";
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
    "baths",
    "sqft",
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

function formatCurrency(value: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
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
    !Number.isFinite(Number(value))
  ) {
    return "—";
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
    return "—";
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

  parts.push(
    zone === "all" ? "All Zones" : zone
  );

  if (area !== "all") {
    parts.push(area);
  }

  if (community !== "all") {
    parts.push(community);
  }

  if (development !== "all") {
    parts.push(development);
  }

  return parts.join(" • ");
}