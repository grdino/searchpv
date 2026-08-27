import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ListingRow = {
  mls: number | null;
  current_price: number | null;

  development_name: string | null;
  address: string | null;

  beds: number | null;
  baths: number | null;
  sqft: number | null;

  prprty_type: string | null;
  market_type: string | null;
  bedroom_segment: string | null;

  lat_nb: number | null;
  long_nb: number | null;
};

type WorkingListing = ListingRow & {
  latitude: number;
  longitude: number;
  normalizedDevelopment: string;
};

type ListingGroup = {
  listings: WorkingListing[];
  latitude: number;
  longitude: number;
  normalizedDevelopment: string;
};

const NAMED_DEVELOPMENT_MAX_DIAMETER_M = 100;
const LARGE_DEVELOPMENT_CLUSTER_RADIUS_M = 35;
const UNNAMED_LOCATION_RADIUS_M = 7;

export async function GET() {
  /*
   * ==========================================================
   * LOAD ALL ACTIVE LISTINGS WITH COORDINATES
   * ==========================================================
   */

  const PAGE_SIZE = 1000;
  const allRows: ListingRow[] = [];

  let from = 0;

  while (true) {
    const to =
      from + PAGE_SIZE - 1;

    const {
      data,
      error,
    } = await supabase
      .from("active_listing")
      .select(`
        mls,
        current_price,
        development_name,
        address,
        beds,
        baths,
        sqft,
        prprty_type,
        market_type,
        bedroom_segment,
        lat_nb,
        long_nb
      `)
      .not(
        "lat_nb",
        "is",
        null,
      )
      .not(
        "long_nb",
        "is",
        null,
      )
      .order(
        "mls",
        {
          ascending: true,
        },
      )
      .range(
        from,
        to,
      );

    if (error) {
      console.error(
        "Atlas listing marker load error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load active listing markers.",
        },
        {
          status: 500,
        },
      );
    }

    const page =
      (data ?? []) as ListingRow[];

    allRows.push(
      ...page,
    );

    if (
      page.length <
      PAGE_SIZE
    ) {
      break;
    }

    from += PAGE_SIZE;
  }

  const listings: WorkingListing[] =
    allRows
      .map((row) => {
        const latitude =
          Number(row.lat_nb);

        const longitude =
          Number(row.long_nb);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          return null;
        }

        return {
          ...row,

          latitude,
          longitude,

          normalizedDevelopment:
            normalizeDevelopmentName(
              row.development_name,
            ),
        };
      })
      .filter(
        (
          listing,
        ): listing is WorkingListing =>
          listing !== null,
      );

  /*
   * ==========================================================
   * SPLIT NAMED AND UNNAMED LISTINGS
   * ==========================================================
   */

  const namedListings =
    listings.filter(
      (listing) =>
        Boolean(
          listing.normalizedDevelopment,
        ),
    );

  const unnamedListings =
    listings.filter(
      (listing) =>
        !listing.normalizedDevelopment,
    );

  /*
   * ==========================================================
   * GROUP NAMED LISTINGS BY DEVELOPMENT IDENTITY
   * ==========================================================
   *
   * development_name is the primary identity signal.
   *
   * If every listing with that normalized name fits inside
   * a geographically plausible <= 100m footprint, treat the
   * development as one physical location.
   *
   * If the same development name is spread farther than that,
   * split it geographically.
   * ==========================================================
   */

  const namedByDevelopment =
    new Map<
      string,
      WorkingListing[]
    >();

  for (
    const listing
    of namedListings
  ) {
    const key =
      listing.normalizedDevelopment;

    const existing =
      namedByDevelopment.get(
        key,
      );

    if (existing) {
      existing.push(
        listing,
      );
    } else {
      namedByDevelopment.set(
        key,
        [listing],
      );
    }
  }

  const groups: ListingGroup[] =
    [];

  for (
    const [
      normalizedDevelopment,
      developmentListings,
    ]
    of namedByDevelopment
  ) {
    /*
     * A single listing is automatically one location.
     */
    if (
      developmentListings.length ===
      1
    ) {
      groups.push(
        createGroup(
          developmentListings,
          normalizedDevelopment,
        ),
      );

      continue;
    }

    const diameterM =
      calculateGroupDiameter(
        developmentListings,
      );

    /*
     * Same named development and geographically plausible
     * overall footprint.
     *
     * AVIDA falls into this category.
     */
    if (
      diameterM <=
      NAMED_DEVELOPMENT_MAX_DIAMETER_M
    ) {
      groups.push(
        createGroup(
          developmentListings,
          normalizedDevelopment,
        ),
      );

      continue;
    }

    /*
     * Same name exists across a larger geographic area.
     *
     * Do not blindly combine those listings.
     */
    const splitGroups =
      clusterLargeNamedDevelopment(
        developmentListings,
        normalizedDevelopment,
      );

    groups.push(
      ...splitGroups,
    );
  }

  /*
   * ==========================================================
   * GROUP UNNAMED LISTINGS
   * ==========================================================
   *
   * Without development identity we rely entirely on physical
   * proximity and remain deliberately conservative.
   * ==========================================================
   */

  const unnamedGroups:
    ListingGroup[] = [];

  for (
    const listing
    of unnamedListings
  ) {
    let matchedGroup:
      | ListingGroup
      | null = null;

    let closestDistance =
      Number.POSITIVE_INFINITY;

    for (
      const group
      of unnamedGroups
    ) {
      const distanceM =
        distanceMeters(
          listing.latitude,
          listing.longitude,
          group.latitude,
          group.longitude,
        );

      if (
        distanceM >
        UNNAMED_LOCATION_RADIUS_M
      ) {
        continue;
      }

      if (
        distanceM <
        closestDistance
      ) {
        closestDistance =
          distanceM;

        matchedGroup =
          group;
      }
    }

    if (!matchedGroup) {
      unnamedGroups.push(
        createGroup(
          [listing],
          "",
        ),
      );

      continue;
    }

    matchedGroup.listings.push(
      listing,
    );

    recenterGroup(
      matchedGroup,
    );
  }

  groups.push(
    ...unnamedGroups,
  );

  /*
   * ==========================================================
   * CONVERT GROUPS TO GEOJSON
   * ==========================================================
   */

  const features =
    groups.map(
      (
        group,
        groupIndex,
      ) => {
        const groupListings =
          group.listings;

        const listingCount =
          groupListings.length;

        const prices =
          groupListings
            .map(
              (listing) =>
                Number(
                  listing.current_price,
                ),
            )
            .filter(
              (price) =>
                Number.isFinite(
                  price,
                ) &&
                price > 0,
            );

        const minPrice =
          prices.length > 0
            ? Math.min(
                ...prices,
              )
            : null;

        const maxPrice =
          prices.length > 0
            ? Math.max(
                ...prices,
              )
            : null;

        const mlsIds =
          groupListings
            .map(
              (listing) =>
                listing.mls,
            )
            .filter(
              (
                mls,
              ): mls is number =>
                mls !== null &&
                Number.isFinite(
                  Number(mls),
                ),
            );

        const developmentName =
          mostUsefulDevelopmentName(
            groupListings,
          );

        const address =
          firstNonBlank(
            groupListings.map(
              (listing) =>
                listing.address,
            ),
          );

        const beds =
          numericRange(
            groupListings.map(
              (listing) =>
                listing.beds,
            ),
          );

        const baths =
          numericRange(
            groupListings.map(
              (listing) =>
                listing.baths,
            ),
          );

        const sqft =
          numericRange(
            groupListings.map(
              (listing) =>
                listing.sqft,
            ),
          );

        return {
          type:
            "Feature" as const,

          id:
            groupIndex,

          properties: {
            listing_count:
              listingCount,

            min_price:
              minPrice,

            max_price:
              maxPrice,

            mls_ids:
              mlsIds.join(
                ",",
              ),

            mls:
              mlsIds[0] ??
              null,

            development_name:
              developmentName,

            address,

            min_beds:
              beds.min,

            max_beds:
              beds.max,

            min_baths:
              baths.min,

            max_baths:
              baths.max,

            min_sqft:
              sqft.min,

            max_sqft:
              sqft.max,

            label:
              buildMarkerLabel(
                listingCount,
                minPrice,
              ),
          },

          geometry: {
            type:
              "Point" as const,

            coordinates: [
              group.longitude,
              group.latitude,
            ],
          },
        };
      },
    );

  return NextResponse.json({
    type:
      "FeatureCollection",

    listingCount:
      listings.length,

    locationCount:
      features.length,

    namedDevelopmentMaxDiameterM:
      NAMED_DEVELOPMENT_MAX_DIAMETER_M,

    largeDevelopmentClusterRadiusM:
      LARGE_DEVELOPMENT_CLUSTER_RADIUS_M,

    unnamedLocationRadiusM:
      UNNAMED_LOCATION_RADIUS_M,

    features,
  });
}

