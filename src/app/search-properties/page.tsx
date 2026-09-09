import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/Header";
import PropertySearchNavigationSelect from "@/app/components/PropertySearchNavigationSelect";
import PropertySearchMoreFilters from "@/app/components/PropertySearchMoreFilters";
import { buildIdxUrl } from "@/lib/idx";

import {
  buildPropertySearchUrl,
  parsePropertySearchFilters,
  withPropertySearchFilters,
  type PropertySearchFilters,
  type PropertySearchParams,
} from "@/lib/property-search/filters";

import {
  getPropertySearchPageData,
  type FilteredSnapshotRow,
  type PropertySearchDisplayMode,
} from "@/lib/property-search/service";

import PropertySearchMarketStatistics from "@/app/components/PropertySearchMarketStatistics";

import AreaGuideModal from "@/app/components/AreaGuideModal";

import PropertySearchSaveActions from "@/app/components/PropertySearchSaveActions";
import { supabase } from "@/lib/supabase";

type SortKey =
  | "name"
  | "active_count"
  | "pending_count"
  | "median_list_price"
  | "median_list_price_per_sqft"
  | "median_active_dom";

type SortDir = "asc" | "desc";

type QuickSearchId =
  | "affordable-zona-romantica"
  | "affordable-versalles"
  | "affordable-amapas"
  | "affordable-pv-beachfront"
  | "value-zona-romantica"
  | "value-versalles"
  | "value-amapas"
  | "value-pv-beachfront";

type QuickSearchPreset = {
  id: QuickSearchId;
  label: string;
  resultTitle: string;
  sort: "price" | "price_per_sqm";
  area: string | null;
  community: string | null;
  beachfrontOnly: boolean;
};

type QuickListing = {
  mls: number;
  address: string | null;
  development_name: string | null;
  community_name: string | null;
  unit_id: string | null;
  beds: number | null;
  baths: number | null;
  sqm: number | null;
  current_price: number | null;
  price_per_sqft: number | null;
  price_per_sqm: number | null;
  dom: number | null;
};

