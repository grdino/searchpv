import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

type PropertyTypeFilter =
  | "all"
  | "condo"
  | "house";

type MarketTypeFilter =
  | "all"
  | "resale"
  | "precon";

type BedroomFilter =
  | "all"
  | "0br"
  | "1br"
  | "2br"
  | "3br_plus";

type GeographyEntityDetail = {
  entity?: {
    entity_ky?: number;
    entity_type_cd?: string;
    entity_identifier_cd?: string;

    longitude_nb?: number | null;
    latitude_nb?: number | null;
  };

  parent?: {
    entity_ky?: number;
    canonical_nm?: string;
    entity_type_cd?: string;
  };

  canonical?: {
    entity_variant_nm?: string;
  };
};

type DevelopmentSnapshotRow = {
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development_name: string | null;

  snapshot_date: string | null;

  market_segment: string;
  property_type_segment: string;

  property_count: number;
  condo_property_count: number;
  house_property_count: number;

  /*
   * Overall activity.
   */
  active_count: number;
  pending_count: number;
  sales_12mo: number;

  /*
   * Bedroom activity.
   */
  active_0br: number;
  active_1br: number;
  active_2br: number;
  active_3br_plus: number;

  pending_0br: number;
  pending_1br: number;
  pending_2br: number;
  pending_3br_plus: number;

  sales_0br_12mo: number;
  sales_1br_12mo: number;
  sales_2br_12mo: number;
  sales_3br_plus_12mo: number;

  /*
   * Overall active pricing.
   */
  avg_list_price: number | null;
  median_list_price: number | null;

  avg_list_price_ft2: number | null;
  median_list_price_ft2: number | null;

  avg_list_price_m2: number | null;
  median_list_price_m2: number | null;

  /*
   * Active list price by bedroom.
   */
  avg_list_price_0br: number | null;
  median_list_price_0br: number | null;

  avg_list_price_1br: number | null;
  median_list_price_1br: number | null;

  avg_list_price_2br: number | null;
  median_list_price_2br: number | null;

  avg_list_price_3br_plus: number | null;
  median_list_price_3br_plus: number | null;

  /*
   * Active $/ft² by bedroom.
   */
  avg_list_price_ft2_0br: number | null;
  median_list_price_ft2_0br: number | null;

  avg_list_price_ft2_1br: number | null;
  median_list_price_ft2_1br: number | null;

  avg_list_price_ft2_2br: number | null;
  median_list_price_ft2_2br: number | null;

  avg_list_price_ft2_3br_plus: number | null;
  median_list_price_ft2_3br_plus: number | null;

  /*
   * Active $/m² by bedroom.
   */
  avg_list_price_m2_0br: number | null;
  median_list_price_m2_0br: number | null;

  avg_list_price_m2_1br: number | null;
  median_list_price_m2_1br: number | null;

  avg_list_price_m2_2br: number | null;
  median_list_price_m2_2br: number | null;

  avg_list_price_m2_3br_plus: number | null;
  median_list_price_m2_3br_plus: number | null;

  /*
   * Current DOM.
   *
   * Currently available only for the overall population.
   */
  current_avg_dom: number | null;

  /*
   * Overall sold pricing.
   */
  avg_sold_price: number | null;
  median_sold_price: number | null;

  avg_sold_price_ft2: number | null;
  median_sold_price_ft2: number | null;

  avg_sold_price_m2: number | null;
  median_sold_price_m2: number | null;

  /*
   * Sold pricing by bedroom.
   */
  avg_sold_price_0br: number | null;
  avg_sold_price_1br: number | null;
  avg_sold_price_2br: number | null;
  avg_sold_price_3br_plus: number | null;

  median_sold_price_0br: number | null;
  median_sold_price_1br: number | null;
  median_sold_price_2br: number | null;
  median_sold_price_3br_plus: number | null;

  avg_sold_price_ft2_0br: number | null;
  avg_sold_price_ft2_1br: number | null;
  avg_sold_price_ft2_2br: number | null;
  avg_sold_price_ft2_3br_plus: number | null;

  median_sold_price_ft2_0br: number | null;
  median_sold_price_ft2_1br: number | null;
  median_sold_price_ft2_2br: number | null;
  median_sold_price_ft2_3br_plus: number | null;

  avg_sold_price_m2_0br: number | null;
  avg_sold_price_m2_1br: number | null;
  avg_sold_price_m2_2br: number | null;
  avg_sold_price_m2_3br_plus: number | null;

  median_sold_price_m2_0br: number | null;
  median_sold_price_m2_1br: number | null;
  median_sold_price_m2_2br: number | null;
  median_sold_price_m2_3br_plus: number | null;

  sold_avg_dom_12mo: number | null;

  /*
   * Inventory.
   */
  months_inventory: number | null;

  months_inventory_0br: number | null;
  months_inventory_1br: number | null;
  months_inventory_2br: number | null;
  months_inventory_3br_plus: number | null;

  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
};

