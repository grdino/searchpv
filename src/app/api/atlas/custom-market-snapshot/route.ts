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

export async function GET(
  request: NextRequest,
) {
  /*
   * boundaryKy can be supplied multiple times:
   *
   * ?boundaryKy=349&boundaryKy=365
   */

  const boundaryKyValues =
    request.nextUrl.searchParams.getAll(
      "boundaryKy",
    );

  const boundaryKys =
    boundaryKyValues
      .map(Number)
      .filter(
        Number.isFinite,
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

  const bedroom =
    (request.nextUrl.searchParams.get(
      "bedroom",
    ) ??
      "all") as BedroomFilter;

  /*
   * ----------------------------------------------------------
   * VALIDATION
   * ----------------------------------------------------------
   */

  if (
    boundaryKyValues.length === 0 ||
    boundaryKys.length !==
      boundaryKyValues.length
  ) {
    return NextResponse.json(
      {
        error:
          "At least one valid boundaryKy is required.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Remove duplicates before calling PostgreSQL.
   */
  const uniqueBoundaryKys =
    Array.from(
      new Set(
        boundaryKys,
      ),
    );

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

  /*
   * ----------------------------------------------------------
   * LOAD CUSTOM MARKET SNAPSHOT
   * ----------------------------------------------------------
   */

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "atlas_custom_market_snapshot",
    {
      p_boundary_kys:
        uniqueBoundaryKys,

      p_property_type:
        propertyType,

      p_market_type:
        marketType,

      p_bedroom:
        bedroom,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas Custom Market snapshot:",
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

  if (!data) {
    return NextResponse.json(
      {
        error:
          "Unable to create Custom Market snapshot.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    data,
  );
}