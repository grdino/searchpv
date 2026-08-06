"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SummaryMode = "avg" | "median";
type AreaUnit = "ft2" | "m2";

type PropertySearchMarketStatisticsProps = {
  activeCount: number;
  pendingCount: number;

  activeListingHref?: string | null;
  pendingListingHref?: string | null;

  averageListPrice: number | null;
  medianListPrice: number | null;

  averageListPricePerSqft: number | null;
  medianListPricePerSqft: number | null;

  averageListPricePerSqm: number | null;
  medianListPricePerSqm: number | null;
};

export default function PropertySearchMarketStatistics({
  activeCount,
  pendingCount,
  activeListingHref,
  pendingListingHref,
  averageListPrice,
  medianListPrice,
  averageListPricePerSqft,
  medianListPricePerSqft,
  averageListPricePerSqm,
  medianListPricePerSqm,
}: PropertySearchMarketStatisticsProps) {
  const [listPriceMode, setListPriceMode] =
    useState<SummaryMode>("median");

  const [measureMode, setMeasureMode] =
    useState<SummaryMode>("median");

  const [areaUnit, setAreaUnit] =
    useState<AreaUnit>("ft2");

  const displayedListPrice =
    listPriceMode === "avg"
      ? averageListPrice
      : medianListPrice;

  const displayedPricePerMeasure =
    areaUnit === "m2"
      ? measureMode === "avg"
        ? averageListPricePerSqm
        : medianListPricePerSqm
      : measureMode === "avg"
        ? averageListPricePerSqft
        : medianListPricePerSqft;

  return (
    <section className="mt-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
        FILTERED MARKET SNAPSHOT
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatisticCard
          label="Active Listings"
          value={activeCount.toLocaleString("en-US")}
          href={activeListingHref}
        />

        <StatisticCard
          label="Pending Listings"
          value={pendingCount.toLocaleString("en-US")}
          href={pendingListingHref}
        />

        <StatisticCard
          label="List Price"
          value={formatMoney(displayedListPrice)}
          controls={
            <ToggleControl
              options={[
                {
                  label: "Avg",
                  value: "avg",
                },
                {
                  label: "Median",
                  value: "median",
                },
              ]}
              selected={listPriceMode}
              onChange={(value) =>
                setListPriceMode(value as SummaryMode)
              }
            />
          }
        />

        <StatisticCard
          label="$/Measure"
          value={formatPricePerMeasure(
            displayedPricePerMeasure,
            areaUnit
          )}
          controls={
            <div className="flex flex-wrap justify-center gap-2">
              <ToggleControl
                options={[
                  {
                    label: "Avg",
                    value: "avg",
                  },
                  {
                    label: "Median",
                    value: "median",
                  },
                ]}
                selected={measureMode}
                onChange={(value) =>
                  setMeasureMode(value as SummaryMode)
                }
              />

              <ToggleControl
                options={[
                  {
                    label: "Ft²",
                    value: "ft2",
                  },
                  {
                    label: "M²",
                    value: "m2",
                  },
                ]}
                selected={areaUnit}
                onChange={(value) =>
                  setAreaUnit(value as AreaUnit)
                }
              />
            </div>
          }
        />
      </div>
    </section>
  );
}

function StatisticCard({
  label,
  value,
  href,
  controls,
}: {
  label: string;
  value: string;
  href?: string | null;
  controls?: ReactNode;
}) {
  const valueContent = href ? (
    <a
      href={href}
      className="text-blue-700 hover:underline"
    >
      {value}
    </a>
  ) : (
    value
  );

  return (
    <div className="flex min-h-[122px] flex-col rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="mt-3 text-xl font-bold leading-none text-slate-950"
        >
          {valueContent}
        </motion.div>
      </AnimatePresence>

      {controls && (
        <div className="mt-auto pt-3">
          {controls}
        </div>
      )}
    </div>
  );
}

function ToggleControl({
  options,
  selected,
  onChange,
}: {
  options: Array<{
    label: string;
    value: string;
  }>;
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-0.5">
      {options.map((option) => {
        const isSelected =
          selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              isSelected
                ? "rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white"
                : "rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function formatMoney(
  value: number | null
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPricePerMeasure(
  value: number | null,
  unit: AreaUnit
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const formatted = Number(value).toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  );

  return `${formatted}/${
    unit === "m2" ? "m²" : "ft²"
  }`;
}