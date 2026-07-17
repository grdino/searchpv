"use client";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

import type {
  AgentDetailRow,
  AgentDetailSummary,
} from "./page";

type AgentDetailExportButtonsProps = {
  agentName: string;
  agencyName: string;
  rows: AgentDetailRow[];
  summary: AgentDetailSummary;

  selectedMarket: string;
  selectedPropertyType: string;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
  selectedStartDate: string;
  selectedEndDate: string;
};

export default function AgentDetailExportButtons({
  agentName,
  agencyName,
  rows,
  summary,
  selectedMarket,
  selectedPropertyType,
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
  selectedStartDate,
  selectedEndDate,
}: AgentDetailExportButtonsProps) {
  function downloadPdf() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SearchPV Office Analytics", 36, 38);

    doc.setFontSize(15);
    doc.text("Closed Sales by Agent", 36, 62);

    doc.setFontSize(13);
    doc.text(agentName, 36, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      agencyName || "Agency not provided",
      36,
      101,
    );

    const location = formatLocation({
      selectedZone,
      selectedArea,
      selectedCommunity,
      selectedDevelopment,
    });

    const filterLines = [
      `Date Range: ${
        formatDate(selectedStartDate) || "All Time"
      } through ${formatDate(selectedEndDate) || "Today"}`,
      `Market: ${formatMarket(selectedMarket)}`,
      `Property Type: ${formatPropertyType(
        selectedPropertyType,
      )}`,
      `Location: ${location}`,
    ];

    doc.setFontSize(9);

    filterLines.forEach((line, index) => {
      doc.text(line, 36, 122 + index * 14);
    });

    autoTable(doc, {
      startY: 185,

      head: [
        [
          "Transactions",
          "Transaction Volume",
          "Listing Sides",
          "Listing Volume",
          "Selling Sides",
          "Selling Volume",
          "Both Sides",
          "Total Sides",
          "Total Side Volume",
        ],
      ],

      body: [
        [
          formatNumber(summary.closedTransactions),
          formatMoney(summary.transactionVolume),
          formatNumber(summary.listingSides),
          formatMoney(summary.listingVolume),
          formatNumber(summary.sellingSides),
          formatMoney(summary.sellingVolume),
          formatNumber(summary.bothSides),
          formatNumber(summary.totalSides),
          formatMoney(summary.totalSideVolume),
        ],
      ],

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 4,
        valign: "middle",
      },

      headStyles: {
        fontStyle: "bold",
        halign: "center",
      },

      bodyStyles: {
        halign: "center",
      },

      margin: {
        left: 36,
        right: 36,
      },
    });

    const summaryTableEnd =
      (
        doc as jsPDF & {
          lastAutoTable?: {
            finalY: number;
          };
        }
      ).lastAutoTable?.finalY ?? 235;

    autoTable(doc, {
      startY: summaryTableEnd + 20,

      head: [
        [
          "MLS",
          "Sold Date",
          "Participation",
          "Development",
          "Unit",
          "Community",
          "Area",
          "Type",
          "Market",
          "Sold Price",
          "DOM",
          "Sold/List",
          "Above/Below",
          "Listing Agent",
          "Listing Agency",
          "Selling Agent",
          "Selling Agency",
        ],
      ],

      body: rows.map((row) => [
        row.lstng_nb ?? "",
        formatDate(row.sold_dt),
        row.participation_nm ?? "",
        row.development_nm ?? "",
        row.unit_id ?? "",
        row.community_nm ?? "",
        row.area_nm ?? "",
        row.prprty_type_cd ?? "",
        formatMarket(row.market_type_nm),
        formatMoney(row.sold_price_usd),
        formatNumber(row.dom_nb),
        formatRatioPercent(row.sold_to_list_pc),
        formatVariance(row.sold_vs_list_pc),
        row.listing_agent_nm ?? "",
        row.listing_agency_nm ?? "",
        row.selling_agent_nm ?? "",
        row.selling_agency_nm ?? "",
      ]),

      theme: "grid",

      styles: {
        fontSize: 5.5,
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "middle",
      },

      headStyles: {
        fontStyle: "bold",
        halign: "center",
      },

      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 43 },
        2: { cellWidth: 47 },
        3: { cellWidth: 54 },      // Development
        4: { cellWidth: 32 },      // Unit
        5: { cellWidth: 46 },      // Community
        6: { cellWidth: 40 },      // Area
        7: { cellWidth: 36 },      // Type
        8: { cellWidth: 40 },      // Market
        9: { cellWidth: 46, halign: "right" }, // Sold Price
        10:{ cellWidth: 24, halign: "right" }, // DOM
        11:{ cellWidth: 36, halign: "right" }, // Sold/List
        12:{ cellWidth: 40, halign: "right" }, // Above/Below
        13:{ cellWidth: 56 },      // Listing Agent
        14:{ cellWidth: 60 },      // Listing Agency
        15:{ cellWidth: 56 },      // Selling Agent
        16:{ cellWidth: 60 },      // Selling Agency
      },

      margin: {
        top: 30,
        left: 18,
        right: 18,
        bottom: 30,
      },

      didDrawPage: () => {
        const pageNumber = doc.getNumberOfPages();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        doc.text(
          `SearchPV Office Analytics • ${agentName}`,
          24,
          pageHeight - 16,
        );

        doc.text(
          `Page ${pageNumber}`,
          pageWidth - 24,
          pageHeight - 16,
          {
            align: "right",
          },
        );
      },
    });

    doc.save(
      `${buildFileName(agentName)}-closed-sales.pdf`,
    );
  }

  function downloadExcel() {
    const workbook = XLSX.utils.book_new();

    const summaryRows: (string | number | null)[][] = [
      ["SearchPV Office Analytics", ""],
      ["Closed Sales by Agent", ""],
      ["Agent", agentName],
      ["Agency", agencyName],
      [
        "Date Range",
        `${
          formatDate(selectedStartDate) || "All Time"
        } through ${
          formatDate(selectedEndDate) || "Today"
        }`,
      ],
      ["Market", formatMarket(selectedMarket)],
      [
        "Property Type",
        formatPropertyType(selectedPropertyType),
      ],
      [
        "Location",
        formatLocation({
          selectedZone,
          selectedArea,
          selectedCommunity,
          selectedDevelopment,
        }),
      ],
      [],
      ["Metric", "Value"],
      [
        "Closed Transactions",
        summary.closedTransactions,
      ],
      [
        "Transaction Volume",
        summary.transactionVolume,
      ],
      ["Listing Sides", summary.listingSides],
      ["Listing Volume", summary.listingVolume],
      ["Selling Sides", summary.sellingSides],
      ["Selling Volume", summary.sellingVolume],
      ["Both Sides", summary.bothSides],
      [
        "Both-Sides Percent",
        summary.bothSidesPercent / 100,
      ],
      ["Total Sides", summary.totalSides],
      [
        "Total Side Volume",
        summary.totalSideVolume,
      ],
      [
        "Side Capture Percent",
        summary.sideCapturePercent / 100,
      ],
      [
        "Average Sold Price",
        summary.averageSoldPrice,
      ],
      [
        "Median Sold Price",
        summary.medianSoldPrice,
      ],
      ["Average DOM", summary.averageDom],
      ["Median DOM", summary.medianDom],
      [
        "Average Sold/List",
        summary.averageSoldToList,
      ],
      [
        "Median Sold/List",
        summary.medianSoldToList,
      ],
    ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(summaryRows);

    summarySheet["!cols"] = [
      { wch: 26 },
      { wch: 42 },
    ];

    setCellFormat(
      summarySheet,
      "B12",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B14",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B16",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B18",
      "0.0%",
    );
    setCellFormat(
      summarySheet,
      "B20",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B21",
      "0.0%",
    );
    setCellFormat(
      summarySheet,
      "B22",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B23",
      "$#,##0",
    );
    setCellFormat(
      summarySheet,
      "B26",
      "0.0%",
    );
    setCellFormat(
      summarySheet,
      "B27",
      "0.0%",
    );

    const transactionRows = rows.map((row) => ({
      MLS: row.lstng_nb ?? "",
      "Sold Date": excelDate(row.sold_dt),
      Participation: row.participation_nm ?? "",
      Development: row.development_nm ?? "",
      Community: row.community_nm ?? "",
      Unit: row.unit_id ?? "",
      Area: row.area_nm ?? "",
      "Property Type": row.prprty_type_cd ?? "",
      Market: formatMarket(row.market_type_nm),
      "Sold Price": toNumber(row.sold_price_usd),
      DOM: toNumber(row.dom_nb),
      "Sold/List": toNumber(row.sold_to_list_pc),
      "Above/Below List":
        percentagePointsToRatio(row.sold_vs_list_pc),
      "Listing Agent": row.listing_agent_nm ?? "",
      "Listing Agency": row.listing_agency_nm ?? "",
      "Selling Agent": row.selling_agent_nm ?? "",
      "Selling Agency": row.selling_agency_nm ?? "",
    }));

    const transactionSheet =
      XLSX.utils.json_to_sheet(transactionRows);

    transactionSheet["!cols"] = [
      { wch: 12 },
      { wch: 13 },
      { wch: 16 },
      { wch: 24 }, // Development
      { wch: 10 }, // Unit
      { wch: 20 }, // Community
      { wch: 18 }, // Area
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 9 },
      { wch: 12 },
      { wch: 17 },
      { wch: 24 },
      { wch: 28 },
      { wch: 24 },
      { wch: 28 },
    ];

    const transactionRange =
      transactionSheet["!ref"];

    if (transactionRange) {
      const decodedRange =
        XLSX.utils.decode_range(transactionRange);

      for (
        let rowIndex = 1;
        rowIndex <= decodedRange.e.r;
        rowIndex += 1
      ) {
        setCellFormat(
          transactionSheet,
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: 1,
          }),
          "mmm d, yyyy",
        );

        setCellFormat(
          transactionSheet,
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: 8,
          }),
          "$#,##0",
        );

        setCellFormat(
          transactionSheet,
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: 10,
          }),
          "0.0%",
        );

        setCellFormat(
          transactionSheet,
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: 11,
          }),
          "0.0%",
        );
      }

      transactionSheet["!autofilter"] = {
        ref: transactionRange,
      };
    }

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      transactionSheet,
      "Transactions",
    );

    XLSX.writeFile(
      workbook,
      `${buildFileName(agentName)}-closed-sales.xlsx`,
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={rows.length === 0}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download PDF
      </button>

      <button
        type="button"
        onClick={downloadExcel}
        disabled={rows.length === 0}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download Excel
      </button>
    </div>
  );
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${month}/${day}/${year}`;
}

function excelDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day);
}

function formatMoney(
  value: number | string | null | undefined,
) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatNumber(
  value: number | string | null | undefined,
) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return "";
  }

  return numericValue.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

function formatRatioPercent(
  value: number | string | null | undefined,
) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function formatVariance(
  value: number | string | null | undefined,
) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return "";
  }

  return `${numericValue > 0 ? "+" : ""}${numericValue.toFixed(
    1,
  )}%`;
}

function formatMarket(
  value: string | null | undefined,
) {
  if (!value || value === "all") {
    return "All Markets";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (normalizedValue === "pre_construction") {
    return "Pre-Construction";
  }

  if (normalizedValue === "resale") {
    return "Resale";
  }

  return value;
}

function formatPropertyType(value: string) {
  if (value === "condos") {
    return "Condos";
  }

  if (value === "houses") {
    return "Houses";
  }

  return "All Property Types";
}

function formatLocation({
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
}: {
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
}) {
  const parts = [
    selectedZone !== "all" ? selectedZone : null,
    selectedArea !== "all" ? selectedArea : null,
    selectedCommunity !== "all"
      ? selectedCommunity
      : null,
    selectedDevelopment !== "all"
      ? selectedDevelopment
      : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0
    ? parts.join(" > ")
    : "All Locations";
}

function buildFileName(value: string) {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-");

  return cleaned || "agent";
}

function percentagePointsToRatio(
  value: number | string | null | undefined,
) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return null;
  }

  return numericValue / 100;
}

function toNumber(
  value: number | string | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}

function setCellFormat(
  sheet: XLSX.WorkSheet,
  address: string,
  format: string,
) {
  const cell = sheet[address];

  if (cell) {
    cell.z = format;
  }
}