type DevelopmentNearbyRollup = {
  walkability_score: number | null;
  walkability_label: string | null;
  walkability_summary: string | null;
  lifestyle_summary: string | null;

  restaurant_count: number | null;
  cafe_count: number | null;
  bar_count: number | null;
  grocery_count: number | null;
  pharmacy_count: number | null;
  gallery_count: number | null;
  gym_count: number | null;
  park_count: number | null;

  nearest_beach_m: number | null;
  nearest_grocery_m: number | null;
  nearest_pharmacy_m: number | null;
  nearest_hospital_urgent_care_m: number | null;
};

type DevelopmentNearbyPlace = {
  place_ky: number;
  place_category: string;
  place_name: string;

  distance_m: number | null;
  walk_minutes: number | null;

  display_order: number | null;
  is_highlight: boolean | null;

  why_it_matters: string | null;
};

/*
 * ============================================================
 * ENTITY IDENTIFIER → DEVELOPMENT HIERARCHY
 * ============================================================
 */

function identifierPartToSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      "-",
    );
}

function parseDevelopmentIdentifier(
  identifier: string,
) {
  const parts =
    identifier.split("__");

  if (
    parts.length < 5 ||
    parts[0] !== "dv"
  ) {
    return null;
  }

  const [
    ,
    zonePart,
    areaPart,
    communityPart,
    ...developmentParts
  ] = parts;

  const developmentPart =
    developmentParts.join(
      "__",
    );

  if (
    !zonePart ||
    !areaPart ||
    !communityPart ||
    !developmentPart
  ) {
    return null;
  }

  return {
    zoneSlug:
      identifierPartToSlug(
        zonePart,
      ),

    areaSlug:
      identifierPartToSlug(
        areaPart,
      ),

    communitySlug:
      identifierPartToSlug(
        communityPart,
      ),

    developmentSlug:
      identifierPartToSlug(
        developmentPart,
      ),
  };
}

function parseListingIds(
  value: string | null | undefined,
): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((id) =>
      Number(id.trim()),
    )
    .filter((id) =>
      Number.isFinite(id),
    );
}

