"use client";

import { useEffect, useState } from "react";

import type { ChartMetric } from "./market-listing-metrics";

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
  selectedMetric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  className?: string;
};

type ChartPoint = {
  snapshotDate: string;
  value: number;
  activeListingCount: number | null;
};

type MetricDefinition = {
  label: string;
  title: string;
  subtitle: string;
  axisLabel: string;
  valueLabel: string;
  getValue: (
    row: MarketListingHistoryRow
  ) => number | string | null | undefined;
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

  median_dom: {
    label: "Median DOM",
    title: "Median Days on Market History",
    subtitle: "Median days on market for active listings by snapshot date",
    axisLabel: "Median Days on Market",
    valueLabel: "median days on market",
    getValue: (row) => row.median_dom,
    formatValue: formatDays,
    formatAxis: formatInteger,
  },
};

const METRIC_OPTIONS: ChartMetric[] = [
  "active_listing_count",
  "inventory_value",
  "median_list_price",
  "median_price_per_sqm",
  "median_dom",
];

export default function MarketListingHistoryChart({
  rows,
  selectedMetric,
  onMetricChange,
  className = "",
}: MarketListingHistoryChartProps) {
  const [hoveredPointIndex, setHoveredPointIndex] =
    useState<number | null>(null);

  const metric = METRICS[selectedMetric];
  const points = normalizeRows(rows, metric);

  useEffect(() => {
    setHoveredPointIndex(null);
  }, [selectedMetric, rows]);

  if (points.length === 0) {
    return (
      <section
        className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
      >
        <ChartHeader
          metric={metric}
          selectedMetric={selectedMetric}
          onMetricChange={onMetricChange}
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

    return (
      PADDING.left +
      (index / (points.length - 1)) * plotWidth
    );
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

  const hoveredPoint =
    hoveredPointIndex === null
      ? null
      : points[hoveredPointIndex] ?? null;

  const hoveredPointX =
    hoveredPointIndex === null
      ? null
      : xForIndex(hoveredPointIndex);

  const hoveredPointY =
    hoveredPoint === null
      ? null
      : yForValue(hoveredPoint.value);

  const chartTitleId =
    `market-listing-history-${selectedMetric}-title`;

  const chartDescriptionId =
    `market-listing-history-${selectedMetric}-description`;

  return (
    <section
      className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
    >
      <ChartHeader
        metric={metric}
        selectedMetric={selectedMetric}
        onMetricChange={onMetricChange}
        latestDate={latestPoint.snapshotDate}
        latestValue={latestPoint.value}
        change={change}
        changePercent={changePercent}
      />

      <div className="mt-6 overflow-x-auto">
        <svg
          key={selectedMetric}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-labelledby={`${chartTitleId} ${chartDescriptionId}`}
          className="metric-chart-enter h-auto min-w-[680px] w-full"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <title id={chartTitleId}>{metric.title}</title>

          <desc id={chartDescriptionId}>
            {`${metric.title} from ${formatDateLong(
              firstPoint.snapshotDate
            )} through ${formatDateLong(
              latestPoint.snapshotDate
            )}.`}
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
            pathLength="1"
            className="metric-chart-line stroke-blue-700"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = xForIndex(index);
            const y = yForValue(point.value);
            const hovered = hoveredPointIndex === index;

            return (
              <g key={`${point.snapshotDate}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="13"
                  fill="transparent"
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={buildPointAriaLabel(
                    point,
                    metric,
                    selectedMetric
                  )}
                  onMouseEnter={() =>
                    setHoveredPointIndex(index)
                  }
                  onFocus={() =>
                    setHoveredPointIndex(index)
                  }
                  onBlur={() =>
                    setHoveredPointIndex(null)
                  }
                />

                {hovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    className="fill-blue-100 stroke-blue-700"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  className="metric-chart-point fill-white stroke-blue-700"
                  style={{
                    animationDelay: `${150 + index * 15}ms`,
                  }}
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

          {hoveredPoint &&
            hoveredPointX !== null &&
            hoveredPointY !== null && (
              <ChartTooltip
                point={hoveredPoint}
                pointX={hoveredPointX}
                pointY={hoveredPointY}
                metric={metric}
                selectedMetric={selectedMetric}
              />
            )}
        </svg>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Each point represents inventory captured on an MLS snapshot date.
        Hover over a point for details.
      </p>
    </section>
  );
}

function ChartTooltip({
  point,
  pointX,
  pointY,
  metric,
  selectedMetric,
}: {
  point: ChartPoint;
  pointX: number;
  pointY: number;
  metric: MetricDefinition;
  selectedMetric: ChartMetric;
}) {
  const showInventory =
    selectedMetric !== "active_listing_count" &&
    point.activeListingCount !== null;

  const width = 220;
  const height = showInventory ? 138 : 96;

  const minimumX = PADDING.left + 4;
  const maximumX =
    CHART_WIDTH - PADDING.right - width - 4;

  const x = Math.min(
    Math.max(pointX - width / 2, minimumX),
    maximumX
  );

  const placeAbove =
    pointY - PADDING.top >= height + 16;

  const proposedY = placeAbove
    ? pointY - height - 14
    : pointY + 14;

  const maximumY =
    CHART_HEIGHT - PADDING.bottom - height - 4;

  const y = Math.max(
    PADDING.top + 4,
    Math.min(proposedY, maximumY)
  );

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      pointerEvents="none"
    >
      <div className="h-full rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
        <p className="text-xs font-bold text-slate-600">
          {formatDateLong(point.snapshotDate)}
        </p>

        <div className="mt-2">
          <p className="text-xs text-slate-500">
            {metric.label}
          </p>

          <p className="text-lg font-bold leading-tight text-slate-950">
            {metric.formatValue(point.value)}
          </p>
        </div>

        {showInventory && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <p className="text-xs text-slate-500">
              Inventory
            </p>

            <p className="text-sm font-bold text-slate-950">
              {formatInteger(point.activeListingCount!)} listings
            </p>
          </div>
        )}
      </div>
    </foreignObject>
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
                  ` (${formatSignedPercent(
                    changePercent
                  )})`}{" "}
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
              onClick={() =>
                onMetricChange(metricKey)
              }
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

    const activeListingCount =
      row.active_listing_count === null ||
      row.active_listing_count === undefined
        ? null
        : Number(row.active_listing_count);

    rowsByDate.set(row.snapshot_date, {
      snapshotDate: row.snapshot_date,
      value,
      activeListingCount:
        activeListingCount !== null &&
        Number.isFinite(activeListingCount)
          ? activeListingCount
          : null,
    });
  }

  return Array.from(rowsByDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate)
  );
}

function buildPointAriaLabel(
  point: ChartPoint,
  metric: MetricDefinition,
  selectedMetric: ChartMetric
) {
  const parts = [
    formatDateLong(point.snapshotDate),
    `${metric.label}: ${metric.formatValue(point.value)}`,
  ];

  if (
    selectedMetric !== "active_listing_count" &&
    point.activeListingCount !== null
  ) {
    parts.push(
      `Inventory: ${formatInteger(
        point.activeListingCount
      )} listings`
    );
  }

  return parts.join(". ");
}

function buildYAxis(
  minimumValue: number,
  maximumValue: number
) {
  if (minimumValue === maximumValue) {
    const padding = Math.max(
      Math.abs(maximumValue) * 0.05,
      1
    );

    const minimum = Math.max(
      0,
      minimumValue - padding
    );

    const maximum = maximumValue + padding;

    return {
      minimum,
      maximum,
      ticks: buildTicks(minimum, maximum, 4),
    };
  }

  const range = maximumValue - minimumValue;
  const padding = Math.max(range * 0.15, 1);

  const paddedMinimum = Math.max(
    0,
    minimumValue - padding
  );

  const paddedMaximum =
    maximumValue + padding;

  const tickStep = getNiceTickStep(
    (paddedMaximum - paddedMinimum) / 4
  );

  const minimum =
    Math.floor(paddedMinimum / tickStep) *
    tickStep;

  const maximum =
    Math.ceil(paddedMaximum / tickStep) *
    tickStep;

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
  const interval =
    (maximum - minimum) / intervalCount;

  return Array.from(
    { length: intervalCount + 1 },
    (_, index) => minimum + interval * index
  );
}

function getNiceTickStep(value: number) {
  if (value <= 0) return 1;

  const magnitude =
    10 ** Math.floor(Math.log10(value));

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
        label: formatDateShort(
          points[0].snapshotDate
        ),
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
        (position /
          (desiredLabelCount - 1)) *
          (points.length - 1)
      )
    );
  }

  return Array.from(indexes)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      label: formatDateShort(
        points[index].snapshotDate
      ),
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

  return `${value > 0 ? "+" : "−"}${Math.abs(
    value
  ).toFixed(1)}%`;
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
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "−" : "";

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}$${(
      absoluteValue / 1_000_000_000
    ).toFixed(3)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${sign}$${(
      absoluteValue / 1_000_000
    ).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}$${(
      absoluteValue / 1_000
    ).toFixed(0)}K`;
  }

  return `${sign}$${Math.round(
    absoluteValue
  ).toLocaleString("en-US")}`;
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

function formatDays(value: number) {
  const days = Math.round(value);

  return `${days.toLocaleString("en-US")} ${
    days === 1 ? "day" : "days"
  }`;
}

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}