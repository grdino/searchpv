export type DashboardPropertyType = "Condo" | "House";
export type DashboardBedrooms = "All" | "Studio" | "1 BR" | "2 BR" | "3+ BR";
export type DashboardSegment = "Both" | "Resale" | "Pre-sale";
export type DashboardListingStatus = "active" | "pending";

export type MarketDashboardGeography = {
  zone: string;
  area: string;
  community: string;
};

export type MarketDashboardConfig = {
  slug: string;
  displayName: string;
  title: string;
  description: string;
  breadcrumb: string[];
  marketBrief: string;
  cardDescription: string;
  published: boolean;
  indexable: boolean;
  /** Stable ASCII query used for Atlas deep links to avoid SSR/client URL normalization differences. */
  atlasQuery: string;
  /**
   * Published markets currently use one exact MLS geography. Keeping this as
   * an array makes the dashboard engine compatible with a future custom market
   * made from multiple Atlas selections without changing the public model.
   */
  geographies: MarketDashboardGeography[];
  /** Primary geography retained for the existing listing/closed-sale resolvers. */
  geography: MarketDashboardGeography;
};

export const MARKET_DASHBOARDS: Record<string, MarketDashboardConfig> = {
  "zona-romantica": {
    slug: "zona-romantica",
    displayName: "Zona Romántica",
    title: "Zona Romántica Real Estate Market",
    description:
      "Explore active inventory, closed sales, pricing, seller behavior and market direction for Zona Romántica in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "Centro South", "Zona Romántica"],
    atlasQuery: "Zona Romantica",
    cardDescription: "A dense, highly active condo market centered on Puerto Vallarta’s historic south side.",
    published: true,
    indexable: true,
    marketBrief:
      "Explore the Zona Romántica real estate market in Puerto Vallarta’s Centro South, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [
      { zone: "Puerto Vallarta", area: "Centro South", community: "Emiliano Zapata" },
    ],
    geography: {
      zone: "Puerto Vallarta",
      area: "Centro South",
      community: "Emiliano Zapata",
    },
  },
  amapas: {
    slug: "amapas",
    displayName: "Amapas",
    title: "Amapas Real Estate Market",
    description:
      "Explore active inventory, closed sales, pricing, seller behavior and market direction for Amapas in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "South Shore", "Amapas"],
    atlasQuery: "Amapas",
    cardDescription: "A hillside and coastal market immediately south of Zona Romántica, dominated by condominiums.",
    published: true,
    indexable: true,
    marketBrief:
      "Explore the Amapas real estate market on Puerto Vallarta’s South Shore, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [
      { zone: "Puerto Vallarta", area: "South Shore", community: "Amapas" },
    ],
    geography: {
      zone: "Puerto Vallarta",
      area: "South Shore",
      community: "Amapas",
    },
  },
  "south-shore": {
    slug: "south-shore",
    displayName: "South Shore",
    title: "South Shore Real Estate Market",
    description:
      "Explore active inventory, closed sales, pricing, seller behavior and market direction across selected South Shore communities in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "South Shore"],
    atlasQuery: "South Shore",
    cardDescription: "A curated view of selected coastal communities south of Conchas Chinas, excluding Amapas and Conchas Chinas.",
    published: true,
    indexable: true,
    marketBrief:
      "Explore a curated South Shore real estate market combining selected Puerto Vallarta MLS communities south of Conchas Chinas. Amapas and Upper and Lower Conchas Chinas are analyzed separately. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [
      { zone: "Puerto Vallarta", area: "South Shore", community: "Mismaloya" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Playa Gemelas" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Sierra Del Mar" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Punta Negra" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Boca de Tomatlan" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Playa Los Venados" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Garza Blanca" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Lomas de Mismaloya" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Lomas del Pacifico" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "El Nogalito" },
      { zone: "Puerto Vallarta", area: "South Shore", community: "Playas Gemelas" },
    ],
    geography: { zone: "Puerto Vallarta", area: "South Shore", community: "Mismaloya" },
  },
  "5-de-diciembre": {
    slug: "5-de-diciembre",
    displayName: "5 de Diciembre",
    title: "5 de Diciembre Real Estate Market",
    description: "Explore active inventory, closed sales, pricing, seller behavior and market direction for 5 de Diciembre in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "Centro North", "5 de Diciembre"],
    atlasQuery: "5 de Diciembre",
    cardDescription: "A central Puerto Vallarta neighborhood just north of El Centro with a mix of hillside and in-town properties.",
    published: true,
    indexable: true,
    marketBrief: "Explore the 5 de Diciembre real estate market in Puerto Vallarta’s Centro North, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [{ zone: "Puerto Vallarta", area: "Centro North", community: "5 de Diciembre" }],
    geography: { zone: "Puerto Vallarta", area: "Centro North", community: "5 de Diciembre" },
  },
  "marina-vallarta": {
    slug: "marina-vallarta",
    displayName: "Marina Vallarta",
    title: "Marina Vallarta Real Estate Market",
    description: "Explore active inventory, closed sales, pricing, seller behavior and market direction for Marina Vallarta in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "Marina", "Marina Vallarta"],
    atlasQuery: "Marina Vallarta",
    cardDescription: "A marina, golf and waterfront market with established condominium inventory and long sales history.",
    published: true,
    indexable: true,
    marketBrief: "Explore the Marina Vallarta real estate market in Puerto Vallarta, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [{ zone: "Puerto Vallarta", area: "Marina", community: "Marina Vallarta" }],
    geography: { zone: "Puerto Vallarta", area: "Marina", community: "Marina Vallarta" },
  },
  versalles: {
    slug: "versalles",
    displayName: "Versalles",
    title: "Versalles Real Estate Market",
    description: "Explore active inventory, closed sales, pricing, seller behavior and market direction for Versalles in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "Francisco Villa West", "Versalles"],
    atlasQuery: "Versalles",
    cardDescription: "A centrally located neighborhood with strong condominium activity and an increasingly urban residential character.",
    published: true,
    indexable: true,
    marketBrief: "Explore the Versalles real estate market in Puerto Vallarta’s Francisco Villa West area, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [{ zone: "Puerto Vallarta", area: "Francisco Villa West", community: "Versalles" }],
    geography: { zone: "Puerto Vallarta", area: "Francisco Villa West", community: "Versalles" },
  },
  fluvial: {
    slug: "fluvial",
    displayName: "Fluvial",
    title: "Fluvial Real Estate Market",
    description: "Explore active inventory, closed sales, pricing, seller behavior and market direction for Fluvial in Puerto Vallarta.",
    breadcrumb: ["Puerto Vallarta", "Francisco Villa West", "Fluvial"],
    atlasQuery: "Fluvial",
    cardDescription: "A central residential market with meaningful activity in both condominiums and houses.",
    published: true,
    indexable: true,
    marketBrief: "Explore the Fluvial real estate market in Puerto Vallarta’s Francisco Villa West area, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.",
    geographies: [{ zone: "Puerto Vallarta", area: "Francisco Villa West", community: "Fluvial" }],
    geography: { zone: "Puerto Vallarta", area: "Francisco Villa West", community: "Fluvial" },
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