/*
 * ============================================================
 * NAMED DEVELOPMENT CLUSTERING
 * ============================================================
 */

function clusterLargeNamedDevelopment(
  listings: WorkingListing[],
  normalizedDevelopment: string,
) {
  const clusters:
    ListingGroup[] = [];

  for (
    const listing
    of listings
  ) {
    let bestCluster:
      | ListingGroup
      | null = null;

    let closestDistance =
      Number.POSITIVE_INFINITY;

    for (
      const cluster
      of clusters
    ) {
      /*
       * Use distance to the closest existing listing in the
       * cluster rather than distance to the cluster center.
       *
       * This allows a physically elongated development to form
       * naturally without requiring every pin to sit close to
       * the midpoint.
       */
      const nearestMemberDistance =
        Math.min(
          ...cluster.listings.map(
            (member) =>
              distanceMeters(
                listing.latitude,
                listing.longitude,
                member.latitude,
                member.longitude,
              ),
          ),
        );

      if (
        nearestMemberDistance >
        LARGE_DEVELOPMENT_CLUSTER_RADIUS_M
      ) {
        continue;
      }

      /*
       * Before joining, make sure the resulting cluster itself
       * does not exceed our maximum plausible footprint.
       */
      const proposedListings =
        [
          ...cluster.listings,
          listing,
        ];

      const proposedDiameter =
        calculateGroupDiameter(
          proposedListings,
        );

      if (
        proposedDiameter >
        NAMED_DEVELOPMENT_MAX_DIAMETER_M
      ) {
        continue;
      }

      if (
        nearestMemberDistance <
        closestDistance
      ) {
        closestDistance =
          nearestMemberDistance;

        bestCluster =
          cluster;
      }
    }

    if (!bestCluster) {
      clusters.push(
        createGroup(
          [listing],
          normalizedDevelopment,
        ),
      );

      continue;
    }

    bestCluster.listings.push(
      listing,
    );

    recenterGroup(
      bestCluster,
    );
  }

  return clusters;
}

