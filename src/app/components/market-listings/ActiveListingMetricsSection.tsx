"use client";

import { useState } from "react";
import Link from "next/link";

import AreaPriceMetricCard from "./AreaPriceMetricCard";
import MarketListingHistoryChart from "./MarketListingHistoryChart";
import type { ChartMetric } from "./market-listing-metrics";

type BedroomMetric = {
  label: string;
  value: string;
  href?: string;
};

type HistoryRow = {
  snapshot_date: string | null;
  active_listing_count: number | string | null;
  inventory_value?: number | string | null;
  median_list_price?: number | string | null;
  median_price_per_sqft?: number | string | null;
  median_price_per_sqm?: number | string | null;
  median_dom?: number | string | null;
};

type SummaryMode = "median" | "avg";
type AreaUnit = "ft2" | "m2";

type ActiveListingMetricsSectionProps = {
  historyRows: HistoryRow[];

  activeListingCount: string;
  activeListingHref: string;
  countByBedroom: BedroomMetric[];

  inventoryValue: string;
  volumeByBedroom: BedroomMetric[];

  listPriceLabel: string;
  listPriceValue: string;
  selectedPriceMode: SummaryMode;
  medianPriceHref: string;
  averagePriceHref: string;
  priceByBedroom: BedroomMetric[];

  areaPriceValue: number | null;
  selectedAreaMode: SummaryMode;
  selectedAreaUnit: AreaUnit;
  areaMedianHref: string;
  areaAverageHref: string;
  squareFeetHref: string;
  squareMetersHref: string;
  areaPriceByBedroom: BedroomMetric[];

  medianDom: string;
  domByBedroom: BedroomMetric[];
};

export default function ActiveListingMetricsSection({
  historyRows,

  activeListingCount,
  activeListingHref,
  countByBedroom,

  inventoryValue,
  volumeByBedroom,

  listPriceLabel,
  listPriceValue,
  selectedPriceMode,
  medianPriceHref,
  averagePriceHref,
  priceByBedroom,

  areaPriceValue,
  selectedAreaMode,
  selectedAreaUnit,
  areaMedianHref,
  areaAverageHref,
  squareFeetHref,
  squareMetersHref,
  areaPriceByBedroom,

  medianDom,
  domByBedroom,
}: ActiveListingMetricsSectionProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<ChartMetric>("active_listing_count");

  return (
    <>
      <div className="mx-auto max-w-4xl">
        <MarketListingHistoryChart
          rows={historyRows}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
      </div>

      <div
        id="active-listing-summary"
        className="scroll-mt-24 mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        <MetricCardButton
          metric="active_listing_count"
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        >
          <SummaryCard
            label="Active Listings"
            value={activeListingCount}
            valueHref={activeListingHref}
            byBedroom={countByBedroom}
          />
        </MetricCardButton>

        <MetricCardButton
          metric="inventory_value"
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        >
          <SummaryCard
            label="Inventory Value"
            value={inventoryValue}
            byBedroom={volumeByBedroom}
          />
        </MetricCardButton>

        <MetricCardButton
          metric="median_list_price"
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        >
          <SummaryCard
            label={listPriceLabel}
            value={listPriceValue}
            controls={
              <ToggleLinks
                options={[
                  {
                    label: "Med",
                    href: medianPriceHref,
                    selected: selectedPriceMode === "median",
                  },
                  {
                    label: "Avg",
                    href: averagePriceHref,
                    selected: selectedPriceMode === "avg",
                  },
                ]}
              />
            }
            byBedroom={priceByBedroom}
          />
        </MetricCardButton>

        <MetricCardButton
          metric="median_price_per_sqm"
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        >
          <AreaPriceMetricCard
            value={areaPriceValue}
            selectedMode={selectedAreaMode}
            selectedUnit={selectedAreaUnit}
            medianHref={areaMedianHref}
            averageHref={areaAverageHref}
            squareFeetHref={squareFeetHref}
            squareMetersHref={squareMetersHref}
            byBedroom={areaPriceByBedroom}
          />
        </MetricCardButton>

        <MetricCardButton
          metric="median_dom"
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        >
          <SummaryCard
            label="Median Days on Market"
            value={medianDom}
            byBedroom={domByBedroom}
          />
        </MetricCardButton>
      </div>
    </>
  );
}

function MetricCardButton({
  metric,
  selectedMetric,
  onMetricChange,
  children,
}: {
  metric: ChartMetric;
  selectedMetric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  children: React.ReactNode;
}) {
  const selected = metric === selectedMetric;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onMetricChange(metric)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onMetricChange(metric);
        }
      }}
      className={`cursor-pointer rounded-xl transition ${
        selected
          ? "ring-3 ring-blue-600 ring-offset-2"
          : "hover:ring-2 hover:ring-slate-300 hover:ring-offset-2"
      }`}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueHref,
  controls,
  byBedroom,
}: {
  label: string;
  value: string;
  valueHref?: string;
  controls?: React.ReactNode;
  byBedroom: BedroomMetric[];
}) {
  return (
    <div className="h-full rounded-xl bg-white p-6 shadow">
      {controls && (
        <div
          className="mb-3"
          onClick={(event) => event.stopPropagation()}
        >
          {controls}
        </div>
      )}

      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-3 text-4xl font-bold text-slate-950">
        {valueHref ? (
          <Link
            href={valueHref}
            rel="nofollow"
            onClick={(event) => event.stopPropagation()}
            className="text-blue-700 hover:underline"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </p>

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

              {item.href ? (
                <Link
                  href={item.href}
                  rel="nofollow"
                  onClick={(event) => event.stopPropagation()}
                  className="font-bold text-blue-700 hover:underline"
                >
                  {item.value}
                </Link>
              ) : (
                <span className="font-bold text-slate-950">
                  {item.value}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
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