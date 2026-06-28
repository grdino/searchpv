import type { ReactNode } from "react";

export default function MetricCard({
  label,
  value,
  breakdown,
}: {
  label: string;
  value: ReactNode;
  breakdown?: {
    studio: ReactNode;
    oneBed: ReactNode;
    twoBed: ReactNode;
    threeBedPlus: ReactNode;
  };
}) {
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
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>

      {breakdown && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            By Bedroom
          </div>

          <div className="text-sm text-slate-600">
            Studio <strong>{breakdown.studio}</strong>
            {" │ "}
            1BR <strong>{breakdown.oneBed}</strong>
            {" │ "}
            2BR <strong>{breakdown.twoBed}</strong>
            {" │ "}
            3BR+ <strong>{breakdown.threeBedPlus}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
