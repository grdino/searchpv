"use client";

import { useState } from "react";

type MarketListingHistoryRow = {
  snapshot_date: string | null;
  active_listing_count: number | string | null;
  inventory_value?: number | string | null;
  median_list_price?: number | string | null;
  median_price_per_sqft?: number | string | null;
  median_price_per_sqm?: number | string | null;
  median_dom?: number | string | null;
};

type MarketListingHistoryChartProps = {
  rows: MarketListingHistoryRow[];
  className?: string;
};

type ChartMetric =
  | "active_listing_count"
  | "inventory_value"
  | "median_list_price"
  | "median_price_per_sqm";

type ChartPoint = {
  snapshotDate: string;
  value: number;
};

type MetricDefinition = {
  label: string;
  title: string;
  subtitle: string;
  axisLabel: string;
  valueLabel: string;
  getValue: (row: MarketListingHistoryRow) => number | string | null | undefined;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
};

const CHART_WIDTH = 900;
const CHART_HEIGHT = 300;

const PADDING = {
  top: 24,
  right: 24,
  bottom: 48,
  left: 82,
};

const METRICS: Record<ChartMetric, MetricDefinition> = {
  active_listing_count: {
    label: "Active Listings",
    title: "Active Listing History",
    subtitle: "Active listings by snapshot date",
    axisLabel: "Active Listings",
    valueLabel: "active listings",
    getValue: (row) => row.active_listing_count,
    formatValue: formatInteger,
    formatAxis: formatChartNumber,
  },

  inventory_value: {
    label: "Inventory Value",
    title: "Inventory Value History",
    subtitle: "Total active listing value by snapshot date",
    axisLabel: "Inventory Value",
    valueLabel: "inventory value",
    getValue: (row) => row.inventory_value,
    formatValue: formatCurrency,
    formatAxis: formatCompactCurrency,
  },

  median_list_price: {
    label: "Median List Price",
    title: "Median List Price History",
    subtitle: "Median active listing price by snapshot date",
    axisLabel: "Median List Price",
    valueLabel: "median list price",
    getValue: (row) => row.median_list_price,
    formatValue: formatCurrency,
    formatAxis: formatCompactCurrency,
  },

  median_price_per_sqm: {
    label: "Median $/m²",
    title: "Median Price per m² History",
    subtitle: "Median active listing price per square meter",
    axisLabel: "Median $/m²",
    valueLabel: "median price per m²",
    getValue: (row) => row.median_price_per_sqm,
    formatValue: formatCurrency,
    formatAxis: formatCurrency,
  },
};

const METRIC_OPTIONS: ChartMetric[] = [
  "active_listing_count",
  "inventory_value",
  "median_list_price",
  "median_price_per_sqm",
];

