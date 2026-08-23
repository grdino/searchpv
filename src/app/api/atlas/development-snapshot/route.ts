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

  active_count: number;
  pending_count: number;
  sales_12mo: number;

  avg_list_price: number | null;
  median_list_price: number | null;

  avg_list_price_ft2: number | null;
  median_list_price_ft2: number | null;

  avg_list_price_m2: number | null;
  median_list_price_m2: number | null;

  current_avg_dom: number | null;

  avg_sold_price: number | null;
  median_sold_price: number | null;

  avg_sold_price_ft2: number | null;
  median_sold_price_ft2: number | null;

  avg_sold_price_m2: number | null;
  median_sold_price_m2: number | null;

  sold_avg_dom_12mo: number | null;

  months_inventory: number | null;

  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
};

/*
 * ============================================================
 * ENTITY IDENTIFIER → DEVELOPMENT HIERARCHY
 * ============================================================
 *
 * Development identifiers currently follow:
 *
 * dv__zone__area__community__development
 *
 * Example:
 *
 * dv__puerto_vallarta__centro_south__
 * emiliano_zapata__pier_57
 *
 * The reporting snapshot uses hyphenated slugs:
 *
 * puerto-vallarta
 * centro-south
 * emiliano-zapata
 * pier-57
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

  /*
   * Normally developmentParts contains one value, but joining
   * defensively prevents an unusual identifier from silently
   * losing part of the development name.
   */
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
   * MAP ATLAS FILTER VALUES TO DEVELOPMENT SNAPSHOT VALUES
   * ==========================================================
   *
   * Atlas:
   *
   * propertyType:
   *   all
   *   condo
   *   house
   *
   * development_snapshot:
   *   all
   *   condos
   *   houses
   *
   *
   * Atlas:
   *
   * marketType:
   *   all
   *   resale
   *   precon
   *
   * development_snapshot:
   *   all
   *   resale
   *   pre_construction
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
        sales_12mo,

        avg_list_price,
        median_list_price,

        avg_list_price_ft2,
        median_list_price_ft2,

        avg_list_price_m2,
        median_list_price_m2,

        current_avg_dom,

        avg_sold_price,
        median_sold_price,

        avg_sold_price_ft2,
        median_sold_price_ft2,

        avg_sold_price_m2,
        median_sold_price_m2,

        sold_avg_dom_12mo,
        months_inventory,

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

  if (!data) {
    return NextResponse.json(
      {
        error:
          "No market snapshot is available for this development and filter combination.",
      },
      {
        status: 404,
      },
    );
  }

  const row =
    data as DevelopmentSnapshotRow;

  /*
   * ==========================================================
   * NORMALIZED ATLAS RESPONSE
   * ==========================================================
   *
   * The primary fields deliberately match AtlasBottomSheet's
   * existing MarketSnapshot shape:
   *
   * activeCount
   * pendingCount
   * sales12Mo
   * avgListPrice
   * medianListPrice
   * avgListPriceFt2
   * medianListPriceFt2
   * avgListPriceM2
   * medianListPriceM2
   *
   * Additional development metrics are included now so we can
   * use them later without redesigning this endpoint.
   */

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
        row.active_count ??
          0,
      ),

    pendingCount:
      Number(
        row.pending_count ??
          0,
      ),

    sales12Mo:
      Number(
        row.sales_12mo ??
          0,
      ),

    avgListPrice:
      row.avg_list_price,

    medianListPrice:
      row.median_list_price,

    avgListPriceFt2:
      row.avg_list_price_ft2,

    medianListPriceFt2:
      row.median_list_price_ft2,

    avgListPriceM2:
      row.avg_list_price_m2,

    medianListPriceM2:
      row.median_list_price_m2,

    currentAvgDom:
      row.current_avg_dom,

    avgSoldPrice:
      row.avg_sold_price,

    medianSoldPrice:
      row.median_sold_price,

    avgSoldPriceFt2:
      row.avg_sold_price_ft2,

    medianSoldPriceFt2:
      row.median_sold_price_ft2,

    avgSoldPriceM2:
      row.avg_sold_price_m2,

    medianSoldPriceM2:
      row.median_sold_price_m2,

    soldAvgDom12Mo:
      row.sold_avg_dom_12mo,

    monthsInventory:
      row.months_inventory,
  });
}