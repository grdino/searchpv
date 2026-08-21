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

type SnapshotRow = {
  snapshot_date?: string | null;

  zone_name?: string | null;
  area_name?: string | null;
  community_name?: string | null;

  pending_count?: number | null;
  sales_12mo?: number | null;

  market_segment?: string | null;
  property_type_segment?: string | null;
};

type ActiveSummaryRow = {
  current_price?: number | null;
  price_per_sqft?: number | null;
  price_per_sqm?: number | null;
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
   * ----------------------------------------------------------
   * Validate request parameters
   * ----------------------------------------------------------
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
   * ----------------------------------------------------------
   * Resolve Atlas geography
   * ----------------------------------------------------------
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
   * Atlas market snapshot currently supports:
   *
   * AR = MLS Area
   * CM = MLS Community
   */

  if (
    entityType !== "CM" &&
    entityType !== "AR"
  ) {
    return NextResponse.json(
      {
        error:
          "Market snapshot is currently available for MLS Areas and Communities only.",
      },
      { status: 400 },
    );
  }

  const identifier =
    geography.entity?.entity_identifier_cd ?? "";

  const identifierParts =
    identifier.split("__");

  /*
   * ----------------------------------------------------------
   * Translate Atlas filters to SearchPV reporting values
   * ----------------------------------------------------------
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
   * Values used by public.active_listing.
   */

  const activePropertyType =
    propertyType === "condo"
      ? "Condos"
      : propertyType === "house"
        ? "Houses"
        : null;

  const activeMarketSegment =
    marketType === "all"
      ? null
      : marketSegment;

  /*
   * ----------------------------------------------------------
   * Load geography snapshot row
   *
   * We use this source for:
   *
   * - snapshot date
   * - Pending count
   * - Sold 12 Mo count
   * - canonical MLS geography names
   *
   * Current asking-price statistics are calculated separately
   * from public.active_listing so they match the existing
   * SearchPV Active Listings page.
   * ----------------------------------------------------------
   */

  let snapshotRow: SnapshotRow | null = null;

  if (entityType === "CM") {
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
      identifierParts[1].replaceAll(
        "_",
        "-",
      );

    const areaSlug =
      identifierParts[2].replaceAll(
        "_",
        "-",
      );

    const communitySlug =
      identifierParts
        .slice(3)
        .join("__")
        .replaceAll("_", "-");

    const {
      data: snapshotRows,
      error: snapshotError,
    } = await supabase
      .from("community_snapshot")
      .select(
        `
          snapshot_date,
          zone_name,
          area_name,
          community_name,
          pending_count,
          sales_12mo,
          market_segment,
          property_type_segment
        `,
      )
      .eq("zone_slug", zoneSlug)
      .eq("area_slug", areaSlug)
      .eq(
        "community_slug",
        communitySlug,
      )
      .eq(
        "market_segment",
        marketSegment,
      )
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
        "Unable to load Atlas Community market snapshot:",
        snapshotError,
      );

      return NextResponse.json(
        { error: snapshotError.message },
        { status: 500 },
      );
    }

    snapshotRow =
      (snapshotRows?.[0] as SnapshotRow | undefined) ??
      null;
  }

  if (entityType === "AR") {
    if (
      identifierParts.length < 3 ||
      identifierParts[0] !== "ar"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to derive Area hierarchy from entity identifier.",
        },
        { status: 500 },
      );
    }

    const zoneSlug =
      identifierParts[1].replaceAll(
        "_",
        "-",
      );

    const areaSlug =
      identifierParts
        .slice(2)
        .join("__")
        .replaceAll("_", "-");

    const {
      data: snapshotRows,
      error: snapshotError,
    } = await supabase
      .from("area_snapshot")
      .select(
        `
          snapshot_date,
          zone_name,
          area_name,
          pending_count,
          sales_12mo,
          market_segment,
          property_type_segment
        `,
      )
      .eq("zone_slug", zoneSlug)
      .eq("area_slug", areaSlug)
      .eq(
        "market_segment",
        marketSegment,
      )
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
        "Unable to load Atlas Area market snapshot:",
        snapshotError,
      );

      return NextResponse.json(
        { error: snapshotError.message },
        { status: 500 },
      );
    }

    snapshotRow =
      (snapshotRows?.[0] as SnapshotRow | undefined) ??
      null;
  }

  /*
   * A missing snapshot row is valid.
   *
   * Example:
   *
   * Houses + Pre-Con may legitimately have no reporting row.
   */

  if (!snapshotRow) {
    return NextResponse.json({
      entityKy,
      propertyType,
      marketType,

      snapshotDate: null,

      activeCount: 0,
      pendingCount: 0,
      sales12Mo: 0,

      avgListPrice: null,
      medianListPrice: null,

      avgListPriceFt2: null,
      medianListPriceFt2: null,

      avgListPriceM2: null,
      medianListPriceM2: null,
    });
  }

  /*
   * ----------------------------------------------------------
   * Load ACTIVE listings for current asking-price statistics
   *
   * This intentionally uses the same public.active_listing
   * source used by the SearchPV Active Listings page.
   *
   * Therefore:
   *
   * - Active count
   * - Avg / Median List Price
   * - Avg / Median $/ft²
   * - Avg / Median $/m²
   *
   * all use the same underlying listing population as the
   * existing Market Intelligence page.
   * ----------------------------------------------------------
   */

  let activeQuery = supabase
    .from("active_listing")
    .select(
      `
        current_price,
        price_per_sqft,
        price_per_sqm
      `,
    );

  /*
   * Market filter.
   */

  if (activeMarketSegment) {
    activeQuery = activeQuery.eq(
      "market_segment",
      activeMarketSegment,
    );
  }

  /*
   * Property type filter.
   */

  if (activePropertyType) {
    activeQuery = activeQuery.eq(
      "prprty_type",
      activePropertyType,
    );
  }

  /*
   * Geography filters.
   */

  if (snapshotRow.zone_name) {
    activeQuery = activeQuery.eq(
      "zone_name",
      snapshotRow.zone_name,
    );
  }

  if (snapshotRow.area_name) {
    activeQuery = activeQuery.eq(
      "area_name",
      snapshotRow.area_name,
    );
  }

  if (
    entityType === "CM" &&
    snapshotRow.community_name
  ) {
    activeQuery = activeQuery.eq(
      "community_name",
      snapshotRow.community_name,
    );
  }

  const activeResult =
    await loadAllRows(
      activeQuery,
      50000,
    );

  if (activeResult.error) {
    console.error(
      "Unable to load Atlas Active listing summary:",
      activeResult.error,
    );

    return NextResponse.json(
      {
        error:
          activeResult.error.message,
      },
      { status: 500 },
    );
  }

  const activeRows =
    activeResult.rows as ActiveSummaryRow[];

  /*
   * ----------------------------------------------------------
   * Calculate current Active pricing statistics
   * ----------------------------------------------------------
   */

  const listPrices =
    numericValues(
      activeRows,
      "current_price",
    );

  const pricesPerSqft =
    numericValues(
      activeRows,
      "price_per_sqft",
    );

  const pricesPerSqm =
    numericValues(
      activeRows,
      "price_per_sqm",
    );

  const avgListPrice =
    average(listPrices);

  const medianListPrice =
    median(listPrices);

  const avgListPriceFt2 =
    average(pricesPerSqft);

  const medianListPriceFt2 =
    median(pricesPerSqft);

  const avgListPriceM2 =
    average(pricesPerSqm);

  const medianListPriceM2 =
    median(pricesPerSqm);

  /*
   * ----------------------------------------------------------
   * Atlas response
   * ----------------------------------------------------------
   */

  return NextResponse.json({
    entityKy,

    propertyType,
    marketType,

    snapshotDate:
      snapshotRow.snapshot_date ?? null,

    /*
     * Current inventory / activity
     */

    activeCount:
      activeRows.length,

    pendingCount:
      snapshotRow.pending_count ?? 0,

    sales12Mo:
      snapshotRow.sales_12mo ?? 0,

    /*
     * Current ACTIVE asking-price statistics
     */

    avgListPrice,
    medianListPrice,

    avgListPriceFt2,
    medianListPriceFt2,

    avgListPriceM2,
    medianListPriceM2,
  });
}