/*
 * ============================================================
 * GROUP HELPERS
 * ============================================================
 */

function createGroup(
  listings: WorkingListing[],
  normalizedDevelopment: string,
): ListingGroup {
  return {
    listings:
      [...listings],

    latitude:
      median(
        listings.map(
          (listing) =>
            listing.latitude,
        ),
      ),

    longitude:
      median(
        listings.map(
          (listing) =>
            listing.longitude,
        ),
      ),

    normalizedDevelopment,
  };
}

function recenterGroup(
  group: ListingGroup,
) {
  group.latitude =
    median(
      group.listings.map(
        (listing) =>
          listing.latitude,
      ),
    );

  group.longitude =
    median(
      group.listings.map(
        (listing) =>
          listing.longitude,
      ),
    );
}

function calculateGroupDiameter(
  listings: WorkingListing[],
) {
  if (
    listings.length <= 1
  ) {
    return 0;
  }

  let maxDistance =
    0;

  for (
    let i = 0;
    i < listings.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < listings.length;
      j += 1
    ) {
      const distance =
        distanceMeters(
          listings[i].latitude,
          listings[i].longitude,
          listings[j].latitude,
          listings[j].longitude,
        );

      if (
        distance >
        maxDistance
      ) {
        maxDistance =
          distance;
      }
    }
  }

  return maxDistance;
}