export default function MarketListingHistoryChart({
  rows,
  className = "",
}: MarketListingHistoryChartProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<ChartMetric>("active_listing_count");

  const metric = METRICS[selectedMetric];
  const points = normalizeRows(rows, metric);

  if (points.length === 0) {
    return (
      <section
        className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
      >
        <ChartHeader
          metric={metric}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />

        <div className="mt-6 flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
          No historical data is available for this metric and the selected
          filters.
        </div>
      </section>
    );
  }

  const values = points.map((point) => point.value);
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);

  const yAxis = buildYAxis(rawMinimum, rawMaximum);
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xForIndex = (index: number) => {
    if (points.length === 1) {
      return PADDING.left + plotWidth / 2;
    }

    return PADDING.left + (index / (points.length - 1)) * plotWidth;
  };

  const yForValue = (value: number) => {
    const range = yAxis.maximum - yAxis.minimum;

    if (range === 0) {
      return PADDING.top + plotHeight / 2;
    }

    return (
      PADDING.top +
      ((yAxis.maximum - value) / range) * plotHeight
    );
  };

  const linePath = points
    .map((point, index) => {
      const x = xForIndex(index);
      const y = yForValue(point.value);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const firstPoint = points[0];
  const latestPoint = points[points.length - 1];

  const change = latestPoint.value - firstPoint.value;

  const changePercent =
    firstPoint.value === 0
      ? null
      : (change / firstPoint.value) * 100;

  const xAxisLabels = getXAxisLabels(points);

  const chartTitleId = `market-listing-history-${selectedMetric}-title`;
  const chartDescriptionId =
    `market-listing-history-${selectedMetric}-description`;

  return (
    <section
      className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
    >
      <ChartHeader
        metric={metric}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        latestDate={latestPoint.snapshotDate}
        latestValue={latestPoint.value}
        change={change}
        changePercent={changePercent}
      />

      <div className="mt-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-labelledby={`${chartTitleId} ${chartDescriptionId}`}
          className="h-auto min-w-[680px] w-full"
        >
          <title id={chartTitleId}>{metric.title}</title>

          <desc id={chartDescriptionId}>
            {`${metric.title} from ${formatDateLong(
              firstPoint.snapshotDate
            )} through ${formatDateLong(latestPoint.snapshotDate)}.`}
          </desc>

          {yAxis.ticks.map((tick) => {
            const y = yForValue(tick);

            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - PADDING.right}
                  y2={y}
                  className="stroke-slate-200"
                  strokeWidth="1"
                />

                <text
                  x={PADDING.left - 12}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-slate-500 text-[12px]"
                >
                  {metric.formatAxis(tick)}
                </text>
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="stroke-slate-300"
            strokeWidth="1"
          />

          <line
            x1={PADDING.left}
            y1={CHART_HEIGHT - PADDING.bottom}
            x2={CHART_WIDTH - PADDING.right}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="stroke-slate-300"
            strokeWidth="1"
          />

          <path
            d={linePath}
            fill="none"
            className="stroke-blue-700"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = xForIndex(index);
            const y = yForValue(point.value);

            return (
              <g key={`${point.snapshotDate}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="cursor-default"
                >
                  <title>
                    {`${formatDateLong(
                      point.snapshotDate
                    )}: ${metric.formatValue(point.value)}`}
                  </title>
                </circle>

                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-white stroke-blue-700"
                  strokeWidth="2.5"
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {xAxisLabels.map(({ index, label }) => (
            <text
              key={`${index}-${label}`}
              x={xForIndex(index)}
              y={CHART_HEIGHT - 18}
              textAnchor="middle"
              className="fill-slate-500 text-[12px]"
            >
              {label}
            </text>
          ))}

          <text
            x="18"
            y={PADDING.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${
              PADDING.top + plotHeight / 2
            })`}
            className="fill-slate-500 text-[12px] font-semibold"
          >
            {metric.axisLabel}
          </text>
        </svg>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Each point represents inventory captured on an MLS snapshot date.
      </p>
    </section>
  );
}

function ChartHeader({
  metric,
  selectedMetric,
  onMetricChange,
  latestDate,
  latestValue,
  change,
  changePercent,
}: {
  metric: MetricDefinition;
  selectedMetric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  latestDate?: string;
  latestValue?: number;
  change?: number;
  changePercent?: number | null;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {metric.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {metric.subtitle}
          </p>
        </div>

        {latestDate && latestValue !== undefined && (
          <div className="sm:text-right">
            <p className="text-2xl font-bold text-slate-950">
              {metric.formatValue(latestValue)}
            </p>

            <p className="text-xs text-slate-500">
              as of {formatDateLong(latestDate)}
            </p>

            {change !== undefined && (
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {formatMetricChange(change, metric)}
                {changePercent !== null &&
                  changePercent !== undefined &&
                  ` (${formatSignedPercent(changePercent)})`}{" "}
                during displayed period
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {METRIC_OPTIONS.map((metricKey) => {
          const option = METRICS[metricKey];
          const selected = selectedMetric === metricKey;

          return (
            <button
              key={metricKey}
              type="button"
              onClick={() => onMetricChange(metricKey)}
              aria-pressed={selected}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function normalizeRows(
  rows: MarketListingHistoryRow[],
  metric: MetricDefinition
): ChartPoint[] {
  const rowsByDate = new Map<string, ChartPoint>();

  for (const row of rows) {
    if (!row.snapshot_date) continue;

    const value = Number(metric.getValue(row));

    if (!Number.isFinite(value)) continue;

    rowsByDate.set(row.snapshot_date, {
      snapshotDate: row.snapshot_date,
      value,
    });
  }

  return Array.from(rowsByDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate)
  );
}

function buildYAxis(minimumValue: number, maximumValue: number) {
  if (minimumValue === maximumValue) {
    const padding = Math.max(Math.abs(maximumValue) * 0.05, 1);
    const minimum = Math.max(0, minimumValue - padding);
    const maximum = maximumValue + padding;

    return {
      minimum,
      maximum,
      ticks: buildTicks(minimum, maximum, 4),
    };
  }

  const range = maximumValue - minimumValue;
  const padding = Math.max(range * 0.15, 1);

  const paddedMinimum = Math.max(0, minimumValue - padding);
  const paddedMaximum = maximumValue + padding;

  const tickStep = getNiceTickStep(
    (paddedMaximum - paddedMinimum) / 4
  );

  const minimum =
    Math.floor(paddedMinimum / tickStep) * tickStep;

  const maximum =
    Math.ceil(paddedMaximum / tickStep) * tickStep;

  return {
    minimum,
    maximum,
    ticks: buildTicks(minimum, maximum, 4),
  };
}

function buildTicks(
  minimum: number,
  maximum: number,
  intervalCount: number
) {
  const interval = (maximum - minimum) / intervalCount;

  return Array.from(
    { length: intervalCount + 1 },
    (_, index) => minimum + interval * index
  );
}

function getNiceTickStep(value: number) {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  let niceNormalized: number;

  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  return niceNormalized * magnitude;
}

function getXAxisLabels(points: ChartPoint[]) {
  if (points.length === 1) {
    return [
      {
        index: 0,
        label: formatDateShort(points[0].snapshotDate),
      },
    ];
  }

  const desiredLabelCount =
    points.length <= 4
      ? points.length
      : points.length <= 10
        ? 4
        : 5;

  const indexes = new Set<number>();

  for (
    let position = 0;
    position < desiredLabelCount;
    position += 1
  ) {
    indexes.add(
      Math.round(
        (position / (desiredLabelCount - 1)) *
          (points.length - 1)
      )
    );
  }

  return Array.from(indexes)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      label: formatDateShort(points[index].snapshotDate),
    }));
}

function formatMetricChange(
  value: number,
  metric: MetricDefinition
) {
  if (value === 0) return "No change";

  return `${value > 0 ? "+" : "−"}${metric.formatValue(
    Math.abs(value)
  )}`;
}

function formatSignedPercent(value: number) {
  if (value === 0) return "0.0%";

  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatChartNumber(value: number) {
  if (Math.abs(value) < 10_000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateShort(value: string) {
  const date = parseUtcDate(value);

  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(value: string) {
  const date = parseUtcDate(value);

  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}