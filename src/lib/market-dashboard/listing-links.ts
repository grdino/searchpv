export type DashboardPropertyType = "Condo" | "House";
export type DashboardBedrooms = "All" | "Studio" | "1 BR" | "2 BR" | "3+ BR";
export type DashboardSegment = "Both" | "Resale" | "Pre-sale";
export type DashboardListingStatus = "active" | "pending";

export type MarketDashboardConfig = {
  slug: string;
  displayName: string;
  geography: {
    zone: string;
    area: string;
    community: string;
  };
};

export const MARKET_DASHBOARDS: Record<string, MarketDashboardConfig> = {
  "zona-romantica": {
    slug: "zona-romantica",
    displayName: "Zona Romántica",
    geography: {
      zone: "Puerto Vallarta",
      area: "Centro South",
      community: "Emiliano Zapata",
    },
  },
};

export function buildMarketListingUrl(
  marketSlug: string,
  criteria: {
    status: DashboardListingStatus;
    propertyType: DashboardPropertyType;
    bedrooms: DashboardBedrooms;
    segment: DashboardSegment;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  const params = new URLSearchParams({
    market: marketSlug,
    status: criteria.status,
    property: criteria.propertyType,
    bedrooms: criteria.bedrooms,
    segment: criteria.segment,
  });

  if (criteria.minPrice !== undefined) params.set("minPrice", String(criteria.minPrice));
  if (criteria.maxPrice !== undefined) params.set("maxPrice", String(criteria.maxPrice));

  return `/api/market-listings?${params.toString()}`;
}