/*
 * ============================================================
 * GEOGRAPHIC DISTANCE
 * ============================================================
 */

function distanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusM =
    6371000;

  const lat1 =
    degreesToRadians(
      latitude1,
    );

  const lat2 =
    degreesToRadians(
      latitude2,
    );

  const deltaLat =
    degreesToRadians(
      latitude2 -
        latitude1,
    );

  const deltaLng =
    degreesToRadians(
      longitude2 -
        longitude1,
    );

  const a =
    Math.sin(
      deltaLat / 2,
    ) **
      2 +
    Math.cos(
      lat1,
    ) *
      Math.cos(
        lat2,
      ) *
      Math.sin(
        deltaLng / 2,
      ) **
        2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a,
      ),
    );

  return (
    earthRadiusM *
    c
  );
}

function degreesToRadians(
  degrees: number,
) {
  return (
    degrees *
    Math.PI /
    180
  );
}

/*
 * ============================================================
 * DISPLAY HELPERS
 * ============================================================
 */

function normalizeDevelopmentName(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLocaleLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim();
}

function mostUsefulDevelopmentName(
  listings: WorkingListing[],
) {
  return firstNonBlank(
    listings.map(
      (listing) =>
        listing.development_name,
    ),
  );
}

function firstNonBlank(
  values: Array<
    string | null
  >,
) {
  for (const value of values) {
    if (
      typeof value ===
        "string" &&
      value.trim()
        .length > 0
    ) {
      return value.trim();
    }
  }

  return null;
}

function numericRange(
  values: Array<
    number | null
  >,
) {
  const validValues =
    values
      .map(
        (value) =>
          Number(value),
      )
      .filter(
        (value) =>
          Number.isFinite(
            value,
          ),
      );

  if (
    validValues.length ===
    0
  ) {
    return {
      min:
        null,
      max:
        null,
    };
  }

  return {
    min:
      Math.min(
        ...validValues,
      ),

    max:
      Math.max(
        ...validValues,
      ),
  };
}

function median(
  values: number[],
) {
  if (
    values.length ===
    0
  ) {
    return 0;
  }

  const sorted =
    [...values].sort(
      (a, b) =>
        a - b,
    );

  const middle =
    Math.floor(
      sorted.length / 2,
    );

  if (
    sorted.length % 2 ===
    0
  ) {
    return (
      sorted[
        middle - 1
      ] +
      sorted[middle]
    ) / 2;
  }

  return sorted[
    middle
  ];
}

function buildMarkerLabel(
  listingCount: number,
  minPrice: number | null,
) {
  if (
    minPrice === null
  ) {
    return listingCount > 1
      ? `${listingCount} listings`
      : "Active";
  }

  const priceLabel =
    formatCompactPrice(
      minPrice,
    );

  if (
    listingCount ===
    1
  ) {
    return priceLabel;
  }

  return `${listingCount} · ${priceLabel}+`;
}

function formatCompactPrice(
  price: number,
) {
  if (
    price >=
    1_000_000
  ) {
    const millions =
      price /
      1_000_000;

    const formatted =
      millions >= 10
        ? millions.toFixed(
            0,
          )
        : millions.toFixed(
            1,
          );

    return `$${formatted.replace(
      /\.0$/,
      "",
    )}M`;
  }

  if (
    price >=
    1_000
  ) {
    return `$${Math.round(
      price /
        1_000,
    )}K`;
  }

  return `$${Math.round(
    price,
  )}`;
}