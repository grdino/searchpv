import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  MARKET_DASHBOARDS,
  type DashboardBedrooms,
  type DashboardPropertyType,
  type DashboardSegment,
} from "@/lib/market-dashboard/listing-links";

export const dynamic = "force-dynamic";

type AskingBasis = "final" | "original";
type SellerBand = "under90" | "90to94" | "95to99" | "100plus";
type QueryMode = "seller" | "trend" | "snapshot";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;

  const market = MARKET_DASHBOARDS[search.get("market") ?? ""];
  const propertyType = parsePropertyType(search.get("property"));
  const bedrooms = parseBedrooms(search.get("bedrooms"));
  const segment = parseSegment(search.get("segment"));

  /*
   * Existing links do not specify a mode, so default to seller.
   * This preserves the Seller Behavior links already in production.
   */
  const requestedMode = search.get("mode");

  const mode: QueryMode =
    requestedMode === "trend"
      ? "trend"
      : requestedMode === "snapshot"
        ? "snapshot"
        : "seller";

  if (!market || !propertyType || !bedrooms || !segment) {
    return NextResponse.json(
      { error: "Invalid closed-sale selection." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const geographies = market.geographies.length ? market.geographies : [market.geography];
  const sameZoneArea = geographies.every((g) => g.zone === geographies[0].zone && g.area === geographies[0].area);
  if (!sameZoneArea) return NextResponse.json({ error: "Multi-area closed-sale selection is not supported yet." }, { status: 400 });

  /*
   * Determine the same data-through date used by the dashboard.
   */
  let snapshotQuery = supabase
    .from("closed_listing")
    .select("market_snapshot_date")
    .eq("zone_name", geographies[0].zone)
    .eq("area_name", geographies[0].area)
    .in("community_name", geographies.map((g) => g.community))
    .eq(
      "property_type_segment",
      propertyType === "Condo" ? "condos" : "houses"
    )
    .not("market_snapshot_date", "is", null)
    .order("market_snapshot_date", { ascending: false })
    .limit(1);

  if (bedrooms !== "All") {
    snapshotQuery = snapshotQuery.eq(
      "bedroom_segment",
      bedroomSegment(bedrooms)
    );
  }

  if (segment !== "Both") {
    snapshotQuery = snapshotQuery.eq(
      "market_segment",
      segment === "Resale" ? "resale" : "pre_construction"
    );
  }

  const { data: snapshotRows, error: snapshotError } =
    await snapshotQuery;

  if (snapshotError) {
    console.error(
      "Market closed-sale snapshot lookup failed",
      snapshotError
    );

    return NextResponse.json(
      { error: "Unable to determine market data date." },
      { status: 500 }
    );
  }

  const latestDate = snapshotRows?.[0]?.market_snapshot_date;

  if (!latestDate) {
    return redirectToResults(request, []);
  }

  /*
   * Trend drilldown mode.
   *
   * This resolves the exact closed-sale population behind a monthly
   * Market Trends bar.
   */
  if (mode === "trend") {
    return handleTrendDrilldown({
      request,
      supabase,
      market,
      propertyType,
      bedrooms,
      segment,
      latestDate,
      year: search.get("year"),
      month: search.get("month"),
      quarter: search.get("quarter"),
      mtd: search.get("mtd") === "1",
      ytd: search.get("ytd") === "1",
    });
  }

  if (mode === "snapshot") {
    /*
    * Market Snapshot · Sold 12M
    *
    * Match the dashboard's trailing-12-month population:
    * latest snapshot date minus one calendar year through the
    * current data-through date.
    */
    const cutoff = new Date(`${latestDate}T00:00:00Z`);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);

    const cutoffText = cutoff.toISOString().slice(0, 10);

    let query = supabase
      .from("closed_listing")
      .select("mls")
      .eq("zone_name", geographies[0].zone)
      .eq("area_name", geographies[0].area)
      .in("community_name", geographies.map((g) => g.community))
      .eq(
        "property_type_segment",
        propertyType === "Condo" ? "condos" : "houses"
      )
      .gte("sold_date", cutoffText)
      .lte("sold_date", latestDate)
      .gt("sold_price", 0);

    if (bedrooms !== "All") {
      query = query.eq(
        "bedroom_segment",
        bedroomSegment(bedrooms)
      );
    }

    if (segment !== "Both") {
      query = query.eq(
        "market_segment",
        segment === "Resale" ? "resale" : "pre_construction"
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Market snapshot closed-sale lookup failed",
        error
      );

      return NextResponse.json(
        { error: "Unable to load snapshot closed sales." },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as unknown as Array<{
      mls: string | number | null;
    }>;

    const mlsNumbers = rows
      .map((row) => String(row.mls ?? "").trim())
      .filter(Boolean);

    return redirectToResults(request, mlsNumbers);
  }

  /*
   * Seller Behavior mode.
   *
   * Everything below preserves the working Seller Behavior logic.
   */
  const basis = parseBasis(search.get("basis"));
  const band = parseBand(search.get("band"));

  if (!basis || !band) {
    return NextResponse.json(
      { error: "Invalid seller-behavior selection." },
      { status: 400 }
    );
  }

  /*
   * Match the dashboard's trailing-12-month calculation exactly:
   * latest snapshot date minus one calendar year.
   */
  const cutoff = new Date(`${latestDate}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);

  const cutoffText = cutoff.toISOString().slice(0, 10);

  /*
   * Select the appropriate sold-to-asking-price field.
   */
  const ratioField =
    basis === "final"
      ? "sold_to_final_list_pct"
      : "sold_to_original_list_pct";

  /*
   * Build the base closed-sales query.
   */
  let query = supabase
    .from("closed_listing")
    .select(`mls,${ratioField}`)
    .eq("zone_name", geographies[0].zone)
    .eq("area_name", geographies[0].area)
    .in("community_name", geographies.map((g) => g.community))
    .eq(
      "property_type_segment",
      propertyType === "Condo" ? "condos" : "houses"
    )
    .gte("sold_date", cutoffText)
    .gt("sold_price", 0);

  /*
   * Apply bedroom selection.
   */
  if (bedrooms !== "All") {
    query = query.eq(
      "bedroom_segment",
      bedroomSegment(bedrooms)
    );
  }

  /*
   * Apply resale / pre-construction selection.
   */
  if (segment !== "Both") {
    query = query.eq(
      "market_segment",
      segment === "Resale" ? "resale" : "pre_construction"
    );
  }

  /*
   * Seller-behavior bands.
   *
   * Dashboard definitions:
   *
   * <90%
   * 90–94%  => >=90 and <95
   * 95–99%  => >=95 and <100
   * 100%+   => >=100
   *
   * All four database queries use bounded ranges. This keeps the
   * closed_listing query selective and avoids the statement timeout
   * encountered with the open-ended outer ranges.
   */
  if (band === "under90") {
    query = query
      .gte(ratioField, 0)
      .lt(ratioField, 90);
  } else if (band === "90to94") {
    query = query
      .gte(ratioField, 90)
      .lt(ratioField, 95);
  } else if (band === "95to99") {
    query = query
      .gte(ratioField, 95)
      .lt(ratioField, 100);
  } else {
    query = query
      .gte(ratioField, 100)
      .lte(ratioField, 200);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Market closed-sale lookup failed",
      error
    );

    return NextResponse.json(
      { error: "Unable to load matching closed sales." },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as unknown as Array<{
    mls: string | number | null;
  }>;

  const mlsNumbers = rows
    .map((row) => String(row.mls ?? "").trim())
    .filter(Boolean);

  return redirectToResults(request, mlsNumbers);
}

/*
 * Resolve one monthly Market Trends bar to its exact MLS transactions.
 *
 * Normal historical months use the entire calendar month.
 *
 * For the current MTD bar and its prior-year comparison, the end date
 * uses the dashboard's data-through day. Example:
 *
 * Current: Sep 1–21, 2026
 * Prior:   Sep 1–21, 2025
 */
async function handleTrendDrilldown({
  request,
  supabase,
  market,
  propertyType,
  bedrooms,
  segment,
  latestDate,
  year,
  quarter,
  month,
  mtd,
  ytd,
}: {
  request: NextRequest;
  supabase: Awaited<ReturnType<typeof createClient>>;
  market: (typeof MARKET_DASHBOARDS)[string];
  propertyType: DashboardPropertyType;
  bedrooms: DashboardBedrooms;
  segment: DashboardSegment;
  latestDate: string;
  year: string | null;
  quarter: string | null;
  month: string | null;
  mtd: boolean;
  ytd: boolean;
}) {
  const geographies = market.geographies.length ? market.geographies : [market.geography];
  const yearNumber = Number(year);
  const quarterNumber = quarter ? Number(quarter) : null;
  const monthNumber = month ? Number(month) : null;

  if (
    !Number.isInteger(yearNumber) ||
    yearNumber < 2000 ||
    yearNumber > 2100
  ) {
    return NextResponse.json(
      { error: "Invalid trend period." },
      { status: 400 }
    );
  }

  let startDate: string;
  let endDate: string;

  if (ytd) {
    /*
    * Annual drilldown.
    *
    * Historical years use the full calendar year.
    * The dashboard's current year stops at the data-through date.
    */
    const asOf = new Date(`${latestDate}T00:00:00Z`);
    const currentYear = asOf.getUTCFullYear();

    startDate = `${yearNumber}-01-01`;

    endDate =
      yearNumber === currentYear
        ? latestDate
        : `${yearNumber}-12-31`;

  } else if (
    quarterNumber !== null &&
    Number.isInteger(quarterNumber) &&
    quarterNumber >= 1 &&
    quarterNumber <= 4
  ) {
    /*
    * Quarterly drilldown.
    */
    const startMonth = (quarterNumber - 1) * 3 + 1;
    const endMonth = startMonth + 2;

    startDate =
      `${yearNumber}-` +
      `${String(startMonth).padStart(2, "0")}-01`;

    const lastDay = new Date(
      Date.UTC(yearNumber, endMonth, 0)
    ).getUTCDate();

    endDate =
      `${yearNumber}-` +
      `${String(endMonth).padStart(2, "0")}-` +
      `${String(lastDay).padStart(2, "0")}`;
  } else {
    /*
    * Existing monthly drilldown.
    */
    if (
      monthNumber === null ||
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return NextResponse.json(
        { error: "Invalid trend period." },
        { status: 400 }
      );
    }

    const monthText = String(monthNumber).padStart(2, "0");

    startDate = `${yearNumber}-${monthText}-01`;

    if (mtd) {
      const asOf = new Date(`${latestDate}T00:00:00Z`);
      const throughDay = asOf.getUTCDate();

      const lastDayOfTargetMonth = new Date(
        Date.UTC(yearNumber, monthNumber, 0)
      ).getUTCDate();

      const safeThroughDay = Math.min(
        throughDay,
        lastDayOfTargetMonth
      );

      endDate =
        `${yearNumber}-${monthText}-` +
        String(safeThroughDay).padStart(2, "0");
    } else {
      const lastDay = new Date(
        Date.UTC(yearNumber, monthNumber, 0)
      ).getUTCDate();

      endDate =
        `${yearNumber}-${monthText}-` +
        String(lastDay).padStart(2, "0");
    }
  }

  /*
   * Keep the trend query deliberately narrow by date.
   * Unlike Seller Behavior, this does not need ratio columns.
   */
  let query = supabase
    .from("closed_listing")
    .select("mls")
    .eq("zone_name", geographies[0].zone)
    .eq("area_name", geographies[0].area)
    .in("community_name", geographies.map((g) => g.community))
    .eq(
      "property_type_segment",
      propertyType === "Condo" ? "condos" : "houses"
    )
    .gte("sold_date", startDate)
    .lte("sold_date", endDate)
    .gt("sold_price", 0);

  if (bedrooms !== "All") {
    query = query.eq(
      "bedroom_segment",
      bedroomSegment(bedrooms)
    );
  }

  if (segment !== "Both") {
    query = query.eq(
      "market_segment",
      segment === "Resale" ? "resale" : "pre_construction"
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Market trend closed-sale lookup failed",
      {
        error,
        startDate,
        endDate,
        propertyType,
        bedrooms,
        segment,
      }
    );

    return NextResponse.json(
      { error: "Unable to load trend closed sales." },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as unknown as Array<{
    mls: string | number | null;
  }>;

  const mlsNumbers = rows
    .map((row) => String(row.mls ?? "").trim())
    .filter(Boolean);

  return redirectToResults(request, mlsNumbers);
}

function redirectToResults(
  request: NextRequest,
  mlsNumbers: string[]
) {
  const url = new URL(
    "/market-intelligence/closed-sales/search-results",
    request.url
  );

  url.searchParams.set("mls", mlsNumbers.join(","));

  return NextResponse.redirect(url);
}

function parsePropertyType(
  value: string | null
): DashboardPropertyType | null {
  return value === "Condo" || value === "House"
    ? value
    : null;
}

function parseBedrooms(
  value: string | null
): DashboardBedrooms | null {
  return value === "All" ||
    value === "Studio" ||
    value === "1 BR" ||
    value === "2 BR" ||
    value === "3+ BR"
    ? value
    : null;
}

function parseSegment(
  value: string | null
): DashboardSegment | null {
  return value === "Both" ||
    value === "Resale" ||
    value === "Pre-sale"
    ? value
    : null;
}

function parseBasis(
  value: string | null
): AskingBasis | null {
  return value === "final" || value === "original"
    ? value
    : null;
}

function parseBand(
  value: string | null
): SellerBand | null {
  return value === "under90" ||
    value === "90to94" ||
    value === "95to99" ||
    value === "100plus"
    ? value
    : null;
}

function bedroomSegment(
  value: DashboardBedrooms
) {
  if (value === "Studio") return "0br";
  if (value === "1 BR") return "1br";
  if (value === "2 BR") return "2br";
  if (value === "3+ BR") return "3br_plus";

  throw new Error(
    "All bedrooms does not have a bedroom segment."
  );
}

