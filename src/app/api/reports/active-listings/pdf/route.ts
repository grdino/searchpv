import { NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = await getRows(searchParams);

  const doc = new PDFDocument({
    size: "LETTER",
    layout: "landscape",
    margin: 24,
  });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => {});

  doc.fontSize(18).text("SearchPV Active Listings Report");
  doc.moveDown(0.4);
  doc.fontSize(9).text(`Generated: ${new Date().toLocaleDateString("en-US")}`);
  doc.moveDown(0.8);

  const headers = [
    "MLS",
    "Development",
    "Unit",
    "Beds",
    "Baths",
    "SqFt",
    "Current",
    "Chg $",
    "Chg %",
    "DOM",
  ];

  const widths = [48, 120, 45, 35, 35, 55, 70, 70, 50, 35];

  drawHeader(doc, headers, widths);

  rows.forEach((row: any) => {
    if (doc.y > 560) {
      doc.addPage();
      drawHeader(doc, headers, widths);
    }

    const values = [
      row.mls ?? "",
      row.development ?? "",
      row.unit_id ?? "",
      row.beds ?? "",
      row.baths ?? "",
      formatNumber(row.sqft),
      formatCurrency(row.current_price),
      formatCurrency(row.price_change_amount),
      formatPercent(row.price_change_percent),
      row.dom ?? "",
    ];

    drawRow(doc, values, widths);
  });

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="searchpv-active-listings.pdf"`,
    },
  });
}

function drawHeader(doc: PDFKit.PDFDocument, headers: string[], widths: number[]) {
  doc.fontSize(8).font("Helvetica-Bold");

  const startX = doc.page.margins.left;
  const startY = doc.y;
  let x = startX;

  headers.forEach((header, index) => {
    doc.text(header, x, startY, {
      width: widths[index],
      height: 12,
      ellipsis: true,
      lineBreak: false,
    });

    x += widths[index];
  });

  doc
    .moveTo(startX, startY + 14)
    .lineTo(760, startY + 14)
    .stroke();

  doc.y = startY + 18;
  doc.font("Helvetica");
}

function drawRow(doc: PDFKit.PDFDocument, values: string[], widths: number[]) {
  doc.fontSize(7);

  const y = doc.y;
  let x = doc.page.margins.left;

  values.forEach((value, index) => {
    doc.text(String(value), x, y, {
      width: widths[index],
      height: 18,
      ellipsis: true,
    });
    x += widths[index];
  });

  doc.y = y + 18;
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

function formatCurrency(value: number | null) {
  if (value == null) return "";
  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value: number | null) {
  if (value == null) return "";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(value: number | null) {
  if (value == null) return "";
  return `${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}%`;
}