import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function LegacyDevelopmentPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("development_snapshot")
    .select(
      "zone_slug, area_slug, community_slug, development_slug"
    )
    .eq("development_slug", slug)
    .eq("market_segment", "all")
    .eq("property_type_segment", "all");

  if (error) {
    throw new Error(
      `Unable to resolve legacy development route: ${error.message}`
    );
  }

  const paths = Array.from(
    new Set(
      (data ?? [])
        .filter(
          (row) =>
            row.zone_slug &&
            row.area_slug &&
            row.community_slug &&
            row.development_slug
        )
        .map(
          (row) =>
            `/markets/${row.zone_slug}/areas/${row.area_slug}/communities/${row.community_slug}/developments/${row.development_slug}`
        )
    )
  );

  if (paths.length !== 1) {
    notFound();
  }

  permanentRedirect(paths[0]);
}