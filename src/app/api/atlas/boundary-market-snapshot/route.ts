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
    ) ?? "all") as PropertyTypeFilter;

  const marketType =
    (request.nextUrl.searchParams.get(
      "marketType",
    ) ?? "all") as MarketTypeFilter;

  /*
   * ----------------------------------------------------------
   * Validate request
   * ----------------------------------------------------------
   */

  if (!Number.isFinite(boundaryKy)) {
    return NextResponse.json(
      {
        error: "Invalid boundaryKy.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !["all", "condo", "house"].includes(
      propertyType,
    )
  ) {
    return NextResponse.json(
      {
        error: "Invalid propertyType.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !["all", "resale", "precon"].includes(
      marketType,
    )
  ) {
    return NextResponse.json(
      {
        error: "Invalid marketType.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * ----------------------------------------------------------
   * Call spatial government-boundary market snapshot
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
      p_boundary_ky: boundaryKy,
      p_property_type: propertyType,
      p_market_type: marketType,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas boundary market snapshot:",
      error,
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  /*
   * RPC returns one jsonb object.
   *
   * A missing boundary may result in null rather than an
   * application error, so handle that explicitly.
   */

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

  return NextResponse.json(data);
}