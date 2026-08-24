import { supabase } from "@/lib/supabase";

import type { PropertySearchFilters } from "./filters";
import { buildFilteredSnapshotRpcParams } from "./rpc";

export type PropertySearchDisplayMode =
  | "area"
  | "community"
  | "development";

export type FilteredSnapshotRow = {
  group_level: "summary" | PropertySearchDisplayMode;
  group_name: string | null;

  zone_name: string | null;
  zone_slug: string | null;

  area_name: string | null;
  area_slug: string | null;

  community_name: string | null;
  community_slug: string | null;

  development_name: string | null;
  development_slug: string | null;

  active_count: number;
  pending_count: number;
  total_count: number;

  average_list_price: number | null;
  median_list_price: number | null;

  average_list_price_per_sqft: number | null;
  median_list_price_per_sqft: number | null;

  average_list_price_per_sqm: number | null;
  median_list_price_per_sqm: number | null;

  median_active_dom: number | null;

  active_listing_ids: string | null;
  pending_listing_ids: string | null;
  all_listing_ids: string | null;

  snapshot_date: string | null;
};

export type PropertySearchSummary = {
  activeCount: number;
  pendingCount: number;
  totalCount: number;

  averageListPrice: number | null;
  medianListPrice: number | null;

  averageListPricePerSqft: number | null;
  medianListPricePerSqft: number | null;

  averageListPricePerSqm: number | null;
  medianListPricePerSqm: number | null;

medianActiveDom: number | null;

  activeListingIds: string | null;
  pendingListingIds: string | null;
  allListingIds: string | null;

  snapshotDate: string | null;
};

export type GeographyOption = {
  name: string;
  slug: string | null;
};

export type CommunityOption = GeographyOption & {
  zoneName: string;
  zoneSlug: string | null;
  areaName: string;
  areaSlug: string | null;
};

export type DevelopmentOption = GeographyOption & {
  zoneName: string;
  zoneSlug: string | null;
  areaName: string;
  areaSlug: string | null;
  communityName: string;
  communitySlug: string | null;
};

export type PropertySearchSelectorData = {
  zones: GeographyOption[];
  areas: GeographyOption[];
  communities: CommunityOption[];
  developments: DevelopmentOption[];
};

export type PropertySearchPageData = {
  displayMode: PropertySearchDisplayMode;
  summary: PropertySearchSummary;
  rows: FilteredSnapshotRow[];
  selectors: PropertySearchSelectorData;
  snapshotDate: string | null;
};

type CurrentListingGeographyRow = {
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;
};

export async function getPropertySearchPageData(
  filters: PropertySearchFilters
): Promise<PropertySearchPageData> {
  const displayMode = getPropertySearchDisplayMode(filters);

  /*
    Run the summary, grouped snapshot and selector queries concurrently.

    The summary and grouped snapshot both use the same canonical
    filtered_property_snapshot function, so all visible counts and
    statistics are based on the same filtered listing population.
  */
  const [summaryResult, rowsResult, selectors] = await Promise.all([
    getFilteredSnapshot("summary", filters),
    getFilteredSnapshot(displayMode, filters),
    getPropertySearchSelectorData(filters),
  ]);

  const summaryRow = summaryResult[0] ?? null;

  const summary: PropertySearchSummary = {
    activeCount: Number(summaryRow?.active_count ?? 0),
    pendingCount: Number(summaryRow?.pending_count ?? 0),
    totalCount: Number(summaryRow?.total_count ?? 0),

    averageListPrice: nullableNumber(
      summaryRow?.average_list_price
    ),

    medianListPrice: nullableNumber(
      summaryRow?.median_list_price
    ),

    averageListPricePerSqft: nullableNumber(
      summaryRow?.average_list_price_per_sqft
    ),

    medianListPricePerSqft: nullableNumber(
      summaryRow?.median_list_price_per_sqft
    ),

    averageListPricePerSqm: nullableNumber(
      summaryRow?.average_list_price_per_sqm
    ),

    medianListPricePerSqm: nullableNumber(
      summaryRow?.median_list_price_per_sqm
    ),

    medianActiveDom: nullableNumber(
      summaryRow?.median_active_dom
    ),

    activeListingIds: summaryRow?.active_listing_ids ?? null,
    pendingListingIds: summaryRow?.pending_listing_ids ?? null,
    allListingIds: summaryRow?.all_listing_ids ?? null,

    snapshotDate: summaryRow?.snapshot_date ?? null,
  };

  return {
    displayMode,
    summary,
    rows: rowsResult,
    selectors,
    snapshotDate:
      summary.snapshotDate ??
      rowsResult.find((row) => row.snapshot_date)?.snapshot_date ??
      null,
  };
}

export function getPropertySearchDisplayMode(
  filters: PropertySearchFilters
): PropertySearchDisplayMode {
  if (filters.community) {
    return "development";
  }

  if (filters.area) {
    return "community";
  }

  return "area";
}

async function getFilteredSnapshot(
  groupLevel: "summary" | PropertySearchDisplayMode,
  filters: PropertySearchFilters
): Promise<FilteredSnapshotRow[]> {
  const rpcParams = buildFilteredSnapshotRpcParams(groupLevel, filters);

  const { data, error } = await supabase.rpc(
    "filtered_property_snapshot",
    rpcParams
  );

  if (error) {
    throw new Error(
      `Unable to load ${groupLevel} property snapshot: ${error.message}`
    );
  }

  return ((data ?? []) as FilteredSnapshotRow[]).map(normalizeSnapshotRow);
}

