import { NextRequest, NextResponse } from "next/server";
import { buildIdxUrl } from "@/lib/idx";
import { createClient } from "@/lib/supabase/server";
import {
  MARKET_DASHBOARDS,
  type DashboardBedrooms,
  type DashboardListingStatus,
  type DashboardPropertyType,
  type DashboardSegment,
} from "@/lib/market-dashboard/listing-links";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const market = MARKET_DASHBOARDS[search.get("market") ?? ""];
  const status = parseStatus(search.get("status"));
  const propertyType = parsePropertyType(search.get("property"));
  const bedrooms = parseBedrooms(search.get("bedrooms"));
  const segment = parseSegment(search.get("segment"));
  if (!market || !status || !propertyType || !bedrooms || !segment) return NextResponse.json({ error: "Invalid market listing selection." }, { status: 400 });

  const geos = market.geographies.length ? market.geographies : [market.geography];
  if (!geos.every(g => g.zone === geos[0].zone && g.area === geos[0].area)) {
    return NextResponse.json({ error: "Multi-area market listing selection is not supported yet." }, { status: 400 });
  }

  const supabase = await createClient();
  const table = status === "active" ? "active_listing" : "pending_listing";
  let query: any = supabase.from(table).select("mls")
    .eq("zone_name", geos[0].zone)
    .eq("area_name", geos[0].area)
    .in("community_name", geos.map(g => g.community))
    .eq("prprty_type", propertyType === "Condo" ? "Condos" : "Houses");

  const bedroom = bedroomSegment(bedrooms);
  if (bedroom) query = query.eq("bedroom_segment", bedroom);
  if (segment !== "Both") query = query.eq("market_segment", segment === "Resale" ? "resale" : "pre_construction");
  const minPrice = parseOptionalNumber(search.get("minPrice"));
  const maxPrice = parseOptionalNumber(search.get("maxPrice"));
  if (minPrice !== null) query = query.gte("current_price", minPrice);
  if (maxPrice !== null) query = query.lte("current_price", maxPrice);

  const { data, error } = await query;
  if (error) {
    console.error("Market listing redirect failed", error);
    return NextResponse.json({ error: "Unable to load matching listings." }, { status: 500 });
  }
  const ids = (data || []).map((r: any) => String(r.mls)).filter(Boolean);
  if (!ids.length) {
    const fallback = new URL(`/market/${market.slug}`, request.url);
    fallback.searchParams.set("property", propertyType); fallback.searchParams.set("bedrooms", bedrooms); fallback.searchParams.set("segment", segment); fallback.hash = "market-snapshot";
    return NextResponse.redirect(fallback);
  }
  return NextResponse.redirect(buildIdxUrl(ids.join(",")));
}
function parseStatus(v:string|null):DashboardListingStatus|null{return v==="active"||v==="pending"?v:null}
function parsePropertyType(v:string|null):DashboardPropertyType|null{return v==="Condo"||v==="House"?v:null}
function parseBedrooms(v:string|null):DashboardBedrooms|null{return v==="All"||v==="Studio"||v==="1 BR"||v==="2 BR"||v==="3+ BR"?v:null}
function parseSegment(v:string|null):DashboardSegment|null{return v==="Both"||v==="Resale"||v==="Pre-sale"?v:null}
function bedroomSegment(v:DashboardBedrooms){return v==="Studio"?"0br":v==="1 BR"?"1br":v==="2 BR"?"2br":v==="3+ BR"?"3br_plus":null}
function parseOptionalNumber(v:string|null){if(v===null||v==="")return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}
