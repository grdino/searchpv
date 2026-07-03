"use client";

import { useSearchParams } from "next/navigation";

export default function ReportExportButtons({
  reportKey,
}: {
  reportKey: string;
}) {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const excelHref = qs
    ? `/api/reports/${reportKey}/excel?${qs}`
    : `/api/reports/${reportKey}/excel`;

  const pdfHref = qs
    ? `/api/reports/${reportKey}/pdf?${qs}`
    : `/api/reports/${reportKey}/pdf`;

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <button type="button" onClick={() => window.print()} style={buttonStyle}>
        🖨 Print
      </button>

      <a href={pdfHref} style={buttonStyle}>
        📄 PDF
      </a>

      <a href={excelHref} style={buttonStyle}>
        📊 Excel
      </a>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  border: "1px solid #c8d8d0",
  background: "#ffffff",
  borderRadius: "999px",
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: "0.85rem",
  color: "#26352f",
  textDecoration: "none",
  cursor: "pointer",
};