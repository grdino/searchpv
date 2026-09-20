import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PropertyType = "Condo" | "House";
type Bedrooms = "All" | "Studio" | "1 BR" | "2 BR" | "3+ BR";
type Segment = "Both" | "Resale" | "Pre-sale";

const GEO = {
  zone: "Puerto Vallarta",
  area: "Centro South",
  community: "Emiliano Zapata",
};

const bedroomMap: Record<Bedrooms, string | null> = {
  All: null,
  Studio: "0br",
  "1 BR": "1br",
  "2 BR": "2br",
  "3+ BR": "3br_plus",
};

const propertyPublicMap: Record<PropertyType, string> = {
  Condo: "condos",
  House: "houses",
};

const propertyHistoryMap: Record<PropertyType, string> = {
  Condo: "Condos",
  House: "Houses",
};

const segmentMap: Record<Segment, string | null> = {
  Both: null,
  Resale: "resale",
  "Pre-sale": "pre_construction",
};

function median(values: Array<number | null | undefined>) {
  const xs = values
    .map(Number)
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

export async function GET(request: NextRequest) {
  const property = (request.nextUrl.searchParams.get("property") || "Condo") as PropertyType;
  const bedrooms = (request.nextUrl.searchParams.get("bedrooms") || "All") as Bedrooms;
  const segment = (request.nextUrl.searchParams.get("segment") || "Both") as Segment;

  if (!(property in propertyPublicMap) || !(bedrooms in bedroomMap) || !(segment in segmentMap)) {
    return NextResponse.json({ error: "Invalid market selection." }, { status: 400 });
  }

  const supabase = await createClient();
  const propertyPublic = propertyPublicMap[property];
  const propertyHistory = propertyHistoryMap[property];
  const bedroom = bedroomMap[bedrooms];
  const marketSegment = segmentMap[segment];

  const applyInventoryFilters = (query: any) => {
    let q = query
      .eq("zone_name", GEO.zone)
      .eq("area_name", GEO.area)
      .eq("community_name", GEO.community)
      .eq("prprty_type", propertyHistory);
    if (bedroom) q = q.eq("bedroom_segment", bedroom);
    if (marketSegment) q = q.eq("market_segment", marketSegment);
    return q;
  };

  const applyClosedFilters = (query: any) => {
    let q = query
      .eq("zone_name", GEO.zone)
      .eq("area_name", GEO.area)
      .eq("community_name", GEO.community)
      .eq("property_type_segment", propertyPublic);
    if (bedroom) q = q.eq("bedroom_segment", bedroom);
    if (marketSegment) q = q.eq("market_segment", marketSegment);
    return q;
  };

  const activePromise = applyInventoryFilters(
    supabase
      .from("active_listing")
      .select("mls,current_price,price_per_sqm,dom,bedroom_segment,market_segment,snapshot_date,data_current_as_of")
  );

  const pendingPromise = applyInventoryFilters(
    supabase
      .from("pending_listing")
      .select("mls,current_price,price_per_sqm,dom,bedroom_segment,market_segment,snapshot_date,data_current_as_of")
  );

  const fiveYearsAgo = new Date();
  fiveYearsAgo.setUTCFullYear(fiveYearsAgo.getUTCFullYear() - 5);
  const closedSelect = "sold_date,sold_price,sold_price_per_sqm,days_on_market,original_list_price,final_list_price,sold_to_final_list_pct,sold_to_original_list_pct,bedroom_segment,market_segment,market_snapshot_date,data_current_as_of";

  const loadClosedHistory = async () => {
    const pageSize = 1000;
    const rows: any[] = [];

    for (let from = 0; ; from += pageSize) {
      const result = await applyClosedFilters(
        supabase
          .from("closed_listing")
          .select(closedSelect)
          .gte("sold_date", fiveYearsAgo.toISOString().slice(0, 10))
          .order("sold_date", { ascending: true })
          .range(from, from + pageSize - 1)
      );

      if (result.error) return { data: null, error: result.error };

      const page = result.data || [];
      rows.push(...page);

      if (page.length < pageSize) break;
    }

    return { data: rows, error: null };
  };

  const closedPromise = loadClosedHistory();

  const historyArgs = {
    p_market_segment: marketSegment,
    p_property_type: propertyHistory,
    p_bedroom_segment: bedroom,
    p_zone_name: GEO.zone,
    p_area_name: GEO.area,
    p_community_name: GEO.community,
    p_development_name: null,
  };

  const [activeResult, pendingResult, closedResult, activeHistoryResult, pendingHistoryResult] = await Promise.all([
    activePromise,
    pendingPromise,
    closedPromise,
    supabase.rpc("active_listing_history_summary", historyArgs),
    supabase.rpc("pending_sales_history_summary", historyArgs),
  ]);

  const firstError = [activeResult, pendingResult, closedResult, activeHistoryResult, pendingHistoryResult]
    .map((r: any) => r.error)
    .find(Boolean);

  if (firstError) {
    console.error("Zona Romantica market dashboard query failed", firstError);
    return NextResponse.json({ error: firstError.message || "Market data query failed." }, { status: 500 });
  }

  const active = activeResult.data || [];
  const pending = pendingResult.data || [];
  const closed = closedResult.data || [];
  const activeHistory = activeHistoryResult.data || [];
  const pendingHistory = pendingHistoryResult.data || [];

  const latestDate = [
    ...active.map((r: any) => r.snapshot_date),
    ...pending.map((r: any) => r.snapshot_date),
    ...closed.map((r: any) => r.market_snapshot_date),
  ].filter(Boolean).sort().at(-1) || null;

  const cutoff12 = latestDate
    ? new Date(`${latestDate}T00:00:00Z`)
    : new Date();
  cutoff12.setUTCFullYear(cutoff12.getUTCFullYear() - 1);
  const cutoff12Text = cutoff12.toISOString().slice(0, 10);
  const sold12 = closed.filter((r: any) => r.sold_date >= cutoff12Text);

  const priceBands = [
    { label: "<$400K", count: active.filter((r: any) => Number(r.current_price) < 400000).length },
    { label: "$400–600K", count: active.filter((r: any) => Number(r.current_price) >= 400000 && Number(r.current_price) < 600000).length },
    { label: "$600–800K", count: active.filter((r: any) => Number(r.current_price) >= 600000 && Number(r.current_price) < 800000).length },
    { label: "$800K–1M", count: active.filter((r: any) => Number(r.current_price) >= 800000 && Number(r.current_price) < 1000000).length },
    { label: "$1M+", count: active.filter((r: any) => Number(r.current_price) >= 1000000).length },
  ];

  const compositionKeys = [
    ["0br", "Studio"],
    ["1br", "1 BR"],
    ["2br", "2 BR"],
    ["3br_plus", "3+ BR"],
  ] as const;
  const composition = compositionKeys.map(([key, label]) => ({
    label,
    count: active.filter((r: any) => r.bedroom_segment === key).length,
  }));

  const monthly = new Map<string, any[]>();
  for (const row of closed) {
    const key = monthKey(row.sold_date);
    const bucket = monthly.get(key) || [];
    bucket.push(row);
    monthly.set(key, bucket);
  }
  const soldMonthly = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => ({
    date: `${key}-01`,
    label: monthLabel(key),
    soldPricePerSqm: median(rows.map((r: any) => r.sold_price_per_sqm)),
    closedSales: rows.length,
    dom: median(rows.map((r: any) => r.days_on_market)),
  }));

  const soldQuarterlyMap = new Map<string, any[]>();
  const soldYearlyMap = new Map<string, any[]>();
  for (const row of closed) {
    const soldDate = new Date(`${row.sold_date}T00:00:00Z`);
    const year = soldDate.getUTCFullYear();
    const quarter = Math.floor(soldDate.getUTCMonth() / 3) + 1;
    const quarterKey = `${year}-Q${quarter}`;
    const quarterBucket = soldQuarterlyMap.get(quarterKey) || [];
    quarterBucket.push(row);
    soldQuarterlyMap.set(quarterKey, quarterBucket);

    const yearKey = String(year);
    const yearBucket = soldYearlyMap.get(yearKey) || [];
    yearBucket.push(row);
    soldYearlyMap.set(yearKey, yearBucket);
  }

  const soldQuarterly = [...soldQuarterlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => ({
      key,
      soldPricePerSqm: median(rows.map((r: any) => r.sold_price_per_sqm)),
      closedSales: rows.length,
      dom: median(rows.map((r: any) => r.days_on_market)),
    }));

  const soldYearly = [...soldYearlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => ({
      year: Number(key),
      soldPricePerSqm: median(rows.map((r: any) => r.sold_price_per_sqm)),
      closedSales: rows.length,
      dom: median(rows.map((r: any) => r.days_on_market)),
    }));

  let priorYearMtd = null;
  if (latestDate) {
    const asOfDate = new Date(`${latestDate}T00:00:00Z`);
    const priorYear = asOfDate.getUTCFullYear() - 1;
    const priorMonth = asOfDate.getUTCMonth();
    const priorDay = asOfDate.getUTCDate();
    const priorStart = `${priorYear}-${String(priorMonth + 1).padStart(2, "0")}-01`;
    const priorEnd = `${priorYear}-${String(priorMonth + 1).padStart(2, "0")}-${String(priorDay).padStart(2, "0")}`;
    const rows = closed.filter((row: any) => row.sold_date >= priorStart && row.sold_date <= priorEnd);

    priorYearMtd = {
      date: priorStart,
      throughDate: priorEnd,
      soldPricePerSqm: median(rows.map((row: any) => row.sold_price_per_sqm)),
      closedSales: rows.length,
      dom: median(rows.map((row: any) => row.days_on_market)),
    };
  }

  let priorYearYtd = null;
  if (latestDate) {
    const asOfDate = new Date(`${latestDate}T00:00:00Z`);
    const priorYear = asOfDate.getUTCFullYear() - 1;
    const priorStart = `${priorYear}-01-01`;
    const priorEnd = `${priorYear}-${String(asOfDate.getUTCMonth() + 1).padStart(2, "0")}-${String(asOfDate.getUTCDate()).padStart(2, "0")}`;
    const rows = closed.filter((row: any) => row.sold_date >= priorStart && row.sold_date <= priorEnd);

    priorYearYtd = {
      date: priorStart,
      throughDate: priorEnd,
      soldPricePerSqm: median(rows.map((row: any) => row.sold_price_per_sqm)),
      closedSales: rows.length,
      dom: median(rows.map((row: any) => row.days_on_market)),
    };
  }

  const sellerRows = sold12.filter((r: any) => Number(r.sold_price) > 0);
  const acceptance = (field: "sold_to_final_list_pct" | "sold_to_original_list_pct") => {
    const vals = sellerRows.map((r: any) => Number(r[field])).filter(Number.isFinite);
    return {
      median: median(vals),
      bands: [
        { label: "<90%", count: vals.filter((v: number) => v < 90).length },
        { label: "90–94%", count: vals.filter((v: number) => v >= 90 && v < 95).length },
        { label: "95–99%", count: vals.filter((v: number) => v >= 95 && v < 100).length },
        { label: "100%+", count: vals.filter((v: number) => v >= 100).length },
      ],
    };
  };

  return NextResponse.json({
    geography: { ...GEO, publicName: "Zona Romántica" },
    selection: { property, bedrooms, segment },
    asOf: latestDate,
    current: {
      active: active.length,
      pending: pending.length,
      sold12m: sold12.length,
      medianSold12m: median(sold12.map((r: any) => r.sold_price)),
    },
    priceBands,
    composition,
    history: {
      soldMonthly,
      soldQuarterly,
      soldYearly,
      priorYearMtd,
      priorYearYtd,
      active: activeHistory,
      pending: pendingHistory,
    },
    sellerBehavior: {
      finalAsking: acceptance("sold_to_final_list_pct"),
      originalAsking: acceptance("sold_to_original_list_pct"),
      sampleSize: sellerRows.length,
    },
  });
}