/*
  Selector options intentionally come from current_search_listing rather
  than the historical snapshot views.

  This keeps the Search Properties selectors aligned with the new current
  Active/Pending search engine.
*/
async function getPropertySearchSelectorData(
  filters: PropertySearchFilters
): Promise<PropertySearchSelectorData> {
  const pageSize = 1000;
  const rows: CurrentListingGeographyRow[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("current_search_listing")
      .select(
        "zone_name, area_name, community_name, development_name"
      )
      .range(from, from + pageSize - 1);

    if (filters.market !== "all") {
      query = query.eq("market_segment", filters.market);
    }

    if (filters.propertyType !== "all") {
      query = query.eq(
        "property_type_segment",
        filters.propertyType
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Unable to load property-search selector options: ${error.message}`
      );
    }

    const pageRows =
      (data ?? []) as CurrentListingGeographyRow[];

    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      break;
    }
  }

  const zones = uniqueGeographyOptions(
    rows
      .map((row) => row.zone_name)
      .filter(isNonEmptyString)
  );

  const areas = uniqueGeographyOptions(
    rows
      .filter(
        (row) =>
          !filters.zone ||
          row.zone_name === filters.zone
      )
      .map((row) => row.area_name)
      .filter(isNonEmptyString)
  );

  const communities = uniqueCommunityOptions(
    rows
      .filter(
        (row) =>
          Boolean(filters.area) &&
          (!filters.zone || row.zone_name === filters.zone) &&
          row.area_name === filters.area
      )
      .filter(
        (
          row
        ): row is CurrentListingGeographyRow & {
          zone_name: string;
          area_name: string;
          community_name: string;
        } =>
          isNonEmptyString(row.zone_name) &&
          isNonEmptyString(row.area_name) &&
          isNonEmptyString(row.community_name)
      )
      .map((row) => ({
        name: row.community_name,
        slug: slugify(row.community_name),

        zoneName: row.zone_name,
        zoneSlug: slugify(row.zone_name),

        areaName: row.area_name,
        areaSlug: slugify(row.area_name),
      }))
  );

  const developments = uniqueDevelopmentOptions(
    rows
      .filter(
        (row) =>
          Boolean(filters.community) &&
          (!filters.zone || row.zone_name === filters.zone) &&
          (!filters.area || row.area_name === filters.area) &&
          row.community_name === filters.community
      )
      .filter(
        (
          row
        ): row is CurrentListingGeographyRow & {
          zone_name: string;
          area_name: string;
          community_name: string;
          development_name: string;
        } =>
          isNonEmptyString(row.zone_name) &&
          isNonEmptyString(row.area_name) &&
          isNonEmptyString(row.community_name) &&
          isNonEmptyString(row.development_name)
      )
      .map((row) => ({
        name: row.development_name,
        slug: slugify(row.development_name),

        zoneName: row.zone_name,
        zoneSlug: slugify(row.zone_name),

        areaName: row.area_name,
        areaSlug: slugify(row.area_name),

        communityName: row.community_name,
        communitySlug: slugify(row.community_name),
      }))
  );

  return {
    zones,
    areas,
    communities,
    developments,
  };
}

function normalizeSnapshotRow(
  row: FilteredSnapshotRow
): FilteredSnapshotRow {
  return {
    ...row,

    active_count: Number(row.active_count ?? 0),
    pending_count: Number(row.pending_count ?? 0),
    total_count: Number(row.total_count ?? 0),

    average_list_price: nullableNumber(
      row.average_list_price
    ),

    median_list_price: nullableNumber(
      row.median_list_price
    ),

    average_list_price_per_sqft: nullableNumber(
      row.average_list_price_per_sqft
    ),

    median_list_price_per_sqft: nullableNumber(
      row.median_list_price_per_sqft
    ),

    average_list_price_per_sqm: nullableNumber(
      row.average_list_price_per_sqm
    ),

    median_list_price_per_sqm: nullableNumber(
      row.median_list_price_per_sqm
    ),

    median_active_dom: nullableNumber(
      row.median_active_dom
    ),
  };
}

function uniqueGeographyOptions(
  names: string[]
): GeographyOption[] {
  return Array.from(new Set(names))
    .map((name) => ({
      name,
      slug: slugify(name),
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, "en", {
        sensitivity: "base",
        numeric: true,
      })
    );
}

function uniqueCommunityOptions(
  options: CommunityOption[]
): CommunityOption[] {
  return Array.from(
    new Map(
      options.map((option) => [
        [
          option.zoneName,
          option.areaName,
          option.name,
        ].join("|"),
        option,
      ])
    ).values()
  ).sort((a, b) =>
    a.name.localeCompare(b.name, "en", {
      sensitivity: "base",
      numeric: true,
    })
  );
}

function uniqueDevelopmentOptions(
  options: DevelopmentOption[]
): DevelopmentOption[] {
  return Array.from(
    new Map(
      options.map((option) => [
        [
          option.zoneName,
          option.areaName,
          option.communityName,
          option.name,
        ].join("|"),
        option,
      ])
    ).values()
  ).sort((a, b) =>
    a.name.localeCompare(b.name, "en", {
      sensitivity: "base",
      numeric: true,
    })
  );
}

function nullableNumber(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isNonEmptyString(
  value: string | null | undefined
): value is string {
  return Boolean(value?.trim());
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}