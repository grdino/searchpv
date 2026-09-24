import type { Metadata } from "next";
import MarketDashboardsIndex from "./MarketDashboardsIndex";

export const metadata: Metadata = {
  title: "Market Dashboards | SearchPV",
  description: "Interactive real estate market dashboards for Puerto Vallarta and Riviera Nayarit, with current inventory, closed-sale trends, pricing and seller behavior.",
  alternates: { canonical: "https://searchpv.com/markets" },
  robots: { index: true, follow: true },
};

export default function MarketsPage() {
  return <MarketDashboardsIndex />;
}
