import type { Metadata } from "next";
import { Suspense } from "react";

import { MARKET_DASHBOARDS } from "@/lib/market-dashboard/listing-links";
import InteractiveMarketDashboard from "../[marketSlug]/InteractiveMarketDashboard";

const market = MARKET_DASHBOARDS["zona-romantica"];

export const metadata: Metadata = {
  title: `${market.title} | SearchPV`,
  description: market.description,
  robots: { index: false, follow: false },
};

/**
 * Compatibility shim for the existing published URL during regression testing.
 * It renders the same generic market engine used by /market/[marketSlug].
 */
export default function ZonaRomanticaMarketPage() {
  return (
    <Suspense fallback={null}>
      <InteractiveMarketDashboard market={market} />
    </Suspense>
  );
}
