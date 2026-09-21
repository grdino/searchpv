import { NextRequest, NextResponse } from "next/server";

import { buildIdxUrl } from "@/lib/idx";
import {
  DEFAULT_PROPERTY_SEARCH_FILTERS,
  type PropertySearchFilters,
} from "@/lib/property-search/filters";
import { getPropertySearchPageData } from "@/lib/property-search/service";
import {
  MARKET_DASHBOARDS,
  type DashboardBedrooms,
  type DashboardListingStatus,
  type DashboardPropertyType,
  type DashboardSegment,
} from "@/lib/market-dashboard/listing-links";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const market = MARKET_DASHBOARDS[search.get("market") ?? ""];
  const status = parseStatus(search.get("status"));
  const propertyType = parsePropertyType(search.get("property"));
  const bedrooms = parseBedrooms(search.get("bedrooms"));
  const segment = parseSegment(search.get("segment"));

  if (!market || !status || !propertyType || !bedrooms || !segment) {
    return NextResponse.json({ error: "Invalid market listing selection." }, { status: 400 });
  }

  const filters: PropertySearchFilters = {
    ...DEFAULT_PROPERTY_SEARCH_FILTERS,
    zone: market.geography.zone,
    area: market.geography.area,
    community: market.geography.community,
    propertyType: propertyType === "Condo" ? "condos" : "houses",
    market: segment === "Resale" ? "resale" : segment === "Pre-sale" ? "pre_construction" : "all",
    ...bedroomFilters(bedrooms),
    minPrice: parseOptionalNumber(search.get("minPrice")),
    maxPrice: parseOptionalNumber(search.get("maxPrice")),
  };

  try {
    const { summary } = await getPropertySearchPageData(filters);
    const listingIds = status === "active" ? summary.activeListingIds : summary.pendingListingIds;

    if (!listingIds) {
      const fallback = new URL(`/market/${market.slug}`, request.url);
      fallback.searchParams.set("property", propertyType);
      fallback.searchParams.set("bedrooms", bedrooms);
      fallback.searchParams.set("segment", segment);
      fallback.hash = "market-snapshot";
      return NextResponse.redirect(fallback);
    }

    return NextResponse.redirect(buildIdxUrl(listingIds));
  } catch (error) {
    console.error("Market listing redirect failed", error);
    return NextResponse.json({ error: "Unable to load matching listings." }, { status: 500 });
  }
}

function parseStatus(value: string | null): DashboardListingStatus | null {
  return value === "active" || value === "pending" ? value : null;
}

function parsePropertyType(value: string | null): DashboardPropertyType | null {
  return value === "Condo" || value === "House" ? value : null;
}

function parseBedrooms(value: string | null): DashboardBedrooms | null {
  return value === "All" || value === "Studio" || value === "1 BR" || value === "2 BR" || value === "3+ BR" ? value : null;
}

function parseSegment(value: string | null): DashboardSegment | null {
  return value === "Both" || value === "Resale" || value === "Pre-sale" ? value : null;
}

function bedroomFilters(value: DashboardBedrooms): Pick<PropertySearchFilters, "minBeds" | "maxBeds"> {
  if (value === "Studio") return { minBeds: 0, maxBeds: 0 };
  if (value === "1 BR") return { minBeds: 1, maxBeds: 1 };
  if (value === "2 BR") return { minBeds: 2, maxBeds: 2 };
  if (value === "3+ BR") return { minBeds: 3, maxBeds: null };
  return { minBeds: null, maxBeds: null };
}

function parseOptionalNumber(value: string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