const QUICK_SEARCH_PRESETS: QuickSearchPreset[] = [
  {
    id: "affordable-zona-romantica",
    label: "Zona Romántica",
    resultTitle: "Most Affordable Condos in Zona Romántica",
    sort: "price",
    area: "Centro South",
    community: "Emiliano Zapata",
    beachfrontOnly: false,
  },
  {
    id: "affordable-versalles",
    label: "Versalles",
    resultTitle: "Most Affordable Condos in Versalles",
    sort: "price",
    area: "Francisco Villa West",
    community: "Versalles",
    beachfrontOnly: false,
  },
  {
    id: "affordable-amapas",
    label: "Amapas",
    resultTitle: "Most Affordable Condos in Amapas",
    sort: "price",
    area: "South Shore",
    community: "Amapas",
    beachfrontOnly: false,
  },
  {
    id: "affordable-pv-beachfront",
    label: "PV Beachfront",
    resultTitle: "Most Affordable Beachfront Condos in Puerto Vallarta",
    sort: "price",
    area: null,
    community: null,
    beachfrontOnly: true,
  },
  {
    id: "value-zona-romantica",
    label: "Zona Romántica",
    resultTitle: "Best Condo Value per m² in Zona Romántica",
    sort: "price_per_sqm",
    area: "Centro South",
    community: "Emiliano Zapata",
    beachfrontOnly: false,
  },
  {
    id: "value-versalles",
    label: "Versalles",
    resultTitle: "Best Condo Value per m² in Versalles",
    sort: "price_per_sqm",
    area: "Francisco Villa West",
    community: "Versalles",
    beachfrontOnly: false,
  },
  {
    id: "value-amapas",
    label: "Amapas",
    resultTitle: "Best Condo Value per m² in Amapas",
    sort: "price_per_sqm",
    area: "South Shore",
    community: "Amapas",
    beachfrontOnly: false,
  },
  {
    id: "value-pv-beachfront",
    label: "PV Beachfront",
    resultTitle: "Best Beachfront Condo Value per m² in Puerto Vallarta",
    sort: "price_per_sqm",
    area: null,
    community: null,
    beachfrontOnly: true,
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const title =
    "Search Puerto Vallarta & Riviera Nayarit Properties | SearchPV";

  const description =
    "Search current active and pending properties across Puerto Vallarta and Riviera Nayarit by market, property type, geography, price, bedrooms, bathrooms, and property attributes.";

  const pageUrl = "https://searchpv.com/search-properties";

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

export default async function SearchPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<PropertySearchParams>;
}) {
  const params = await searchParams;
  const filters = parsePropertySearchFilters(params);
  const quickSearch = getQuickSearchPreset(firstParam(params.quick));

  const selectedSort = getSortKey(firstParam(params.sort));
  const selectedDir = getSortDir(firstParam(params.dir));

  let pageData;
  let quickListings: QuickListing[] = [];

  try {
    pageData = await getPropertySearchPageData(filters);

    if (quickSearch) {
      quickListings = await getQuickListings(quickSearch);
    }
  } catch (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">
          Error loading property-search data.
        </p>
        <pre className="mt-4 whitespace-pre-wrap text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </pre>
      </main>
    );
  }

  const {
    displayMode,
    summary,
    rows,
    selectors,
    snapshotDate,
  } = pageData;

  const displayedRows = sortFilteredRows(
    rows,
    selectedSort,
    selectedDir
  );

  const quickSummary = quickSearch
    ? summarizeQuickListings(quickListings)
    : null;

  const displayedSummary = quickSummary ?? summary;

  const selectedZone = filters.zone ?? "Puerto Vallarta";
  const selectedArea = filters.area;
  const selectedCommunity = filters.community;
  const selectedDevelopment = filters.development;

  const selectedCommunityOption = selectors.communities.find(
    (option) =>
      option.name === selectedCommunity ||
      option.slug === selectedCommunity
  );

  const selectedDevelopmentOption = selectors.developments.find(
    (option) =>
      option.name === selectedDevelopment ||
      option.slug === selectedDevelopment
  );

  const communityOptions =
    !selectedArea
      ? []
      : [
          {
            label: "All Communities",
            href: buildSearchHref(
              withPropertySearchFilters(filters, {
                community: null,
                development: null,
              }),
              selectedSort,
              selectedDir
            ),
          },
          ...selectors.communities.map((community) => ({
            label: community.name,
            href: buildSearchHref(
              withPropertySearchFilters(filters, {
                community: community.name,
                development: null,
              }),
              selectedSort,
              selectedDir
            ),
          })),
        ];

  const developmentOptions =
    !selectedCommunity
      ? []
      : [
          {
            label: "All Developments",
            href: buildSearchHref(
              withPropertySearchFilters(filters, {
                development: null,
              }),
              selectedSort,
              selectedDir
            ),
          },
          ...selectors.developments.map((development) => ({
            label: development.name,
            href: buildSearchHref(
              withPropertySearchFilters(filters, {
                development: development.name,
              }),
              selectedSort,
              selectedDir
            ),
          })),
        ];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SearchPV",
    url: "https://searchpv.com/",
    description:
      "Puerto Vallarta and Riviera Nayarit property search and real estate market intelligence.",
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target:
        "https://searchpv.com/search-properties?community={community}",
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
      "SearchPV provides Puerto Vallarta and Riviera Nayarit property search and real estate market intelligence.",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div className="mt-8">
            <div
              id="market-explorer"
              className="flex scroll-mt-4 items-center gap-4"
            >
              <div className="h-px flex-1 bg-white/20" />

              <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em] text-white">
                Market Explorer
              </span>

              <div className="h-px flex-1 bg-white/20" />
            </div>
          </div>

          <PropertySearchSelectors
            filters={filters}
            selectedSort={selectedSort}
            selectedDir={selectedDir}
            zones={selectors.zones.map((option) => option.name)}
            areas={selectors.areas.map((option) => option.name)}
            communityOptions={communityOptions}
            developmentOptions={developmentOptions}
            selectedCommunityLabel={
              selectedCommunityOption?.name ?? "All Communities"
            }
            selectedDevelopmentLabel={
              selectedDevelopmentOption?.name ?? "All Developments"
            }
          />
        </div>
      </section>

      <PopularMarketShortcuts />

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-0 md:px-8 md:pb-10 md:pt-2">
        <SelectedMarketPanel
          filters={filters}
          displayMode={displayMode}
          rowCount={quickSearch ? quickListings.length : displayedRows.length}
          quickSearch={quickSearch}
        />

        <PropertySearchMarketStatistics
          activeCount={displayedSummary.activeCount}
          pendingCount={displayedSummary.pendingCount}
          activeListingHref={
            displayedSummary.activeListingIds
              ? buildIdxUrl(displayedSummary.activeListingIds)
              : null
          }
          pendingListingHref={
            displayedSummary.pendingListingIds
              ? buildIdxUrl(displayedSummary.pendingListingIds)
              : null
          }
          averageListPrice={displayedSummary.averageListPrice}
          medianListPrice={displayedSummary.medianListPrice}
          averageListPricePerSqft={
            displayedSummary.averageListPricePerSqft
          }
          medianListPricePerSqft={
            displayedSummary.medianListPricePerSqft
          }
          averageListPricePerSqm={
            displayedSummary.averageListPricePerSqm
          }
          medianListPricePerSqm={
            displayedSummary.medianListPricePerSqm
          }
        />

        <BedroomQuickFilters
          filters={filters}
          selectedSort={selectedSort}
          selectedDir={selectedDir}
        />

        {quickSearch ? (
          <QuickListingResults
            preset={quickSearch}
            listings={quickListings}
          />
        ) : (
          <>
            <h2
              id="filtered-snapshot"
              className="mt-8 text-2xl font-bold"
            >
              {displayMode === "area"
                ? "Filtered Area Snapshot"
                : displayMode === "community"
                  ? "Filtered Community Snapshot"
                  : "Filtered Development Snapshot"}
            </h2>

            <p className="text-sm text-slate-500">
          Data Current As Of:{" "}
          {snapshotDate ? formatDateOnly(snapshotDate) : "Unknown"}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-600">
          <p>Tap or click any column heading to sort.</p>

          <p className="shrink-0 md:hidden">
            ← Swipe for more →
          </p>
            </div>
            {displayedRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold">
              No matching properties
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              No current active or pending listings match this combination
              of market, geography, and property filters.
            </p>
          </div>
            ) : (
          <div className="mt-1 max-h-[70vh] overflow-auto rounded-xl bg-white shadow md:max-h-[65vh]">
            <table className="min-w-[760px] text-sm">
              <thead className="bg-slate-100 text-slate-700 shadow-sm">
                <tr>
                  <SortableTh
                    label={displayLabel(displayMode)}
                    sortKey="name"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                    className="sticky left-0 top-0 z-30 bg-slate-100"
                  />

                  <SortableTh
                    label="Active"
                    sortKey="active_count"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                  />

                  <SortableTh
                    label="Pending"
                    sortKey="pending_count"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                  />

                  <SortableTh
                    label="Median List"
                    sortKey="median_list_price"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                  />

                  <SortableTh
                    label="Median List $/ft²"
                    sortKey="median_list_price_per_sqft"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                  />

                  <SortableTh
                    label="Median Active DOM"
                    sortKey="median_active_dom"
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                    filters={filters}
                  />
                </tr>
              </thead>

              <tbody>
                {displayedRows.map((row) => (
                  <FilteredSnapshotTableRow
                    key={rowKey(row)}
                    row={row}
                    displayMode={displayMode}
                    filters={filters}
                    selectedSort={selectedSort}
                    selectedDir={selectedDir}
                  />
                ))}
              </tbody>
            </table>
          </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function PopularMarketShortcuts() {
  const affordable = QUICK_SEARCH_PRESETS.filter(
    (preset) => preset.sort === "price"
  );
  const value = QUICK_SEARCH_PRESETS.filter(
    (preset) => preset.sort === "price_per_sqm"
  );

  return (
    <section className="border-b border-emerald-200 bg-emerald-50/60 px-4 py-5 shadow-sm md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Popular Market Shortcuts
        </div>

        <div className="mt-3 grid gap-5 lg:grid-cols-2 lg:gap-8">
          <ShortcutGroup
            title="Most Affordable Condos"
            description="Active resale condos, sorted by lowest list price"
            presets={affordable}
          />
          <ShortcutGroup
            title="Best Condo Value per m²"
            description="Active resale condos, sorted by lowest price per m²"
            presets={value}
          />
        </div>
      </div>
    </section>
  );
}

function ShortcutGroup({
  title,
  description,
  presets,
}: {
  title: string;
  description: string;
  presets: QuickSearchPreset[];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Link
            key={preset.id}
            href={buildQuickSearchHref(preset)}
            className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-100"
          >
            {preset.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickListingResults({
  preset,
  listings,
}: {
  preset: QuickSearchPreset;
  listings: QuickListing[];
}) {
  return (
    <section id="property-listings" className="mt-8 scroll-mt-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <h2 className="text-xl font-bold text-slate-950">
          {preset.resultTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Active resale condos, ranked by {preset.sort === "price"
            ? "lowest list price"
            : "lowest list price per m²"}.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Rankings use current MLS data. Unusually low values may reflect incomplete or inconsistent listing entries.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-bold">No matching listings</h3>
          <p className="mt-2 text-sm text-slate-600">
            No current listings match this shortcut&apos;s criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 text-center text-xs font-semibold text-slate-500 md:hidden">
            ← Swipe for more →
          </div>

          <div className="mt-2 overflow-x-auto rounded-xl bg-white shadow md:mt-4">
            <table className="min-w-[880px] text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <Th className="sticky left-0 z-30 border-r border-slate-200 bg-slate-100">
                    Rank
                  </Th>

                  <Th className="sticky left-[78px] z-30 border-r border-slate-200 bg-slate-100">
                    MLS
                  </Th>

                  <Th>Property</Th>
                  <Th>BR / BA</Th>
                  <Th>Interior</Th>
                  <Th>List Price</Th>
                  <Th>Price / m²</Th>
                  <Th>DOM</Th>
                </tr>
              </thead>

              <tbody>
                {listings.map((listing, index) => (
                  <tr key={listing.mls} className="border-t">
                    <Td className="sticky left-0 z-20 w-[78px] min-w-[78px] border-r border-slate-200 bg-white font-bold text-slate-500">
                      #{index + 1}
                    </Td>

                    <Td className="sticky left-[78px] z-20 border-r border-slate-200 bg-white">
                      <a
                        href={buildIdxUrl(String(listing.mls))}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {listing.mls}
                      </a>
                    </Td>

                    <Td>
                      <div className="font-semibold text-slate-950">
                        {listing.development_name || listing.address || "Condo"}
                        {listing.unit_id ? ` · Unit ${listing.unit_id}` : ""}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {[listing.community_name, listing.address]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </Td>

                    <Td>{formatBedsBaths(listing.beds, listing.baths)}</Td>

                    <Td>{formatSquareMeters(listing.sqm)}</Td>

                    <Td className="font-semibold">
                      {formatMoney(listing.current_price)}
                    </Td>

                    <Td
                      className={
                        preset.sort === "price_per_sqm"
                          ? "font-bold text-amber-800"
                          : ""
                      }
                    >
                      {formatMoney(listing.price_per_sqm)}
                    </Td>

                    <Td>{formatNumber(listing.dom)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function PropertySearchSelectors({
  filters,
  selectedSort,
  selectedDir,
  zones,
  areas,
  communityOptions,
  developmentOptions,
  selectedCommunityLabel,
  selectedDevelopmentLabel,
}: {
  filters: PropertySearchFilters;
  selectedSort: SortKey;
  selectedDir: SortDir;
  zones: string[];
  areas: string[];
  communityOptions: Array<{
    label: string;
    href: string;
  }>;
  developmentOptions: Array<{
    label: string;
    href: string;
  }>;
  selectedCommunityLabel: string;
  selectedDevelopmentLabel: string;
}) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "6px",
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
    <div className="mt-[18px]">
      <div style={rowStyle}>
        <SelectorPill
          label="All"
          selected={filters.propertyType === "all"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                propertyType: "all",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />

        <SelectorPill
          label="Condos"
          selected={filters.propertyType === "condos"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                propertyType: "condos",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />

        <SelectorPill
          label="Houses"
          selected={filters.propertyType === "houses"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                propertyType: "houses",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <SelectorPill
          label="All"
          selected={filters.market === "all"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                market: "all",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />

        <SelectorPill
          label="Pre-Construction"
          selected={filters.market === "pre_construction"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                market: "pre_construction",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />

        <SelectorPill
          label="Resale"
          selected={filters.market === "resale"}
          href={buildSearchHref(
              withPropertySearchFilters(filters, {
                market: "resale",
              }),
            selectedSort,
            selectedDir
          )}
          selectedStyle={selectedStyle}
          unselectedStyle={unselectedStyle}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        <PropertySearchNavigationSelect
          value={filters.zone ?? "Puerto Vallarta"}
          options={zones.map((zone) => ({
            label: zone,
            value: zone,
            href: buildSearchHref(
              withPropertySearchFilters(filters, {
                zone,
                area: null,
                community: null,
                development: null,
              }),
              selectedSort,
              selectedDir
            ),
          }))}
        />

        <PropertySearchNavigationSelect
          value={filters.area ?? "all"}
          options={[
            {
              label: "All Areas",
              value: "all",
              href: buildSearchHref(
                withPropertySearchFilters(filters, {
                  area: null,
                  community: null,
                  development: null,
                }),
                selectedSort,
                selectedDir
              ),
            },
            ...areas.map((area) => ({
              label: area,
              value: area,
              href: buildSearchHref(
                withPropertySearchFilters(filters, {
                  area,
                  community: null,
                  development: null,
                }),
                selectedSort,
                selectedDir
              ),
            })),
          ]}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        <PropertySearchNavigationSelect
          value={
            filters.community
              ? communityOptions.find(
                  (option) => option.label === selectedCommunityLabel
                )?.href ?? "placeholder"
              : communityOptions[0]?.href ?? "placeholder"
          }
          disabled={communityOptions.length === 0}
          placeholder={
            communityOptions.length === 0
              ? "Choose Area First"
              : "Choose Community"
          }
          options={communityOptions.map((option) => ({
            label: option.label,
            value: option.href,
            href: option.href,
          }))}
        />

        <PropertySearchNavigationSelect
          value={
            filters.development
              ? developmentOptions.find(
                  (option) => option.label === selectedDevelopmentLabel
                )?.href ?? "placeholder"
              : developmentOptions[0]?.href ?? "placeholder"
          }
          disabled={developmentOptions.length === 0}
          placeholder={
            developmentOptions.length === 0
              ? "Choose Community First"
              : "Choose Development"
          }
          options={developmentOptions.map((option) => ({
            label: option.label,
            value: option.href,
            href: option.href,
          }))}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          marginTop: "8px",
          textAlign: "center",
        }}
      >
  <AreaGuideModal variant="search-help" />
</div>

      <PropertySearchMoreFilters
        filters={filters}
        selectedSort={selectedSort}
        selectedDir={selectedDir}
      />
    </div>
  );
}

function SelectorPill({
  label,
  selected,
  href,
  selectedStyle,
  unselectedStyle,
}: {
  label: string;
  selected: boolean;
  href: string;
  selectedStyle: React.CSSProperties;
  unselectedStyle: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      style={selected ? selectedStyle : unselectedStyle}
    >
      {label}
    </a>
  );
}

function SelectedMarketPanel({
  filters,
  displayMode,
  rowCount,
  quickSearch,
}: {
  filters: PropertySearchFilters;
  displayMode: PropertySearchDisplayMode;
  rowCount: number;
  quickSearch: QuickSearchPreset | null;
}) {
  const labels = buildSelectedMarketLabels(filters);

  const locationLabels = [
    filters.zone ?? "Puerto Vallarta",
    filters.area,
    filters.community,
    filters.development,
  ].filter((value): value is string => Boolean(value));

  const searchTitle = `${
    filters.development ??
    filters.community ??
    filters.area ??
    filters.zone ??
    "Puerto Vallarta"
  } Property Search`;

  const filterSummary = [
    ...locationLabels,
    ...labels,
    ...(quickSearch ? ["Active", quickSearch.resultTitle] : []),
  ].join(" · ");

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
        Selected Market
      </div>

      <div className="ml-4 mt-2 text-slate-600">
        <Link
          href="/search-properties"
          className="font-semibold text-blue-700 hover:underline"
        >
          Search Properties
        </Link>

        {" > "}
        <span>{filters.zone ?? "Puerto Vallarta"}</span>

        {filters.area && (
          <>
            {" > "}
            <Link
              href={buildPropertySearchUrl(
                withPropertySearchFilters(filters, {
                  community: null,
                  development: null,
                })
              )}
              className="font-semibold text-blue-700 hover:underline"
            >
              {filters.area}
            </Link>
          </>
        )}

        {filters.community && (
          <>
            {" > "}
            <Link
              href={buildPropertySearchUrl(
                withPropertySearchFilters(filters, {
                  development: null,
                })
              )}
              className="font-semibold text-blue-700 hover:underline"
            >
              {filters.community}
            </Link>
          </>
        )}

        {filters.development && (
          <>
            {" > "}
            <span>{filters.development}</span>
          </>
        )}
      </div>

      {labels.length > 0 && (
        <div className="ml-4 mt-2 flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {quickSearch && (
        <div className="ml-4 mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            Active
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            {quickSearch.sort === "price"
              ? "Lowest price first"
              : "Lowest price per m² first"}
          </span>
          {quickSearch.beachfrontOnly && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
              Beachfront only
            </span>
          )}
        </div>
      )}

      <div className="ml-4 mt-2 font-bold text-slate-500">
        {rowCount.toLocaleString()}{" "}
        {quickSearch
          ? rowCount === 1
            ? "listing"
            : "listings"
          : displayMode === "area"
          ? "areas"
          : displayMode === "community"
            ? "communities"
            : "developments"}{" "}
        shown
      </div>
        <PropertySearchSaveActions
          searchTitle={searchTitle}
          filterSummary={filterSummary}
        />
    </div>
  );
}

function BedroomQuickFilters({
  filters,
  selectedSort,
  selectedDir,
}: {
  filters: PropertySearchFilters;
  selectedSort: SortKey;
  selectedDir: SortDir;
}) {
  const options: Array<{
    label: string;
    minBeds: number | null;
    maxBeds: number | null;
  }> = [
    { label: "All", minBeds: null, maxBeds: null },
    { label: "Studio", minBeds: 0, maxBeds: 0 },
    { label: "1 BR", minBeds: 1, maxBeds: 1 },
    { label: "2 BR", minBeds: 2, maxBeds: 2 },
    { label: "3 BR", minBeds: 3, maxBeds: 3 },
    { label: "4+ BR", minBeds: 4, maxBeds: null },
  ];

  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        Bedrooms
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected =
            filters.minBeds === option.minBeds &&
            filters.maxBeds === option.maxBeds;

          const href = buildSearchHref(
            withPropertySearchFilters(filters, {
              minBeds: option.minBeds,
              maxBeds: option.maxBeds,
            }),
            selectedSort,
            selectedDir
          );

          return (
            <Link
              key={option.label}
              href={href}
              className={
                selected
                  ? "rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white"
                  : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-500"
              }
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilteredSnapshotTableRow({
  row,
  displayMode,
  filters,
  selectedSort,
  selectedDir,
}: {
  row: FilteredSnapshotRow;
  displayMode: PropertySearchDisplayMode;
  filters: PropertySearchFilters;
  selectedSort: SortKey;
  selectedDir: SortDir;
}) {
  const href = buildRowHref(
    row,
    displayMode,
    filters,
    selectedSort,
    selectedDir
  );

  return (
    <tr className="border-t">
      <Td className="sticky left-0 z-10 border-r border-slate-200 bg-white">
        {href ? (
          <Link
            href={href}
            className="font-semibold text-blue-700 hover:underline"
          >
            {row.group_name ?? "-"}
          </Link>
        ) : (
          <span>{row.group_name ?? "-"}</span>
        )}
      </Td>

      <Td>
        <IdxListingLink listingIds={row.active_listing_ids}>
          {row.active_count.toLocaleString()}
        </IdxListingLink>
      </Td>

      <Td>
        <IdxListingLink listingIds={row.pending_listing_ids}>
          {row.pending_count.toLocaleString()}
        </IdxListingLink>
      </Td>

      <Td>{formatMoney(row.median_list_price)}</Td>

      <Td>
        {formatPricePerMeasure(
          row.median_list_price_per_sqft
        )}
      </Td>

      <Td>{formatNumber(row.median_active_dom)}</Td>
    </tr>
  );
}

function SortableTh({
  label,
  sortKey,
  selectedSort,
  selectedDir,
  filters,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  selectedSort: SortKey;
  selectedDir: SortDir;
  filters: PropertySearchFilters;
  className?: string;
}) {
  const isSelected = selectedSort === sortKey;
  const nextDir: SortDir =
    isSelected && selectedDir === "desc" ? "asc" : "desc";

  const arrow = isSelected
    ? selectedDir === "asc"
      ? " ↑"
      : " ↓"
    : "";

  return (
    <Th className={`sticky top-0 z-20 bg-slate-100 ${className}`}>
      <Link
        href={buildSearchHref(
          filters,
          sortKey,
          nextDir,
          "filtered-snapshot"
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

function buildRowHref(
  row: FilteredSnapshotRow,
  displayMode: PropertySearchDisplayMode,
  filters: PropertySearchFilters,
  selectedSort: SortKey,
  selectedDir: SortDir
): string | null {
  if (displayMode === "area" && row.area_name) {
    return buildSearchHref(
      withPropertySearchFilters(filters, {
        zone: row.zone_name ?? filters.zone,
        area: row.area_name,
        community: null,
        development: null,
      }),
      selectedSort,
      selectedDir
    );
  }

  if (displayMode === "community" && row.community_name) {
    return buildSearchHref(
      withPropertySearchFilters(filters, {
        zone: row.zone_name ?? filters.zone,
        area: row.area_name ?? filters.area,
        community: row.community_name,
        development: null,
      }),
      selectedSort,
      selectedDir
    );
  }

  if (displayMode === "development" && row.development_name) {
    return row.all_listing_ids
      ? buildIdxUrl(row.all_listing_ids)
      : null;
  }

    return null;
  }

function buildSearchHref(
  filters: PropertySearchFilters,
  sort: SortKey,
  dir: SortDir,
  anchor: "market-explorer" | "filtered-snapshot" = "market-explorer"
): string {
  const baseUrl = buildPropertySearchUrl(
    filters,
    "/search-properties",
    anchor
  );

  const [beforeHash, hashPart] = baseUrl.split("#");
  const [pathname, queryString = ""] = beforeHash.split("?");

  const params = new URLSearchParams(queryString);

  if (sort !== "active_count") {
    params.set("sort", sort);
  } else {
    params.delete("sort");
  }

  if (!(sort === "active_count" && dir === "desc")) {
    params.set("dir", dir);
  } else {
    params.delete("dir");
  }

  const query = params.toString();

  return `${pathname}${query ? `?${query}` : ""}${
    hashPart ? `#${hashPart}` : ""
  }`;
}

function resetBelowMarket(
  filters: PropertySearchFilters
): PropertySearchFilters {
  return {
    ...filters,
    area: null,
    community: null,
    development: null,
  };
}

function resetBelowPropertyType(
  filters: PropertySearchFilters
): PropertySearchFilters {
  return {
    ...filters,
    area: null,
    community: null,
    development: null,
  };
}

function buildSelectedMarketLabels(
  filters: PropertySearchFilters
): string[] {
  const labels: string[] = [];

  if (filters.market === "pre_construction") {
    labels.push("Pre-Construction");
  } else if (filters.market === "resale") {
    labels.push("Resale");
  }

  if (filters.propertyType === "condos") {
    labels.push("Condos");
  } else if (filters.propertyType === "houses") {
    labels.push("Houses");
  }

  if (filters.minBeds !== null || filters.maxBeds !== null) {
    labels.push(
      formatRangeLabel(
        filters.minBeds,
        filters.maxBeds,
        "BR",
        "Studio"
      )
    );
  }

  if (filters.minBaths !== null || filters.maxBaths !== null) {
    labels.push(
      formatRangeLabel(
        filters.minBaths,
        filters.maxBaths,
        "BA"
      )
    );
  }

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    labels.push(
      formatMoneyRange(
        filters.minPrice,
        filters.maxPrice,
        "USD"
      )
    );
  }

  if (filters.waterfront) labels.push("Waterfront / Beachfront");
  if (filters.oceanView) labels.push("Ocean View");
  if (filters.petFriendly) labels.push("Pet Friendly");
  if (filters.pool) labels.push("Pool");
  if (filters.parking) labels.push("Parking");
  if (filters.furnished) labels.push("Furnished");

  if (filters.minHoa !== null || filters.maxHoa !== null) {
    labels.push(
      `HOA ${formatMoneyRange(
        filters.minHoa,
        filters.maxHoa,
        "MXN"
      )}`
    );
  }

  return labels;
}

function formatRangeLabel(
  min: number | null,
  max: number | null,
  suffix: string,
  zeroLabel?: string
): string {
  if (min !== null && max !== null && min === max) {
    if (min === 0 && zeroLabel) {
      return zeroLabel;
    }

    return `${formatCompactNumber(min)} ${suffix}`;
  }

  if (min !== null && max === null) {
    return `${formatCompactNumber(min)}+ ${suffix}`;
  }

  if (min === null && max !== null) {
    const maxLabel =
      max === 0 && zeroLabel
        ? zeroLabel
        : `${formatCompactNumber(max)} ${suffix}`;

    return `Up to ${maxLabel}`;
  }

  return `${formatCompactNumber(min ?? 0)}–${formatCompactNumber(
    max ?? 0
  )} ${suffix}`;
}

function formatMoneyRange(
  min: number | null,
  max: number | null,
  currency: "USD" | "MXN"
): string {
  if (min !== null && max !== null && min === max) {
    return formatCompactMoney(min, currency);
  }

  if (min !== null && max === null) {
    return `${formatCompactMoney(min, currency)}+`;
  }

  if (min === null && max !== null) {
    return `Up to ${formatCompactMoney(max, currency)}`;
  }

  return `${formatCompactMoney(min ?? 0, currency)}–${formatCompactMoney(
    max ?? 0,
    currency
  )}`;
}

function sortFilteredRows(
  rows: FilteredSnapshotRow[],
  sort: SortKey,
  dir: SortDir
): FilteredSnapshotRow[] {
  return [...rows].sort((a, b) => {
    const aValue =
      sort === "name" ? a.group_name : a[sort];

    const bValue =
      sort === "name" ? b.group_name : b[sort];

    if (
      typeof aValue === "string" &&
      typeof bValue === "string"
    ) {
      return dir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const aNumber = Number(aValue ?? -Infinity);
    const bNumber = Number(bValue ?? -Infinity);

    return dir === "asc"
      ? aNumber - bNumber
      : bNumber - aNumber;
  });
}

function getQuickSearchPreset(
  value?: string
): QuickSearchPreset | null {
  return (
    QUICK_SEARCH_PRESETS.find((preset) => preset.id === value) ?? null
  );
}

function buildQuickSearchHref(preset: QuickSearchPreset): string {
  const params = new URLSearchParams({
    market: "resale",
    propertyType: "condos",
    quick: preset.id,
  });

  if (preset.area) params.set("area", preset.area);
  if (preset.community) params.set("community", preset.community);

  return `/search-properties?${params.toString()}#property-listings`;
}

async function getQuickListings(
  preset: QuickSearchPreset
): Promise<QuickListing[]> {
  let query = supabase
    .from("current_search_listing")
    .select(
      "mls,address,development_name,community_name,beds,baths,sqm,current_price,price_per_sqft,price_per_sqm,dom"
    )
    .eq("listing_status", "active")
    .eq("property_type_segment", "condos")
    .eq("market_segment", "resale")
    .eq("zone_name", "Puerto Vallarta")
    .gt("current_price", 0);

  if (preset.area) {
    query = query.eq("area_name", preset.area);
  }

  if (preset.community) {
    query = query.eq(
      "community_name",
      preset.community
    );
  }

  if (preset.beachfrontOnly) {
    query = query.eq("beachfront_fl", true);
  }

  if (preset.sort === "price_per_sqm") {
    query = query.gt("price_per_sqm", 0);
  }

  const orderColumn =
    preset.sort === "price"
      ? "current_price"
      : "price_per_sqm";

  const { data, error } = await query
    .order(orderColumn, {
      ascending: true,
      nullsFirst: false,
    })
    .limit(500);

  if (error) {
    throw new Error(
      `Unable to load market shortcut listings: ${error.message}`
    );
  }

  /*
   * Unit numbers are stored on active_listing but are not
   * currently exposed by current_search_listing.
   */
  const mlsNumbers = (data ?? [])
    .map((row) => Number(row.mls))
    .filter(Number.isFinite);

  const { data: unitRows, error: unitError } =
    mlsNumbers.length > 0
      ? await supabase
          .from("active_listing")
          .select("mls,unit_id")
          .in("mls", mlsNumbers)
      : {
          data: [],
          error: null,
        };

  if (unitError) {
    throw new Error(
      `Unable to load market shortcut unit numbers: ${unitError.message}`
    );
  }

  const unitByMls = new Map(
    (unitRows ?? []).map((row) => [
      Number(row.mls),
      row.unit_id,
    ])
  );

  return (data ?? []).map((row) => ({
    mls: Number(row.mls),
    address: row.address,
    development_name: row.development_name,
    community_name: row.community_name,
    unit_id:
      unitByMls.get(Number(row.mls)) ?? null,
    beds: nullableNumberValue(row.beds),
    baths: nullableNumberValue(row.baths),
    sqm: nullableNumberValue(row.sqm),
    current_price: nullableNumberValue(
      row.current_price
    ),
    price_per_sqft: nullableNumberValue(
      row.price_per_sqft
    ),
    price_per_sqm: nullableNumberValue(
      row.price_per_sqm
    ),
    dom: nullableNumberValue(row.dom),
  }));
}

function summarizeQuickListings(listings: QuickListing[]) {
  const prices = numericListingValues(listings, "current_price");
  const pricesPerSqft = numericListingValues(listings, "price_per_sqft");
  const pricesPerSqm = numericListingValues(listings, "price_per_sqm");
  const domValues = numericListingValues(listings, "dom");

  return {
    activeCount: listings.length,
    pendingCount: 0,
    totalCount: listings.length,
    averageListPrice: average(prices),
    medianListPrice: median(prices),
    averageListPricePerSqft: average(pricesPerSqft),
    medianListPricePerSqft: median(pricesPerSqft),
    averageListPricePerSqm: average(pricesPerSqm),
    medianListPricePerSqm: median(pricesPerSqm),
    medianActiveDom: median(domValues),
    activeListingIds: listings.map((listing) => listing.mls).join(",") || null,
    pendingListingIds: null,
    allListingIds: listings.map((listing) => listing.mls).join(",") || null,
    snapshotDate: null,
  };
}

function numericListingValues(
  listings: QuickListing[],
  key: "current_price" | "price_per_sqft" | "price_per_sqm" | "dom"
): number[] {
  return listings
    .map((listing) => listing[key])
    .filter((value): value is number => value !== null && value > 0);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function nullableNumberValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatBedsBaths(
  beds: number | null,
  baths: number | null
): string {
  return `${formatNumber(beds)} / ${formatNumber(baths)}`;
}

function formatSquareMeters(value: number | null): string {
  return value === null ? "-" : `${formatNumber(value)} m²`;
}

function getSortKey(value?: string): SortKey {
  const allowed: SortKey[] = [
    "name",
    "active_count",
    "pending_count",
    "median_list_price",
    "median_list_price_per_sqft",
    "median_active_dom",
  ];

  return allowed.includes(value as SortKey)
    ? (value as SortKey)
    : "active_count";
}

function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function rowKey(row: FilteredSnapshotRow): string {
  return [
    row.group_level,
    row.zone_slug,
    row.area_slug,
    row.community_slug,
    row.development_slug,
    row.group_name,
  ]
    .filter(Boolean)
    .join("|");
}

function displayLabel(
  displayMode: PropertySearchDisplayMode
): string {
  if (displayMode === "area") return "Area";
  if (displayMode === "community") return "Community";
  return "Development";
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
    <td
      className={`whitespace-nowrap px-4 py-3 ${className}`}
    >
      {children}
    </td>
  );
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPricePerMeasure(
  value: number | null
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

function formatCompactNumber(value: number): string {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatCompactMoney(
  value: number,
  currency: "USD" | "MXN" = "USD"
): string {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
