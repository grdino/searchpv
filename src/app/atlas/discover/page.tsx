import type { Metadata } from "next";
import AtlasShell from "@/app/components/atlas/AtlasShell";

export const metadata: Metadata = {
  title: "Discover Puerto Vallarta & Riviera Nayarit",
  alternates: {
    canonical: "https://searchpv.com/atlas",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AtlasDiscoverPage() {
  return <AtlasShell discoveryMode />;
}