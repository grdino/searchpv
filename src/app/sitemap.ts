import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://searchpv.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type MarketActivityRow = {
  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
};

type AreaRow = MarketActivityRow & {
  zone_slug: string;
  area_slug: string;
  snapshot_date: string | null;
};

type CommunityRow = MarketActivityRow & {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  snapshot_date: string | null;
};

type DevelopmentRow = MarketActivityRow & {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
  snapshot_date: string | null;
};

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : undefined;
}

function hasMarketActivity(row: MarketActivityRow) {
  return (
    (row.active_count ?? 0) > 0 ||
    (row.pending_count ?? 0) > 0 ||
    (row.sales_12mo ?? 0) > 0
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    // Core Pages
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/search-properties`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // Market Intelligence
    {
      url: `${BASE_URL}/market-intelligence`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/market-intelligence/closed-sales`,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/market-intelligence/active-listings`,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/market-intelligence/pending-sales`,
      changeFrequency: "daily",
      priority: 0.85,
    },

    // Reports
    {
      url: `${BASE_URL}/reports`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/reports/active-listings-report`,
      changeFrequency: "daily",
      priority: 0.75,
    },
  ];

  const { data: areas } = await supabase
    .from("area_snapshot")
    .select(
      "zone_slug, area_slug, snapshot_date, active_count, pending_count, sales_12mo"
    )
    .eq("market_segment", "all")
    .eq("property_type_segment", "all")
    .returns<AreaRow[]>();

  areas
    ?.filter(hasMarketActivity)
    .forEach((area) => {
      urls.push({
        url: `${BASE_URL}/markets/${area.zone_slug}/areas/${area.area_slug}`,
        ...(asDate(area.snapshot_date)
          ? { lastModified: asDate(area.snapshot_date) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

  const { data: communities } = await supabase
    .from("community_snapshot")
    .select(
      "zone_slug, area_slug, community_slug, snapshot_date, active_count, pending_count, sales_12mo"
    )
    .eq("market_segment", "all")
    .eq("property_type_segment", "all")
    .returns<CommunityRow[]>();

  communities
    ?.filter(hasMarketActivity)
    .forEach((community) => {
      urls.push({
        url:
          `${BASE_URL}/markets/${community.zone_slug}` +
          `/areas/${community.area_slug}` +
          `/communities/${community.community_slug}`,
        ...(asDate(community.snapshot_date)
          ? { lastModified: asDate(community.snapshot_date) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    });

  const { data: developments } = await supabase
    .from("development_snapshot")
    .select(
      [
        "zone_slug",
        "area_slug",
        "community_slug",
        "development_slug",
        "snapshot_date",
        "active_count",
        "pending_count",
        "sales_12mo",
      ].join(", ")
    )
    .eq("market_segment", "all")
    .eq("property_type_segment", "all")
    .returns<DevelopmentRow[]>();

  developments
    ?.filter(hasMarketActivity)
    .forEach((development) => {
      urls.push({
        url:
          `${BASE_URL}/markets/${development.zone_slug}` +
          `/areas/${development.area_slug}` +
          `/communities/${development.community_slug}` +
          `/developments/${development.development_slug}`,
        ...(asDate(development.snapshot_date)
          ? { lastModified: asDate(development.snapshot_date) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

  return urls;
}