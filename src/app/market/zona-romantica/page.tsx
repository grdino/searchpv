import type { Metadata } from "next";
import InteractiveMarketDashboard from "./InteractiveMarketDashboard";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Zona Romántica Real Estate Market | SearchPV",
  description:
    "Explore active inventory, closed sales, pricing, seller behavior and market direction for Zona Romántica in Puerto Vallarta.",
  robots: { index: false, follow: false },
};

export default function ZonaRomanticaMarketPage() {
  return (
    <Suspense fallback={null}>
      <InteractiveMarketDashboard />
    </Suspense>
  );
}