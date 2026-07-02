import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = await getRows(searchParams);

  const reportGeneratedAt = formatDateTime(new Date().toISOString());
  const dataCurrentAsOf = formatDateTime(rows[0]?.data_current_as_of ?? null);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Active Listings");

  sheet.columns = [
    { key: "mls", width: 12 },
    { key: "development", width: 24 },
    { key: "unit_id", width: 12 },
    { key: "address", width: 32 },
    { key: "beds", width: 10 },
    { key: "baths", width: 10 },
    { key: "sqft", width: 12 },
    { key: "sqm", width: 12 },
    { key: "original_price", width: 16 },
    { key: "current_price", width: 16 },
    { key: "price_changes", width: 12 },
    { key: "price_change_amount", width: 16 },
    { key: "price_change_percent", width: 14 },
    { key: "dom", width: 10 },
  ];

  sheet.mergeCells("A1:N1");
  sheet.getCell("A1").value = "SearchPV Active Listings Report";

  sheet.mergeCells("A2:N2");
  sheet.getCell("A2").value =
    "Current active listings with sortable pricing, size, price changes and DOM.";

  sheet.mergeCells("A3:N3");
  sheet.getCell("A3").value = `Data Current As Of: ${dataCurrentAsOf}`;

  sheet.mergeCells("A4:N4");
  sheet.getCell("A4").value = `Report Generated: ${reportGeneratedAt}`;

  sheet.addRow([]);

  sheet.addRow([
    "MLS",
    "Development",
    "Unit",
    "Address",
    "Beds",
    "Baths",
    "SqFt",
    "m²",
    "Original Price",
    "Current Price",
    "Price Chg #",
    "Price Chg $",
    "Price Chg %",
    "DOM",
  ]);

  sheet.addRows(
    rows.map((row) => ({
      ...row,
      price_change_percent:
        row.price_change_percent == null
          ? null
          : Number(row.price_change_percent) / 100,
    }))
  );

  sheet.getCell("A1").font = { bold: true, size: 16 };
  sheet.getCell("A2").font = { italic: true };
  sheet.getCell("A3").font = { bold: true };
  sheet.getCell("A4").font = { bold: true };
  sheet.getRow(6).font = { bold: true };

  sheet.views = [{ state: "frozen", ySplit: 6 }];

  ["I", "J", "L"].forEach((col) => {
    sheet.getColumn(col).numFmt = "$#,##0;[Red]-$#,##0";
  });

  sheet.getColumn("M").numFmt = "0.00%;[Red]-0.00%";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
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

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}