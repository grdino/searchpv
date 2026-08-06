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

type SortKey =
  | "name"
  | "active_count"
  | "pending_count"
  | "median_list_price"
  | "median_list_price_per_sqft"
  | "median_active_dom";

type SortDir = "asc" | "desc";

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

  const selectedSort = getSortKey(firstParam(params.sort));
  const selectedDir = getSortDir(firstParam(params.dir));

  let pageData;

  try {
    pageData = await getPropertySearchPageData(filters);
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

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-0 md:px-8 md:pb-10 md:pt-2">
        <SelectedMarketPanel
          filters={filters}
          displayMode={displayMode}
          rowCount={displayedRows.length}
        />

        <MatchingPropertiesSummary summary={summary} />

        <BedroomQuickFilters
          filters={filters}
          selectedSort={selectedSort}
          selectedDir={selectedDir}
        />

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

        <p className="mt-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

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
      </section>
    </main>
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
}: {
  filters: PropertySearchFilters;
  displayMode: PropertySearchDisplayMode;
  rowCount: number;
}) {
  const labels = buildSelectedMarketLabels(filters);

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

      <div className="ml-4 mt-2 font-bold text-slate-500">
        {rowCount.toLocaleString()}{" "}
        {displayMode === "area"
          ? "areas"
          : displayMode === "community"
            ? "communities"
            : "developments"}{" "}
        shown
      </div>
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

function MatchingPropertiesSummary({
  summary,
}: {
  summary: {
    activeCount: number;
    pendingCount: number;
    totalCount: number;
    medianListPrice: number | null;
    medianListPricePerSqft: number | null;
    medianActiveDom: number | null;
    activeListingIds: string | null;
    pendingListingIds: string | null;
  };
}) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
        Matching Properties
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-center text-sm text-slate-700 sm:grid-cols-4">
        <div>
          <div className="text-lg font-bold leading-none text-slate-950">
            <IdxListingLink listingIds={summary.activeListingIds}>
              {summary.activeCount.toLocaleString()}
            </IdxListingLink>
          </div>
          <div className="mt-1">Active</div>
        </div>

        <div>
          <div className="text-lg font-bold leading-none text-slate-950">
            <IdxListingLink listingIds={summary.pendingListingIds}>
              {summary.pendingCount.toLocaleString()}
            </IdxListingLink>
          </div>
          <div className="mt-1">Pending</div>
        </div>

        <div>
          <div className="text-lg font-bold leading-none text-slate-950">
            {formatMoney(summary.medianListPrice)}
          </div>
          <div className="mt-1">Median List</div>
        </div>

        <div>
          <div className="text-lg font-bold leading-none text-slate-950">
            {formatPricePerMeasure(summary.medianListPricePerSqft)}
          </div>
          <div className="mt-1">Median $/ft²</div>
        </div>
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
          nextDir
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
  dir: SortDir
): string {
  const baseUrl = buildPropertySearchUrl(
    filters,
    "/search-properties",
    "market-explorer"
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