/*
 * ============================================================
 * Helpers
 * ============================================================
 */

async function loadAllRows(
  query: any,
  maximumRows: number,
): Promise<{
  rows: any[];
  error: { message: string } | null;
}> {
  const pageSize = 1000;
  const rows: any[] = [];

  for (
    let from = 0;
    from < maximumRows;
    from += pageSize
  ) {
    const {
      data,
      error,
    } = await query.range(
      from,
      Math.min(
        from + pageSize - 1,
        maximumRows - 1,
      ),
    );

    if (error) {
      return {
        rows,
        error,
      };
    }

    rows.push(...(data ?? []));

    if (
      !data ||
      data.length < pageSize
    ) {
      break;
    }
  }

  return {
    rows,
    error: null,
  };
}

function numericValues(
  rows: any[],
  field: string,
) {
  return rows
    .map(
      (row) =>
        Number(row[field]),
    )
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0,
    )
    .sort(
      (a, b) => a - b,
    );
}

function average(
  values: number[],
) {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) / values.length
  );
}

function median(
  values: number[],
) {
  if (values.length === 0) {
    return null;
  }

  const middle =
    Math.floor(
      values.length / 2,
    );

  if (
    values.length % 2 === 0
  ) {
    return (
      values[middle - 1] +
      values[middle]
    ) / 2;
  }

  return values[middle];
}