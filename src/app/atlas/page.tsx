import type { Metadata } from "next";
import AtlasShell from "@/app/components/atlas/AtlasShell";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryParams = Object.keys(params).length > 0;

  return {
    title: "Explore Puerto Vallarta & Riviera Nayarit",
    description:
      "Explore Puerto Vallarta and Riviera Nayarit neighborhoods, communities, developments, listings, and market information with SearchPV Atlas.",
    alternates: {
      canonical: "https://searchpv.com/atlas",
    },
    robots: hasQueryParams
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default function AtlasPage() {
  return <AtlasShell />;
}