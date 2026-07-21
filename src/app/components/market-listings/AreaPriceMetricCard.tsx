import Link from "next/link";

type SummaryMode = "median" | "avg";
type AreaUnit = "ft2" | "m2";

type BedroomMetric = {
  label: string;
  value: string;
};

type AreaPriceMetricCardProps = {
  value: number | null;
  selectedMode: SummaryMode;
  selectedUnit: AreaUnit;
  medianHref: string;
  averageHref: string;
  squareFeetHref: string;
  squareMetersHref: string;
  byBedroom?: BedroomMetric[];
};

export default function AreaPriceMetricCard({
  value,
  selectedMode,
  selectedUnit,
  medianHref,
  averageHref,
  squareFeetHref,
  squareMetersHref,
  byBedroom = [],
}: AreaPriceMetricCardProps) {
  const modeLabel = selectedMode === "avg" ? "Average" : "Median";
  const unitLabel = selectedUnit === "m2" ? "m²" : "ft²";

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleLinks
            options={[
              {
                label: "Med",
                href: medianHref,
                selected: selectedMode === "median",
              },
              {
                label: "Avg",
                href: averageHref,
                selected: selectedMode === "avg",
              },
            ]}
          />

          <ToggleLinks
            options={[
              {
                label: "ft²",
                href: squareFeetHref,
                selected: selectedUnit === "ft2",
              },
              {
                label: "m²",
                href: squareMetersHref,
                selected: selectedUnit === "m2",
              },
            ]}
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {modeLabel} Price per {unitLabel}
      </p>

      <p className="mt-3 text-4xl font-bold text-slate-950">
        {formatMoney(value)}
      </p>

      {byBedroom.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            By Bedroom
          </p>

          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-700">
            {byBedroom.map((item, index) => (
              <span key={item.label}>
                {index > 0 && (
                  <span className="mr-2 text-slate-300">|</span>
                )}

                {item.label}{" "}

                <span className="font-bold text-slate-950">
                  {item.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ToggleLinks({
  options,
}: {
  options: {
    label: string;
    href: string;
    selected: boolean;
  }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-300 text-[10px] font-bold">
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          className={`px-2 py-1 ${
            option.selected
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}