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
  const boundaryKy = Number(
    request.nextUrl.searchParams.get(
      "boundaryKy",
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

  const bedroom =
    (request.nextUrl.searchParams.get(
      "bedroom",
    ) ??
      "all") as BedroomFilter;

  /*
   * ----------------------------------------------------------
   * VALIDATE REQUEST
   * ----------------------------------------------------------
   */

  if (
    !Number.isFinite(
      boundaryKy,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid boundaryKy.",
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

  /*
   * ----------------------------------------------------------
   * LOAD GOVERNMENT-BOUNDARY SNAPSHOT
   * ----------------------------------------------------------
   */

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "atlas_boundary_market_snapshot",
    {
      p_boundary_ky:
        boundaryKy,

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
      "Unable to load Atlas boundary market snapshot:",
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
          "Government boundary not found.",
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