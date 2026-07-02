import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = await getRows(searchParams);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Active Listings");

  sheet.columns = [
    { header: "MLS", key: "mls", width: 12 },
    { header: "Development", key: "development", width: 24 },
    { header: "Unit", key: "unit_id", width: 12 },
    { header: "Address", key: "address", width: 32 },
    { header: "Beds", key: "beds", width: 10 },
    { header: "Baths", key: "baths", width: 10 },
    { header: "SqFt", key: "sqft", width: 12 },
    { header: "m²", key: "sqm", width: 12 },
    { header: "Original Price", key: "original_price", width: 16 },
    { header: "Current Price", key: "current_price", width: 16 },
    { header: "Price Chg #", key: "price_changes", width: 12 },
    { header: "Price Chg $", key: "price_change_amount", width: 16 },
    { header: "Price Chg %", key: "price_change_percent", width: 14 },
    { header: "DOM", key: "dom", width: 10 },
  ];

  sheet.addRows(rows);

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  ["I", "J", "L"].forEach((col) => {
    sheet.getColumn(col).numFmt = "$#,##0;[Red]-$#,##0";
  });

  sheet.getColumn("M").numFmt = "0.00%;[Red]-0.00%";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="searchpv-active-listings.xlsx"`,
    },
  });
}

async function getRows(searchParams: URLSearchParams) {
  const sort = searchParams.get("sort") ?? "current_price";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  let query = supabase
    .from("active_listing")
    .select("*")
    .order(sort, { ascending: dir === "asc" });

  applyFilters(query, searchParams);

  const { data, error } = await query.limit(5000);
  if (error) throw error;

  return data ?? [];
}

function applyFilters(query: any, searchParams: URLSearchParams) {
  const zone = searchParams.get("zone");
  const area = searchParams.get("area");
  const community = searchParams.get("community");
  const development = searchParams.get("development");
  const propertyType = searchParams.get("propertyType");
  const marketType = searchParams.get("marketType");
  const beds = searchParams.get("beds");

  if (zone) query.eq("zone_name", zone);
  if (area) query.eq("area_name", area);
  if (community) query.eq("community_name", community);
  if (development) query.eq("development_name", development);
  if (propertyType) query.eq("prprty_type", propertyType);
  if (marketType) query.eq("market_type", marketType);

  if (beds === "0") query.eq("beds", 0);
  if (beds === "1") query.eq("beds", 1);
  if (beds === "2") query.eq("beds", 2);
  if (beds === "3plus") query.gte("beds", 3);
}