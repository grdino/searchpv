import { supabase } from "@/lib/supabase";

export type CommunityProfile = {
  canonicalName: string;
  longitude: number | null;
  latitude: number | null;
  description: string;
};

const DESCRIPTIONS: Record<string, string> = {
  "versalles": "A central Puerto Vallarta neighborhood with established residential streets, newer condominium development, and a well-known dining scene.",
  "emiliano zapata": "A lively central community adjoining Puerto Vallarta's historic core, with restaurants, shops, nightlife, and a broad mix of condominium options.",
  "5 de diciembre": "A hillside-to-sea community just north of Centro, combining traditional neighborhood streets, local businesses, and newer condominium development.",
  "marina vallarta": "A master-planned waterfront community centered on the marina, with condominium buildings, restaurants, shops, golf, and convenient airport access.",
  "amapas": "A predominantly hillside community immediately south of the Romantic Zone, known for elevated settings, bay views, and condominium residences.",
  "zona dorada": "A coastal Bucerías community with beach access, restaurants, shops, and a mix of established homes and condominium development.",
  "nuevo nayarit": "A planned Riviera Nayarit resort and residential area with broad beaches, condominium communities, resorts, and access to the El Tigre area.",
  "bucerias": "A coastal Riviera Nayarit town with a walkable center, long beach, restaurants, shops, and residential neighborhoods extending inland.",
  "sayulita": "A compact Pacific coast town north of Banderas Bay known for its beach, surf culture, active town center, and varied residential settings.",
  "mezcales": "An inland Bahía de Banderas community near the main coastal corridor, with growing residential development and convenient access to surrounding Riviera Nayarit areas.",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("en").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hierarchyMentions(hierarchy: unknown, areaName: string | null, zoneName: string | null) {
  const text = JSON.stringify(hierarchy ?? "").toLocaleLowerCase("en");
  return [areaName, zoneName].filter(Boolean).every((value) => text.includes(normalize(String(value))));
}

export async function getCommunityProfile(name: string, areaName: string | null, zoneName: string | null): Promise<CommunityProfile> {
  const { data, error } = await supabase.rpc("resolve_geography", {
    p_search: name,
    p_expected_entity_type_cd: "CM",
    p_limit: 10,
  });

  const candidates = !error && Array.isArray(data) ? data as Array<{
    canonical_nm: string | null;
    longitude_nb: number | string | null;
    latitude_nb: number | string | null;
    hierarchy_js: unknown;
  }> : [];

  const target = normalize(name);
  const match = candidates.find((candidate) => candidate.canonical_nm && normalize(candidate.canonical_nm) === target && hierarchyMentions(candidate.hierarchy_js, areaName, zoneName))
    ?? candidates.find((candidate) => candidate.canonical_nm && normalize(candidate.canonical_nm) === target)
    ?? candidates[0];

  const canonicalName = match?.canonical_nm ?? name;
  const longitude = Number(match?.longitude_nb);
  const latitude = Number(match?.latitude_nb);
  const description = DESCRIPTIONS[normalize(canonicalName)]
    ?? `${canonicalName} is a community in ${[areaName, zoneName].filter(Boolean).join(", ")}. Use the current market summary and matching properties below to explore available options.`;

  return {
    canonicalName,
    longitude: Number.isFinite(longitude) ? longitude : null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    description,
  };
}
