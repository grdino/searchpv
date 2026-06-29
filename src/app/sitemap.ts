import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://searchpv.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type AreaRow = {
  zone_slug: string;
  area_slug: string;
  snapshot_date: string | null;
};

type CommunityRow = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  snapshot_date: string | null;
};

type DevelopmentSnapshotRow = {
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
  snapshot_date: string | null;
  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
};

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : new Date();
}

function hasMarketActivity(development: DevelopmentSnapshotRow) {
  return (
    (development.active_count ?? 0) > 0 ||
    (development.pending_count ?? 0) > 0 ||
    (development.sales_12mo ?? 0) > 0
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact-listing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const { data: areas } = await supabase
    .from("area_snapshot")
    .select("zone_slug, area_slug, snapshot_date")
    .eq("market_segment", "all")
    .eq("property_type_segment", "all")
    .returns<AreaRow[]>();

  areas?.forEach((area) => {
    urls.push({
      url: `${BASE_URL}/markets/${area.zone_slug}/areas/${area.area_slug}`,
      lastModified: asDate(area.snapshot_date),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  });

  const { data: communities } = await supabase
    .from("community_snapshot")
    .select("zone_slug, area_slug, community_slug, snapshot_date")
    .eq("market_segment", "all")
    .eq("property_type_segment", "all")
    .returns<CommunityRow[]>();

  communities?.forEach((community) => {
    urls.push({
      url:
        `${BASE_URL}/markets/${community.zone_slug}` +
        `/areas/${community.area_slug}` +
        `/communities/${community.community_slug}`,
      lastModified: asDate(community.snapshot_date),
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
    .returns<DevelopmentSnapshotRow[]>();

  developments?.filter(hasMarketActivity).forEach((development) => {
    urls.push({
      url:
        `${BASE_URL}/markets/${development.zone_slug}` +
        `/areas/${development.area_slug}` +
        `/communities/${development.community_slug}` +
        `/developments/${development.development_slug}`,
      lastModified: asDate(development.snapshot_date),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  return urls;
}