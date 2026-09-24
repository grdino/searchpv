import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MARKET_DASHBOARDS } from "@/lib/market-dashboard/listing-links";
import InteractiveMarketDashboard from "./InteractiveMarketDashboard";

const BASE_URL = "https://searchpv.com";

type PageProps = {
  params: Promise<{ marketSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { marketSlug } = await params;
  const query = await searchParams;
  const market = MARKET_DASHBOARDS[marketSlug];
  if (!market) return {};

  const hasFilters = Object.keys(query).length > 0;
  const indexable = market.published && market.indexable && !hasFilters;
  const canonical = `${BASE_URL}/market/${market.slug}`;

  return {
    title: `${market.title} | SearchPV`,
    description: market.description,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
  };
}

export default async function MarketPage({ params }: PageProps) {
  const { marketSlug } = await params;
  const market = MARKET_DASHBOARDS[marketSlug];
  if (!market || !market.published) notFound();

  return (
    <Suspense fallback={null}>
      <InteractiveMarketDashboard market={market} />
    </Suspense>
  );
}
