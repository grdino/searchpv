import { permanentRedirect } from "next/navigation";

export default async function LegacyAreaPage({
  params,
}: {
  params: Promise<{
    zoneSlug: string;
    areaSlug: string;
  }>;
}) {
  const { zoneSlug, areaSlug } = await params;

  permanentRedirect(`/markets/${zoneSlug}/areas/${areaSlug}`);
}