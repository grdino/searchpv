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
  title?: string;
  className?: string;
};

type ChartPoint = {
  snapshotDate: string;
  listingCount: number;
};

const CHART_WIDTH = 900;
const CHART_HEIGHT = 300;

const PADDING = {
  top: 24,
  right: 24,
  bottom: 48,
  left: 72,
};

export default function MarketListingHistoryChart({
  rows,
  title = "Active Listing History",
  className = "",
}: MarketListingHistoryChartProps) {
  const points = normalizeRows(rows);

  if (points.length === 0) {
    return (
      <section
        className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
      >
        <ChartHeader title={title} />

        <div className="mt-6 flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
          No historical inventory data is available for the selected filters.
        </div>
      </section>
    );
  }

  const counts = points.map((point) => point.listingCount);
  const rawMinimum = Math.min(...counts);
  const rawMaximum = Math.max(...counts);

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
      const y = yForValue(point.listingCount);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const firstPoint = points[0];
  const latestPoint = points[points.length - 1];
  const listingChange =
    latestPoint.listingCount - firstPoint.listingCount;
  const listingChangePercent =
    firstPoint.listingCount === 0
      ? null
      : (listingChange / firstPoint.listingCount) * 100;

  const xAxisLabels = getXAxisLabels(points);

  return (
    <section
      className={`rounded-xl bg-white p-6 shadow ${className}`.trim()}
    >
      <ChartHeader
        title={title}
        latestDate={latestPoint.snapshotDate}
        latestCount={latestPoint.listingCount}
        change={listingChange}
        changePercent={listingChangePercent}
      />

      <div className="mt-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-labelledby="active-listing-history-title active-listing-history-description"
          className="h-auto min-w-[680px] w-full"
        >
          <title id="active-listing-history-title">{title}</title>

          <desc id="active-listing-history-description">
            {`Active listing inventory by MLS snapshot date from ${formatDateLong(
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
                  {formatCompactNumber(tick)}
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
            const y = yForValue(point.listingCount);

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
                    {`${formatDateLong(point.snapshotDate)}: ${point.listingCount.toLocaleString(
                      "en-US"
                    )} active listings`}
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
            transform={`rotate(-90 18 ${PADDING.top + plotHeight / 2})`}
            className="fill-slate-500 text-[12px] font-semibold"
          >
            Active Listings
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
  title,
  latestDate,
  latestCount,
  change,
  changePercent,
}: {
  title: string;
  latestDate?: string;
  latestCount?: number;
  change?: number;
  changePercent?: number | null;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">
          Active listings by snapshot date
        </p>
      </div>

      {latestDate && latestCount !== undefined && (
        <div className="sm:text-right">
          <p className="text-2xl font-bold text-slate-950">
            {latestCount.toLocaleString("en-US")}
          </p>

          <p className="text-xs text-slate-500">
            as of {formatDateLong(latestDate)}
          </p>

          {change !== undefined && (
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {formatSignedNumber(change)}
              {changePercent !== null &&
                changePercent !== undefined &&
                ` (${formatSignedPercent(changePercent)})`}{" "}
              during displayed period
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeRows(rows: MarketListingHistoryRow[]): ChartPoint[] {
  const rowsByDate = new Map<string, ChartPoint>();

  for (const row of rows) {
    if (!row.snapshot_date) continue;

    const listingCount = Number(row.active_listing_count);

    if (!Number.isFinite(listingCount)) continue;

    rowsByDate.set(row.snapshot_date, {
      snapshotDate: row.snapshot_date,
      listingCount,
    });
  }

  return Array.from(rowsByDate.values()).sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate)
  );
}

function buildYAxis(minimumValue: number, maximumValue: number) {
  if (minimumValue === maximumValue) {
    const padding = Math.max(Math.round(maximumValue * 0.05), 10);
    const minimum = Math.max(0, minimumValue - padding);
    const maximum = maximumValue + padding;

    return {
      minimum,
      maximum,
      ticks: buildTicks(minimum, maximum, 4),
    };
  }

  const range = maximumValue - minimumValue;
  const padding = Math.max(range * 0.15, 5);

  const paddedMinimum = Math.max(0, minimumValue - padding);
  const paddedMaximum = maximumValue + padding;
  const tickStep = getNiceTickStep(
    (paddedMaximum - paddedMinimum) / 4
  );

  const minimum = Math.floor(paddedMinimum / tickStep) * tickStep;
  const maximum = Math.ceil(paddedMaximum / tickStep) * tickStep;

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
    (_, index) => Math.round(minimum + interval * index)
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
    points.length <= 4 ? points.length : points.length <= 10 ? 4 : 5;

  const indexes = new Set<number>();

  for (let position = 0; position < desiredLabelCount; position += 1) {
    indexes.add(
      Math.round(
        (position / (desiredLabelCount - 1)) * (points.length - 1)
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

function formatCompactNumber(value: number) {
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

function formatSignedNumber(value: number) {
  if (value === 0) return "No change";

  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US")}`;
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
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