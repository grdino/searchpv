import type { Metadata } from "next";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type RangeKey = "90d" | "6mo" | "12mo" | "all" | "custom";

type MarketSeoParams = {
  pageType: "closed-sales" | "active-listings" | "pending-sales";
  market?: MarketSegment;
  propertyType?: PropertyTypeSegment;
  zone?: string;
  area?: string;
  community?: string;
  development?: string;
  range?: RangeKey;
  canonicalPath: string;
};

export function buildMarketSeo(params: MarketSeoParams): Metadata {
  const location =
    clean(params.development) ||
    clean(params.community) ||
    clean(params.area) ||
    clean(params.zone) ||
    "Puerto Vallarta";

  const propertyLabel =
    params.propertyType === "condos"
      ? "Condo"
      : params.propertyType === "houses"
        ? "House"
        : "Real Estate";

  const marketLabel =
    params.market === "pre_construction"
      ? "Pre-Construction"
      : params.market === "resale"
        ? "Resale"
        : "";

  const pageLabel =
    params.pageType === "closed-sales"
      ? "Closed Sales"
      : params.pageType === "active-listings"
        ? "Active Listings"
        : "Pending Sales";

  const rangeLabel =
    params.range === "90d"
      ? "Last 90 Days"
      : params.range === "6mo"
        ? "Last 6 Months"
        : params.range === "12mo"
          ? "Last 12 Months"
          : "";

  const title = [
    location,
    marketLabel,
    propertyLabel,
    pageLabel,
    rangeLabel,
    "| SearchPV",
  ]
    .filter(Boolean)
    .join(" ");

  const description = `Explore ${location} ${pageLabel.toLowerCase()} for ${propertyLabel.toLowerCase()} properties, including prices, market activity, and Puerto Vallarta real estate trends.`;

  return {
    title,
    description,
    alternates: {
      canonical: params.canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `https://searchpv.com${params.canonicalPath}`,
      siteName: "SearchPV",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function clean(value?: string) {
  if (!value || value === "all") return "";
  return value;
}