export async function GET(
  request: NextRequest,
) {
  /*
   * ==========================================================
   * PARAMETERS
   * ==========================================================
   */

  const entityKy =
    Number(
      request.nextUrl.searchParams.get(
        "entityKy",
      ),
    );

  const propertyType =
    (
      request.nextUrl.searchParams.get(
        "propertyType",
      ) ??
      "all"
    ) as PropertyTypeFilter;

  const marketType =
    (
      request.nextUrl.searchParams.get(
        "marketType",
      ) ??
      "all"
    ) as MarketTypeFilter;

  const bedroom =
    (
      request.nextUrl.searchParams.get(
        "bedroom",
      ) ??
      "all"
    ) as BedroomFilter;

  /*
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */

  if (
    !Number.isFinite(
      entityKy,
    ) ||
    entityKy <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid entityKy.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    ![
      "all",
      "condo",
      "house",
    ].includes(
      propertyType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid propertyType.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    ![
      "all",
      "resale",
      "precon",
    ].includes(
      marketType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid marketType.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    ![
      "all",
      "0br",
      "1br",
      "2br",
      "3br_plus",
    ].includes(
      bedroom,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid bedroom.",
      },
      {
        status: 400,
      },
    );
  }

  const supabase =
    await createClient();

  /*
   * ==========================================================
   * RESOLVE DEVELOPMENT ENTITY
   * ==========================================================
   */

  const {
    data: geographyData,
    error: geographyError,
  } = await supabase.rpc(
    "geography_entity_detail",
    {
      p_entity_ky:
        entityKy,
    },
  );

  if (geographyError) {
    console.error(
      "Unable to resolve Atlas development:",
      geographyError,
    );

    return NextResponse.json(
      {
        error:
          geographyError.message,
      },
      {
        status: 500,
      },
    );
  }

  if (!geographyData) {
    return NextResponse.json(
      {
        error:
          "Development entity not found.",
      },
      {
        status: 404,
      },
    );
  }

  const geography =
    geographyData as GeographyEntityDetail;

  const entity =
    geography.entity;

  if (
    !entity ||
    entity.entity_type_cd !==
      "DV"
  ) {
    return NextResponse.json(
      {
        error:
          "The selected Atlas entity is not a development.",
      },
      {
        status: 400,
      },
    );
  }

  const identifier =
    entity.entity_identifier_cd;

  if (!identifier) {
    return NextResponse.json(
      {
        error:
          "Development entity does not have an identifier.",
      },
      {
        status: 404,
      },
    );
  }

  const hierarchy =
    parseDevelopmentIdentifier(
      identifier,
    );

  if (!hierarchy) {
    console.error(
      "Unable to parse Atlas development identifier:",
      identifier,
    );

    return NextResponse.json(
      {
        error:
          "Unable to resolve the development hierarchy.",
      },
      {
        status: 500,
      },
    );
  }

  /*
 * ==========================================================
 * DEVELOPMENT NEARBY
 * ==========================================================
 *
 * Nearby information describes the physical development
 * location, so it does not depend on Property / Market /
 * Bedroom filters.
 */

const {
  data: nearbyRollupData,
  error: nearbyRollupError,
} = await supabase
  .from(
    "development_nearby_rollup",
  )
  .select(
    `
      walkability_score,
      walkability_label,
      walkability_summary,
      lifestyle_summary,

      restaurant_count,
      cafe_count,
      bar_count,
      grocery_count,
      pharmacy_count,
      gallery_count,
      gym_count,
      park_count,

      nearest_beach_m,
      nearest_grocery_m,
      nearest_pharmacy_m,
      nearest_hospital_urgent_care_m
    `,
  )
  .eq(
    "zone_slug",
    hierarchy.zoneSlug,
  )
  .eq(
    "area_slug",
    hierarchy.areaSlug,
  )
  .eq(
    "community_slug",
    hierarchy.communitySlug,
  )
  .eq(
    "development_slug",
    hierarchy.developmentSlug,
  )
  .maybeSingle();

if (nearbyRollupError) {
  console.error(
    "Unable to load development nearby rollup:",
    {
      entityKy,
      hierarchy,
      error:
        nearbyRollupError,
    },
  );
}

const {
  data: nearbyPlacesData,
  error: nearbyPlacesError,
} = await supabase
  .from(
    "development_nearby",
  )
  .select(
    `
      place_ky,
      place_category,
      place_name,

      distance_m,
      walk_minutes,

      is_highlight,
      why_it_matters

    `,
  )
  .eq(
    "zone_slug",
    hierarchy.zoneSlug,
  )
  .eq(
    "area_slug",
    hierarchy.areaSlug,
  )
  .eq(
    "community_slug",
    hierarchy.communitySlug,
  )
  .eq(
    "development_slug",
    hierarchy.developmentSlug,
  )
  .order(
    "display_order",
    {
      ascending: true,
    },
  )
  .order(
    "distance_m",
    {
      ascending: true,
    },
  );

if (nearbyPlacesError) {
  console.error(
    "Unable to load development nearby places:",
    {
      entityKy,
      hierarchy,
      error:
        nearbyPlacesError,
    },
  );
}

const nearbyRollup =
  nearbyRollupData as
    | DevelopmentNearbyRollup
    | null;

const nearbyPlaces =
  (
    nearbyPlacesData ??
    []
  ) as DevelopmentNearbyPlace[];

  /*
   * ==========================================================
   * MAP ATLAS FILTER VALUES
   * ==========================================================
   */

  const propertyTypeSegment =
    propertyType ===
    "condo"
      ? "condos"
      : propertyType ===
          "house"
        ? "houses"
        : "all";

  const marketSegment =
    marketType ===
    "precon"
      ? "pre_construction"
      : marketType;

  /*
 * ==========================================================
 * DEVELOPMENT LISTING POPULATIONS
 * ==========================================================
 *
 * These are the exact MLS populations behind the Active,
 * Pending, and Sold 12 Mo development metrics.
 */

const {
  data: drilldownData,
  error: drilldownError,
} = await supabase
  .from(
    "development_listing_drilldown",
  )
  .select(
    `
      metric_group,
      listing_count,
      listing_ids
    `,
  )
  .eq(
    "zone_slug",
    hierarchy.zoneSlug,
  )
  .eq(
    "area_slug",
    hierarchy.areaSlug,
  )
  .eq(
    "community_slug",
    hierarchy.communitySlug,
  )
  .eq(
    "development_slug",
    hierarchy.developmentSlug,
  )
  .eq(
    "property_type_segment",
    propertyTypeSegment,
  )
  .eq(
    "market_segment",
    marketSegment,
  )
  .eq(
    "bedroom_segment",
    bedroom,
  )
  .in(
    "metric_group",
    [
      "active",
      "pending",
      "sold_12mo",
    ],
  );

if (drilldownError) {
  console.error(
    "Unable to load Atlas development listing populations:",
    {
      entityKy,
      identifier,
      hierarchy,
      propertyTypeSegment,
      marketSegment,
      bedroom,
      error:
        drilldownError,
    },
  );

  return NextResponse.json(
    {
      error:
        drilldownError.message,
    },
    {
      status: 500,
    },
  );
}

const activeDrilldown =
  drilldownData?.find(
    (item) =>
      item.metric_group ===
      "active",
  );

const pendingDrilldown =
  drilldownData?.find(
    (item) =>
      item.metric_group ===
      "pending",
  );

const soldDrilldown =
  drilldownData?.find(
    (item) =>
      item.metric_group ===
      "sold_12mo",
  );

const activeMls =
  parseListingIds(
    activeDrilldown
      ?.listing_ids,
  );

const pendingMls =
  parseListingIds(
    pendingDrilldown
      ?.listing_ids,
  );

const closedMls =
  parseListingIds(
    soldDrilldown
      ?.listing_ids,
  );

  /*
   * ==========================================================
   * DEVELOPMENT SNAPSHOT
   * ==========================================================
   */

  const {
    data,
    error,
  } = await supabase
    .from(
      "development_snapshot",
    )
    .select(
      `
        zone_name,
        area_name,
        community_name,
        development_name,
        snapshot_date,

        market_segment,
        property_type_segment,

        property_count,
        condo_property_count,
        house_property_count,

        active_count,
        pending_count,

        active_0br,
        active_1br,
        active_2br,
        active_3br_plus,

        pending_0br,
        pending_1br,
        pending_2br,
        pending_3br_plus,

        sales_12mo,
        sales_0br_12mo,
        sales_1br_12mo,
        sales_2br_12mo,
        sales_3br_plus_12mo,

        avg_list_price,
        median_list_price,

        avg_list_price_ft2,
        median_list_price_ft2,

        avg_list_price_m2,
        median_list_price_m2,

        avg_list_price_0br,
        median_list_price_0br,

        avg_list_price_1br,
        median_list_price_1br,

        avg_list_price_2br,
        median_list_price_2br,

        avg_list_price_3br_plus,
        median_list_price_3br_plus,

        avg_list_price_ft2_0br,
        median_list_price_ft2_0br,

        avg_list_price_ft2_1br,
        median_list_price_ft2_1br,

        avg_list_price_ft2_2br,
        median_list_price_ft2_2br,

        avg_list_price_ft2_3br_plus,
        median_list_price_ft2_3br_plus,

        avg_list_price_m2_0br,
        median_list_price_m2_0br,

        avg_list_price_m2_1br,
        median_list_price_m2_1br,

        avg_list_price_m2_2br,
        median_list_price_m2_2br,

        avg_list_price_m2_3br_plus,
        median_list_price_m2_3br_plus,

        current_avg_dom,

        avg_sold_price,
        avg_sold_price_0br,
        avg_sold_price_1br,
        avg_sold_price_2br,
        avg_sold_price_3br_plus,

        median_sold_price,
        median_sold_price_0br,
        median_sold_price_1br,
        median_sold_price_2br,
        median_sold_price_3br_plus,

        avg_sold_price_ft2,
        avg_sold_price_ft2_0br,
        avg_sold_price_ft2_1br,
        avg_sold_price_ft2_2br,
        avg_sold_price_ft2_3br_plus,

        median_sold_price_ft2,
        median_sold_price_ft2_0br,
        median_sold_price_ft2_1br,
        median_sold_price_ft2_2br,
        median_sold_price_ft2_3br_plus,

        avg_sold_price_m2,
        avg_sold_price_m2_0br,
        avg_sold_price_m2_1br,
        avg_sold_price_m2_2br,
        avg_sold_price_m2_3br_plus,

        median_sold_price_m2,
        median_sold_price_m2_0br,
        median_sold_price_m2_1br,
        median_sold_price_m2_2br,
        median_sold_price_m2_3br_plus,

        sold_avg_dom_12mo,

        months_inventory,
        months_inventory_0br,
        months_inventory_1br,
        months_inventory_2br,
        months_inventory_3br_plus,

        zone_slug,
        area_slug,
        community_slug,
        development_slug
      `,
    )
    .eq(
      "zone_slug",
      hierarchy.zoneSlug,
    )
    .eq(
      "area_slug",
      hierarchy.areaSlug,
    )
    .eq(
      "community_slug",
      hierarchy.communitySlug,
    )
    .eq(
      "development_slug",
      hierarchy.developmentSlug,
    )
    .eq(
      "property_type_segment",
      propertyTypeSegment,
    )
    .eq(
      "market_segment",
      marketSegment,
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load Atlas development snapshot:",
      {
        entityKy,
        identifier,
        hierarchy,
        propertyTypeSegment,
        marketSegment,
        bedroom,
        error,
      },
    );

    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      },
    );
  }

  /*
  * ==========================================================
  * EMPTY FILTER COMBINATION
  * ==========================================================
  *
  * development_snapshot intentionally omits combinations with
  * no Active, Pending, or Sold-12-month activity.
  *
  * In Atlas, however, that is a valid market result rather than
  * an application error.
  *
  * Example:
  *
  * AVIDA + Pre-Con
  *
  * If AVIDA has no current/recent pre-construction activity,
  * Atlas should display:
  *
  * Active      0
  * Pending     0
  * Sold 12 Mo  0
  *
  * with unavailable pricing metrics shown as —.
  *
  * Load the all/all development row only to preserve the
  * development identity and property counts.
  * ==========================================================
  */

  if (!data) {
    const {
      data: baselineData,
      error: baselineError,
    } = await supabase
      .from(
        "development_snapshot",
      )
      .select(
        `
          zone_name,
          area_name,
          community_name,
          development_name,

          snapshot_date,

          property_count,
          condo_property_count,
          house_property_count
        `,
      )
      .eq(
        "zone_slug",
        hierarchy.zoneSlug,
      )
      .eq(
        "area_slug",
        hierarchy.areaSlug,
      )
      .eq(
        "community_slug",
        hierarchy.communitySlug,
      )
      .eq(
        "development_slug",
        hierarchy.developmentSlug,
      )
      .eq(
        "property_type_segment",
        "all",
      )
      .eq(
        "market_segment",
        "all",
      )
      .maybeSingle();

    if (baselineError) {
      console.error(
        "Unable to load Atlas development baseline:",
        baselineError,
      );

      return NextResponse.json(
        {
          error:
            baselineError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
    * If even the baseline row does not exist, then we truly
    * do not have reporting data for this development.
    */
    if (!baselineData) {
      return NextResponse.json(
        {
          error:
            "No development snapshot is available.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      entityKy,

      sourceType:
        "development",

      developmentName:
        baselineData.development_name ??
        geography.canonical
          ?.entity_variant_nm ??
        null,

      zoneName:
        baselineData.zone_name,

      areaName:
        baselineData.area_name,

      communityName:
        baselineData.community_name,

      longitude:
        entity.longitude_nb ??
        null,

      latitude:
        entity.latitude_nb ??
        null,

      snapshotDate:
        baselineData.snapshot_date,

      propertyType,

      marketType,

      bedroom,

      /*
      * These describe the development itself and therefore
      * remain useful even when the selected market combination
      * has no listing activity.
      */
      propertyCount:
        Number(
          baselineData.property_count ??
            0,
        ),

      condoPropertyCount:
        Number(
          baselineData.condo_property_count ??
            0,
        ),

      housePropertyCount:
        Number(
          baselineData.house_property_count ??
            0,
        ),

      /*
      * Valid empty-market result.
      */
      activeCount: 0,
      activeMls: [],

      pendingCount: 0,
      pendingMls: [],

      sales12Mo: 0,
      closedMls: [],

      avgListPrice: null,

      medianListPrice: null,

      avgListPriceFt2: null,

      medianListPriceFt2: null,

      avgListPriceM2: null,

      medianListPriceM2: null,

      currentAvgDom: null,

      avgSoldPrice: null,

      medianSoldPrice: null,

      avgSoldPriceFt2: null,

      medianSoldPriceFt2: null,

      avgSoldPriceM2: null,

      medianSoldPriceM2: null,

      soldAvgDom12Mo: null,

      monthsInventory: null,
      nearby: {
        rollup:
          nearbyRollup,

        places:
          nearbyPlaces,
      },
    });
  }

  const row =
    data as DevelopmentSnapshotRow;

  /*
   * ==========================================================
   * SELECT THE APPROPRIATE BEDROOM POPULATION
   * ==========================================================
   */

  let activeCount =
    row.active_count;

  let pendingCount =
    row.pending_count;

  let sales12Mo =
    row.sales_12mo;

  let avgListPrice =
    row.avg_list_price;

  let medianListPrice =
    row.median_list_price;

  let avgListPriceFt2 =
    row.avg_list_price_ft2;

  let medianListPriceFt2 =
    row.median_list_price_ft2;

  let avgListPriceM2 =
    row.avg_list_price_m2;

  let medianListPriceM2 =
    row.median_list_price_m2;

  let avgSoldPrice =
    row.avg_sold_price;

  let medianSoldPrice =
    row.median_sold_price;

  let avgSoldPriceFt2 =
    row.avg_sold_price_ft2;

  let medianSoldPriceFt2 =
    row.median_sold_price_ft2;

  let avgSoldPriceM2 =
    row.avg_sold_price_m2;

  let medianSoldPriceM2 =
    row.median_sold_price_m2;

  let monthsInventory =
    row.months_inventory;

  if (
    bedroom ===
    "0br"
  ) {
    activeCount =
      row.active_0br;

    pendingCount =
      row.pending_0br;

    sales12Mo =
      row.sales_0br_12mo;

    avgListPrice =
      row.avg_list_price_0br;

    medianListPrice =
      row.median_list_price_0br;

    avgListPriceFt2 =
      row.avg_list_price_ft2_0br;

    medianListPriceFt2 =
      row.median_list_price_ft2_0br;

    avgListPriceM2 =
      row.avg_list_price_m2_0br;

    medianListPriceM2 =
      row.median_list_price_m2_0br;

    avgSoldPrice =
      row.avg_sold_price_0br;

    medianSoldPrice =
      row.median_sold_price_0br;

    avgSoldPriceFt2 =
      row.avg_sold_price_ft2_0br;

    medianSoldPriceFt2 =
      row.median_sold_price_ft2_0br;

    avgSoldPriceM2 =
      row.avg_sold_price_m2_0br;

    medianSoldPriceM2 =
      row.median_sold_price_m2_0br;

    monthsInventory =
      row.months_inventory_0br;
  }

  if (
    bedroom ===
    "1br"
  ) {
    activeCount =
      row.active_1br;

    pendingCount =
      row.pending_1br;

    sales12Mo =
      row.sales_1br_12mo;

    avgListPrice =
      row.avg_list_price_1br;

    medianListPrice =
      row.median_list_price_1br;

    avgListPriceFt2 =
      row.avg_list_price_ft2_1br;

    medianListPriceFt2 =
      row.median_list_price_ft2_1br;

    avgListPriceM2 =
      row.avg_list_price_m2_1br;

    medianListPriceM2 =
      row.median_list_price_m2_1br;

    avgSoldPrice =
      row.avg_sold_price_1br;

    medianSoldPrice =
      row.median_sold_price_1br;

    avgSoldPriceFt2 =
      row.avg_sold_price_ft2_1br;

    medianSoldPriceFt2 =
      row.median_sold_price_ft2_1br;

    avgSoldPriceM2 =
      row.avg_sold_price_m2_1br;

    medianSoldPriceM2 =
      row.median_sold_price_m2_1br;

    monthsInventory =
      row.months_inventory_1br;
  }

  if (
    bedroom ===
    "2br"
  ) {
    activeCount =
      row.active_2br;

    pendingCount =
      row.pending_2br;

    sales12Mo =
      row.sales_2br_12mo;

    avgListPrice =
      row.avg_list_price_2br;

    medianListPrice =
      row.median_list_price_2br;

    avgListPriceFt2 =
      row.avg_list_price_ft2_2br;

    medianListPriceFt2 =
      row.median_list_price_ft2_2br;

    avgListPriceM2 =
      row.avg_list_price_m2_2br;

    medianListPriceM2 =
      row.median_list_price_m2_2br;

    avgSoldPrice =
      row.avg_sold_price_2br;

    medianSoldPrice =
      row.median_sold_price_2br;

    avgSoldPriceFt2 =
      row.avg_sold_price_ft2_2br;

    medianSoldPriceFt2 =
      row.median_sold_price_ft2_2br;

    avgSoldPriceM2 =
      row.avg_sold_price_m2_2br;

    medianSoldPriceM2 =
      row.median_sold_price_m2_2br;

    monthsInventory =
      row.months_inventory_2br;
  }

  if (
    bedroom ===
    "3br_plus"
  ) {
    activeCount =
      row.active_3br_plus;

    pendingCount =
      row.pending_3br_plus;

    sales12Mo =
      row.sales_3br_plus_12mo;

    avgListPrice =
      row.avg_list_price_3br_plus;

    medianListPrice =
      row.median_list_price_3br_plus;

    avgListPriceFt2 =
      row.avg_list_price_ft2_3br_plus;

    medianListPriceFt2 =
      row.median_list_price_ft2_3br_plus;

    avgListPriceM2 =
      row.avg_list_price_m2_3br_plus;

    medianListPriceM2 =
      row.median_list_price_m2_3br_plus;

    avgSoldPrice =
      row.avg_sold_price_3br_plus;

    medianSoldPrice =
      row.median_sold_price_3br_plus;

    avgSoldPriceFt2 =
      row.avg_sold_price_ft2_3br_plus;

    medianSoldPriceFt2 =
      row.median_sold_price_ft2_3br_plus;

    avgSoldPriceM2 =
      row.avg_sold_price_m2_3br_plus;

    medianSoldPriceM2 =
      row.median_sold_price_m2_3br_plus;

    monthsInventory =
      row.months_inventory_3br_plus;
  }

  /*
   * ==========================================================
   * NORMALIZED ATLAS RESPONSE
   * ==========================================================
   *
   * DOM is currently only calculated overall in
   * development_snapshot.
   *
   * For a bedroom-filtered request we return null instead of
   * accidentally presenting the overall DOM as bedroom-specific.
   *
   * We can add bedroom-level DOM later if desired.
   */

  const currentAvgDom =
    bedroom ===
    "all"
      ? row.current_avg_dom
      : null;

  const soldAvgDom12Mo =
    bedroom ===
    "all"
      ? row.sold_avg_dom_12mo
      : null;

  return NextResponse.json({
    entityKy,

    sourceType:
      "development",

    developmentName:
      row.development_name ??
      geography.canonical
        ?.entity_variant_nm ??
      null,

    zoneName:
      row.zone_name,

    areaName:
      row.area_name,

    communityName:
      row.community_name,

    longitude:
      entity.longitude_nb ??
      null,

    latitude:
      entity.latitude_nb ??
      null,

    snapshotDate:
      row.snapshot_date,

    propertyType,

    marketType,

    bedroom,

    /*
     * Property counts describe the development itself.
     * They are not bedroom-filtered listing counts.
     */
    propertyCount:
      Number(
        row.property_count ??
          0,
      ),

    condoPropertyCount:
      Number(
        row.condo_property_count ??
          0,
      ),

    housePropertyCount:
      Number(
        row.house_property_count ??
          0,
      ),

    activeCount:
      Number(
        activeCount ??
          0,
      ),

    activeMls,

    pendingCount:
      Number(
        pendingCount ??
          0,
      ),

    pendingMls,

    sales12Mo:
      Number(
        sales12Mo ??
          0,
      ),

    closedMls,

    avgListPrice,

    medianListPrice,

    avgListPriceFt2,

    medianListPriceFt2,

    avgListPriceM2,

    medianListPriceM2,

    currentAvgDom,

    avgSoldPrice,

    medianSoldPrice,

    avgSoldPriceFt2,

    medianSoldPriceFt2,

    avgSoldPriceM2,

    medianSoldPriceM2,

    soldAvgDom12Mo,

    monthsInventory,
    nearby: {
      rollup:
        nearbyRollup,

      places:
        nearbyPlaces,
    },
  });
}