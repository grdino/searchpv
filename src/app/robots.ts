import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/market-intelligence/active-listings/search-results",
        "/market-intelligence/pending-sales/search-results",
        "/market-intelligence/closed-sales/search-results",
        "/search-properties",
        "/contact-listing",
      ],
    },
    sitemap: "https://searchpv.com/sitemap.xml",
  };
}