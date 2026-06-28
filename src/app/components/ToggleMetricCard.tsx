"use client";

import { useState } from "react";

type Breakdown = {
  studio: number | null;
  oneBed: number | null;
  twoBed: number | null;
  threeBedPlus: number | null;
};

type ToggleOption = {
  key: string;
  label: string;
  value: number | null;
  breakdown: Breakdown;
  format: "money" | "priceMeasure";
};

export default function ToggleMetricCard({
  label,
  optionA,
  optionB,
}: {
  label: string;
  optionA: ToggleOption;
  optionB: ToggleOption;
}) {
  const [selected, setSelected] = useState(optionA.key);
  const current = selected === optionA.key ? optionA : optionB;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "28px 32px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <p className="text-sm text-slate-500">{label}</p>

        <div
          style={{
            display: "inline-flex",
            border: "1px solid #cbd5e1",
            borderRadius: "999px",
            overflow: "hidden",
            fontSize: "11px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {[optionA, optionB].map((option) => {
            const active = selected === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelected(option.key)}
                style={{
                  border: "none",
                  padding: "4px 10px",
                  cursor: "pointer",
                  backgroundColor: active ? "#0f172a" : "#ffffff",
                  color: active ? "#ffffff" : "#475569",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-4xl font-bold text-slate-900">
        {formatValue(current.value, current.format)}
      </p>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          By Bedroom
        </div>

        <div className="text-sm text-slate-600">
          Studio{" "}
          <strong>{formatValue(current.breakdown.studio, current.format)}</strong>
          {" │ "}
          1BR{" "}
          <strong>{formatValue(current.breakdown.oneBed, current.format)}</strong>
          {" │ "}
          2BR{" "}
          <strong>{formatValue(current.breakdown.twoBed, current.format)}</strong>
          {" │ "}
          3BR+{" "}
          <strong>
            {formatValue(current.breakdown.threeBedPlus, current.format)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function formatValue(
  value: number | null,
  format: "money" | "priceMeasure"
) {
  if (value === null || value === undefined) return "-";

  if (format === "money") {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  return "$" + Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}