import { supabase } from "@/lib/supabase";

export type BuyerRegion = "all" | "pv" | "nayarit";
export type BuyerPropertyType = "all" | "condos" | "houses";

export type BuyerExplorerCriteria = {
  maxPrice: number;
  propertyType: BuyerPropertyType;
  minBeds: number;
  region: BuyerRegion;
};

type ListingRow = {
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;
  listing_status: string | null;
  market_segment: string | null;
  preconstruction_fl: boolean | null;
  current_price: number | null;
  mls: string | number | null;
};

export type BuyerAreaResult = {
  name: string;
  areaName: string | null;
  zoneName: string | null;
  resaleCount: number;
  activeCount: number;
  pendingCount: number;
  preconstructionDevelopmentCount: number;
  preconstructionListingCount: number;
  rawListingCount: number;
  totalChoices: number;
  tier: "more" | "some" | "limited";
  longitude: number | null;
  latitude: number | null;
};

export type BuyerExplorerDistributionBucket = {
  label: string;
  min: number;
  max: number | null;
  communityCount: number;
};

export type BuyerExplorerResult = {
  areas: BuyerAreaResult[];
  resaleCount: number;
  preconstructionDevelopmentCount: number;
  preconstructionListingCount: number;
  rawListingCount: number;
  totalChoiceCount: number;
  totalAreaCount: number;
  tierThresholds: { moreMin: number; someMin: number };
  tierCounts: { more: number; some: number; limited: number };
  distribution: BuyerExplorerDistributionBucket[];
};

