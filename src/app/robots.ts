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
        "/contact-listing",
        "/ask-searchpv",
      ],
    },
    sitemap: "https://searchpv.com/sitemap.xml",
  };
}