"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        border: "1px solid #c8d8d0",
        background: "#ffffff",
        borderRadius: "999px",
        padding: "8px 14px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Print / Save PDF
    </button>
  );
}