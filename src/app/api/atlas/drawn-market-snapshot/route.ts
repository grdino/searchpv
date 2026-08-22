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

type DrawnGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type DrawnMarketSnapshotRequest = {
  geometry?: DrawnGeometry;

  propertyType?: PropertyTypeFilter;

  marketType?: MarketTypeFilter;
};

export async function POST(
  request: NextRequest,
) {
  let body: DrawnMarketSnapshotRequest;

  /*
   * ----------------------------------------------------------
   * READ REQUEST BODY
   * ----------------------------------------------------------
   */

  try {
    body =
      (await request.json()) as DrawnMarketSnapshotRequest;
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,
      },
    );
  }

  const geometry =
    body.geometry;

  const propertyType =
    body.propertyType ??
    "all";

  const marketType =
    body.marketType ??
    "all";

  /*
   * ----------------------------------------------------------
   * VALIDATE GEOMETRY
   * ----------------------------------------------------------
   */

  if (
    !geometry ||
    geometry.type !==
      "Polygon" ||
    !Array.isArray(
      geometry.coordinates,
    ) ||
    geometry.coordinates.length ===
      0 ||
    !Array.isArray(
      geometry.coordinates[0],
    ) ||
    geometry.coordinates[0].length <
      4
  ) {
    return NextResponse.json(
      {
        error:
          "A valid GeoJSON Polygon is required.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Basic coordinate validation.
   *
   * GeoJSON coordinates use:
   *
   * [longitude, latitude]
   */
  for (
    const ring of
      geometry.coordinates
  ) {
    if (
      !Array.isArray(ring) ||
      ring.length < 4
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid polygon ring.",
        },
        {
          status: 400,
        },
      );
    }

    for (
      const coordinate of ring
    ) {
      if (
        !Array.isArray(
          coordinate,
        ) ||
        coordinate.length <
          2
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid polygon coordinate.",
          },
          {
            status: 400,
          },
        );
      }

      const longitude =
        Number(
          coordinate[0],
        );

      const latitude =
        Number(
          coordinate[1],
        );

      if (
        !Number.isFinite(
          longitude,
        ) ||
        !Number.isFinite(
          latitude,
        ) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid longitude or latitude.",
          },
          {
            status: 400,
          },
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * VALIDATE FILTERS
   * ----------------------------------------------------------
   */

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

  /*
   * ----------------------------------------------------------
   * CALL POSTGRESQL RPC
   * ----------------------------------------------------------
   */

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "atlas_drawn_market_snapshot",
    {
      p_geometry:
        geometry,

      p_property_type:
        propertyType,

      p_market_type:
        marketType,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas drawn market snapshot:",
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
          "Unable to create drawn market snapshot.",
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