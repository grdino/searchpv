import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  const entityKy = Number(
    request.nextUrl.searchParams.get("entityKy"),
  );

  const propertyType =
    (request.nextUrl.searchParams.get(
      "propertyType",
    ) ?? "all") as PropertyTypeFilter;

  const marketType =
    (request.nextUrl.searchParams.get(
      "marketType",
    ) ?? "all") as MarketTypeFilter;

  /*
   * Validate request parameters.
   */
  if (!Number.isFinite(entityKy)) {
    return NextResponse.json(
      { error: "Invalid entityKy." },
      { status: 400 },
    );
  }

  if (
    !["all", "condo", "house"].includes(
      propertyType,
    )
  ) {
    return NextResponse.json(
      { error: "Invalid propertyType." },
      { status: 400 },
    );
  }

  if (
    !["all", "resale", "precon"].includes(
      marketType,
    )
  ) {
    return NextResponse.json(
      { error: "Invalid marketType." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  /*
   * Resolve the canonical Atlas geography.
   */
  const {
    data: geographyData,
    error: geographyError,
  } = await supabase.rpc(
    "geography_entity_detail",
    {
      p_entity_ky: entityKy,
    },
  );

  if (geographyError) {
    console.error(
      "Unable to resolve Atlas entity:",
      geographyError,
    );

    return NextResponse.json(
      { error: geographyError.message },
      { status: 500 },
    );
  }

  if (!geographyData) {
    return NextResponse.json(
      { error: "Entity not found." },
      { status: 404 },
    );
  }

  const geography =
    geographyData as GeographyEntityDetail;

  const entityType =
    geography.entity?.entity_type_cd ?? "";

  /*
   * Community snapshot currently supports CM entities.
   *
   * We can add Area and Zone snapshot support later.
   */
  if (entityType !== "CM") {
    return NextResponse.json(
      {
        error:
          "Market snapshot is currently available for MLS Communities only.",
      },
      { status: 400 },
    );
  }

  /*
   * Canonical entity identifiers are hierarchical:
   *
   * cm__puerto_vallarta__south_shore__amapas
   *
   * Those components correspond directly to the slug columns
   * already exposed by public.community_snapshot.
   */
  const identifier =
    geography.entity?.entity_identifier_cd ?? "";

  const identifierParts =
    identifier.split("__");

  if (
    identifierParts.length < 4 ||
    identifierParts[0] !== "cm"
  ) {
    return NextResponse.json(
      {
        error:
          "Unable to derive Community hierarchy from entity identifier.",
      },
      { status: 500 },
    );
  }

    const zoneSlug =
    identifierParts[1].replaceAll("_", "-");

    const areaSlug =
    identifierParts[2].replaceAll("_", "-");

    const communitySlug =
    identifierParts
        .slice(3)
        .join("__")
        .replaceAll("_", "-");

  /*
   * Translate Atlas consumer filters into the segments used
   * by public.community_snapshot.
   */
  const marketSegment =
    marketType === "precon"
      ? "pre_construction"
      : marketType;

  const propertyTypeSegment =
    propertyType === "condo"
      ? "condos"
      : propertyType === "house"
        ? "houses"
        : "all";

  /*
   * Load the newest matching snapshot row.
   */
  const {
    data: snapshotRows,
    error: snapshotError,
  } = await supabase
    .from("community_snapshot")
    .select(
      `
        snapshot_date,
        active_count,
        pending_count,
        median_list_price,
        avg_list_price_ft2,
        market_segment,
        property_type_segment
      `,
    )
    .eq("zone_slug", zoneSlug)
    .eq("area_slug", areaSlug)
    .eq("community_slug", communitySlug)
    .eq("market_segment", marketSegment)
    .eq(
      "property_type_segment",
      propertyTypeSegment,
    )
    .order("snapshot_date", {
      ascending: false,
    })
    .limit(1);

  if (snapshotError) {
    console.error(
      "Unable to load Atlas market snapshot:",
      snapshotError,
    );

    return NextResponse.json(
      { error: snapshotError.message },
      { status: 500 },
    );
  }

  const row = snapshotRows?.[0] ?? null;

  /*
   * No row is a valid market result.
   *
   * For example:
   *
   * Amapas + Houses + Pre-Con
   *
   * currently has no snapshot row.
   */
  if (!row) {
    return NextResponse.json({
      entityKy,

      propertyType,
      marketType,

      snapshotDate: null,

      activeCount: 0,
      pendingCount: 0,

      medianListPrice: null,
      avgListPriceFt2: null,
    });
  }

  return NextResponse.json({
    entityKy,

    propertyType,
    marketType,

    snapshotDate:
      row.snapshot_date,

    activeCount:
      row.active_count ?? 0,

    pendingCount:
      row.pending_count ?? 0,

    medianListPrice:
      row.median_list_price ?? null,

    avgListPriceFt2:
      row.avg_list_price_ft2 ?? null,
  });
}