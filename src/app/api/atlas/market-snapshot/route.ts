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

type EntityMarketSnapshot = {
  entityKy?: number;

  sourceType?: string;

  snapshotDate?: string | null;

  activeCount?: number;
  pendingCount?: number;
  sales12Mo?: number;

  avgListPrice?: number | null;
  medianListPrice?: number | null;

  avgListPriceFt2?: number | null;
  medianListPriceFt2?: number | null;

  avgListPriceM2?: number | null;
  medianListPriceM2?: number | null;

  boundaryCount?: number;
  boundaryKys?: number[];

  propertyType?: string;
  marketType?: string;
};

export async function GET(
  request: NextRequest,
) {
  /*
   * ----------------------------------------------------------
   * READ PARAMETERS
   * ----------------------------------------------------------
   */

  const entityKy = Number(
    request.nextUrl.searchParams.get(
      "entityKy",
    ),
  );

  const propertyType =
    (request.nextUrl.searchParams.get(
      "propertyType",
    ) ??
      "all") as PropertyTypeFilter;

  const marketType =
    (request.nextUrl.searchParams.get(
      "marketType",
    ) ??
      "all") as MarketTypeFilter;

  /*
   * ----------------------------------------------------------
   * VALIDATE PARAMETERS
   * ----------------------------------------------------------
   */

  if (
    !Number.isFinite(entityKy) ||
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
   * ----------------------------------------------------------
   * RESOLVE ATLAS ENTITY
   * ----------------------------------------------------------
   *
   * We still validate the entity here rather than blindly
   * sending any arbitrary entityKy into the market RPC.
   *
   * Atlas market snapshots currently support:
   *
   * AR = MLS Area
   * CM = MLS Community
   * ----------------------------------------------------------
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
      "Unable to resolve Atlas entity:",
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
          "Entity not found.",
      },
      {
        status: 404,
      },
    );
  }

  const geography =
    geographyData as GeographyEntityDetail;

  const entityType =
    geography.entity
      ?.entity_type_cd ??
    "";

  if (
    entityType !== "CM" &&
    entityType !== "AR"
  ) {
    return NextResponse.json(
      {
        error:
          "Market snapshot is currently available for MLS Areas and Communities only.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * ----------------------------------------------------------
   * LOAD SPATIAL ATLAS MARKET SNAPSHOT
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The Atlas map displays the saved geographic footprint for
   * an MLS entity.
   *
   * Therefore the market statistics must describe the same
   * geographic footprint the user sees on the map.
   *
   * atlas_entity_market_snapshot:
   *
   *   entityKy
   *       ↓
   *   geo.entity_boundary
   *       ↓
   *   saved boundaryKys[]
   *       ↓
   *   atlas_custom_market_snapshot(...)
   *
   * This means:
   *
   *   Search Amapas
   *
   * and
   *
   *   Custom Market
   *   + Amapas polygon 1
   *   + Amapas polygon 2
   *   + Amapas polygon 3
   *
   * use the exact same spatial calculation engine.
   * ----------------------------------------------------------
   */

  const {
    data,
    error,
  } = await supabase.rpc(
    "atlas_entity_market_snapshot",
    {
      p_entity_ky:
        entityKy,

      p_property_type:
        propertyType,

      p_market_type:
        marketType,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas entity market snapshot:",
      error,
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
   * ----------------------------------------------------------
   * NO SAVED FOOTPRINT
   * ----------------------------------------------------------
   *
   * atlas_entity_market_snapshot returns null when the entity
   * has no rows in geo.entity_boundary.
   *
   * We deliberately do NOT silently fall back to the old MLS
   * name-based calculation here.
   *
   * Why:
   *
   * Atlas is a geographic experience. If the map does not have
   * a defined footprint for an entity, returning MLS-name stats
   * would once again allow the visual geography and statistics
   * to describe different populations.
   *
   * This condition is therefore exposed explicitly.
   * ----------------------------------------------------------
   */

  if (!data) {
    return NextResponse.json(
      {
        error:
          "This Atlas geography does not yet have a saved geographic footprint.",
      },
      {
        status: 404,
      },
    );
  }

  const snapshot =
    data as EntityMarketSnapshot;

  /*
   * ----------------------------------------------------------
   * RESPONSE
   * ----------------------------------------------------------
   *
   * The RPC already returns the response shape expected by
   * AtlasBottomSheet:
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
   * It also returns useful diagnostic information:
   *
   * entityKy
   * sourceType = entity_footprint
   * boundaryCount
   * boundaryKys
   * ----------------------------------------------------------
   */

  return NextResponse.json(
    snapshot,
  );
}