export async function getBuyerExplorerResult(
  criteria: BuyerExplorerCriteria,
): Promise<BuyerExplorerResult> {
  const pageSize = 1000;
  const rows: ListingRow[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("current_search_listing")
      .select(
        "zone_name,area_name,community_name,development_name,listing_status,market_segment,preconstruction_fl,current_price,mls",
      )
      .lte("current_price", criteria.maxPrice)
      .gte("beds", criteria.minBeds)
      .range(from, from + pageSize - 1);

    if (criteria.propertyType !== "all") {
      query = query.eq("property_type_segment", criteria.propertyType);
    }

    if (criteria.region === "pv") {
      query = query.ilike("zone_name", "%Puerto Vallarta%");
    } else if (criteria.region === "nayarit") {
      query = query.or(
        "zone_name.ilike.%Nayarit%,zone_name.ilike.%RN%",
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Unable to load Buyer Explorer data: ${error.message}`);
    }

    const page = (data ?? []) as ListingRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  // For the combined market, keep the scope to the two markets SearchPV serves.
  const scoped = rows.filter((row) => {
    if (criteria.region !== "all") return true;
    const zone = (row.zone_name ?? "").toLowerCase();
    return zone.includes("puerto vallarta") || zone.includes("nayarit") || zone === "pv" || zone === "rn";
  });

  const groups = new Map<string, {
    name: string;
    areaName: string | null;
    zoneName: string | null;
    resaleCount: number;
    activeCount: number;
    pendingCount: number;
    optionKeys: Set<string>;
    preconDevelopments: Set<string>;
    preconstructionListingCount: number;
    rawListingCount: number;
  }>();

  const allPreconDevelopments = new Set<string>();
  let resaleCount = 0;
  let preconstructionListingCount = 0;

  for (const row of scoped) {
    const name = clean(row.community_name) ?? clean(row.area_name);
    if (!name) continue;

    const key = `${row.zone_name ?? ""}|${row.area_name ?? ""}|${name}`;
    const group = groups.get(key) ?? {
      name,
      areaName: clean(row.area_name),
      zoneName: clean(row.zone_name),
      resaleCount: 0,
      activeCount: 0,
      pendingCount: 0,
      optionKeys: new Set<string>(),
      preconDevelopments: new Set<string>(),
      preconstructionListingCount: 0,
      rawListingCount: 0,
    };

    group.rawListingCount += 1;

    // Buyer Explorer measures distinct high-level choices, not raw MLS rows.
    // Any named development counts once within a community, regardless of
    // resale/pre-construction status or how many matching units it contains.
    // A listing without a usable development name remains its own option.
    const development = clean(row.development_name);
    const choiceKey = development
      ? `development:${normalize(development)}`
      : `listing:${String(row.mls ?? `unknown-${group.rawListingCount}`)}`;
    group.optionKeys.add(choiceKey);

    const isPrecon = row.preconstruction_fl === true || row.market_segment === "pre_construction";
    if (isPrecon) {
      group.preconstructionListingCount += 1;
      preconstructionListingCount += 1;
      if (development) {
        const developmentKey = `development:${normalize(development)}`;
        group.preconDevelopments.add(developmentKey);
        allPreconDevelopments.add(`${row.zone_name ?? ""}|${row.area_name ?? ""}|${name}|${developmentKey}`);
      }
    } else {
      group.resaleCount += 1;
      resaleCount += 1;
    }

    if (row.listing_status === "active") group.activeCount += 1;
    if (row.listing_status === "pending") group.pendingCount += 1;

    groups.set(key, group);
  }

  const ranked = [...groups.values()]
    .map((group) => ({
      ...group,
      totalChoices: group.optionKeys.size,
    }))
    .filter((group) => group.totalChoices > 0)
    .sort((a, b) => b.totalChoices - a.totalChoices || b.resaleCount - a.resaleCount);

  // V4: availability bands adapt to the distribution of THIS search.
  // Availability bands scale to the strongest community in this search.
  // This keeps the labels meaningful across broad and restrictive searches:
  // More = at least 40% of the maximum; Some = at least 15%; Limited = below that.
  const maxChoices = ranked[0]?.totalChoices ?? 0;
  const moreMin = Math.max(2, Math.ceil(maxChoices * 0.40));
  const someMin = Math.max(2, Math.min(moreMin - 1, Math.ceil(maxChoices * 0.15)));

  const areas: BuyerAreaResult[] = ranked.map((group) => {
    const tier: BuyerAreaResult["tier"] =
      group.totalChoices >= moreMin
        ? "more"
        : group.totalChoices >= someMin
          ? "some"
          : "limited";

    return {
      name: group.name,
      areaName: group.areaName,
      zoneName: group.zoneName,
      resaleCount: group.resaleCount,
      activeCount: group.activeCount,
      pendingCount: group.pendingCount,
      preconstructionDevelopmentCount: group.preconDevelopments.size,
      preconstructionListingCount: group.preconstructionListingCount,
      rawListingCount: group.rawListingCount,
      totalChoices: group.totalChoices,
      tier,
      longitude: null,
      latitude: null,
    };
  });

  // V6: resolve representative SearchPV geography points only for the
  // communities that are actually shown in the three result columns.
  // This keeps Get Your Bearings lightweight while grounding markers in
  // SearchPV's geo.entity coordinates rather than hand-placed map points.
  const visibleAreas = [
    ...areas.filter((area) => area.tier === "more").slice(0, 6),
    ...areas.filter((area) => area.tier === "some").slice(0, 6),
    ...areas.filter((area) => area.tier === "limited").slice(0, 6),
  ];

  await Promise.all(visibleAreas.map(async (area) => {
    const { data, error } = await supabase.rpc("resolve_geography", {
      p_search: area.name,
      p_expected_entity_type_cd: "CM",
      p_limit: 10,
    });
    if (error || !Array.isArray(data)) return;

    const candidates = data as Array<{
      canonical_nm: string | null;
      longitude_nb: number | string | null;
      latitude_nb: number | string | null;
      hierarchy_js: unknown;
    }>;

    const normalizedName = normalize(area.name);
    const match = candidates.find((candidate) =>
      candidate.canonical_nm && normalize(candidate.canonical_nm) === normalizedName &&
      hierarchyMentions(candidate.hierarchy_js, area.areaName, area.zoneName)
    ) ?? candidates.find((candidate) =>
      candidate.canonical_nm && normalize(candidate.canonical_nm) === normalizedName
    ) ?? candidates[0];

    const longitude = Number(match?.longitude_nb);
    const latitude = Number(match?.latitude_nb);
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
      area.longitude = longitude;
      area.latitude = latitude;
    }
  }));

  const tierCounts = {
    more: areas.filter((area) => area.tier === "more").length,
    some: areas.filter((area) => area.tier === "some").length,
    limited: areas.filter((area) => area.tier === "limited").length,
  };

  return {
    areas,
    resaleCount,
    preconstructionDevelopmentCount: allPreconDevelopments.size,
    preconstructionListingCount,
    rawListingCount: scoped.length,
    totalChoiceCount: areas.reduce((sum, area) => sum + area.totalChoices, 0),
    totalAreaCount: areas.length,
    tierThresholds: { moreMin, someMin },
    tierCounts,
    distribution: buildDistribution(areas.map((area) => area.totalChoices)),
  };
}

function buildDistribution(counts: number[]): BuyerExplorerDistributionBucket[] {
  const specs = [
    { label: "20+", min: 20, max: null },
    { label: "15–19", min: 15, max: 19 },
    { label: "10–14", min: 10, max: 14 },
    { label: "7–9", min: 7, max: 9 },
    { label: "4–6", min: 4, max: 6 },
    { label: "2–3", min: 2, max: 3 },
    { label: "1", min: 1, max: 1 },
  ];

  return specs.map((spec) => ({
    ...spec,
    communityCount: counts.filter((count) =>
      count >= spec.min && (spec.max === null || count <= spec.max),
    ).length,
  }));
}

function hierarchyMentions(
  hierarchy: unknown,
  areaName: string | null,
  zoneName: string | null,
): boolean {
  if (!hierarchy) return false;
  const text = JSON.stringify(hierarchy).toLowerCase();
  const expected = [areaName, zoneName].filter(Boolean).map((value) => normalize(String(value)));
  return expected.length === 0 || expected.some((value) => text.includes(value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function clean(value: string | null): string | null {
  const result = value?.trim();
  return result ? result : null;
}
