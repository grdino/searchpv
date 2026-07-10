import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/market-intelligence/closed-sales/search-results",
      ],
    },
    sitemap: "https://searchpv.com/sitemap.xml",
  };
}