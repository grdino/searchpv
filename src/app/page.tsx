import type { Metadata } from "next";

import HomeDiscoveryBackdrop from "@/app/components/home/HomeDiscoveryBackdrop";

export const metadata: Metadata = {
  title: "Puerto Vallarta Real Estate | SearchPV",
  description:
    "Discover the bay, search properties, explore the Atlas map, and understand the Puerto Vallarta and Riviera Nayarit real estate market.",
  alternates: {
    canonical: "https://searchpv.com/",
  },
  openGraph: {
    title: "Puerto Vallarta Real Estate | SearchPV",
    description:
      "Discover Puerto Vallarta and Riviera Nayarit through properties, places, maps, and market intelligence.",
    url: "https://searchpv.com/",
    siteName: "SearchPV",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeDiscoveryBackdrop />;
}
