import Link from "next/link";

type ChartVariant = "card" | "compact";

type ClosedSaleChartRow = {
  mls: string | number | null;
  sold_date: string | null;
};

type ClosedSalesMonthlyChartProps = {
  title?: string;
  rows: ClosedSaleChartRow[];
  variant?: ChartVariant;
};

type BarData = {
  count: number;
  mlsList: string[];
};

type ComparisonBucket = {
  key: string;
  label: string;
  currentYear: number;
  previousYear: number;
  isCurrentMonth: boolean;
  current: BarData;
  previous: BarData;
};

export default function ClosedSalesMonthlyChart({
  title = "12-Month Year-over-Year Closed Sales",
  rows,
  variant = "card",
}: ClosedSalesMonthlyChartProps) {
  const today = new Date();
  const buckets = buildMonthlyBuckets(rows, today);

  if (!buckets.length) return null;

  const maxCount = Math.max(
    ...buckets.flatMap((bucket) => [
      bucket.current.count,
      bucket.previous.count,
    ]),
    1
  );

  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "rounded-xl border border-blue-200 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 p-3 shadow-sm"
          : "rounded-xl border border-blue-300 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-200 p-4 shadow"
      }
    >
      <div className="mb-3">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>

        <p
          className={
            isCompact
              ? "mt-0.5 text-[11px] text-slate-500"
              : "mt-1 text-xs text-slate-500"
          }
        >
          Each month compares the prior year with the most recent 12 months.
          Current-month results are compared through{" "}
          <span className="font-semibold">
            {formatMonthDay(today)}
          </span>
          .
        </p>

        <div
          className={
            isCompact
              ? "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600"
              : "mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600"
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
            Previous year
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Current 12 months
          </span>
        </div>
      </div>

      <div className="overflow-x-auto md:overflow-visible">
        <div
          className={`grid items-end ${
            isCompact ? "min-w-[720px] gap-2" : "min-w-[840px] gap-3"
          }`}
          style={{
            gridTemplateColumns: `repeat(${buckets.length}, minmax(${
              isCompact ? "48px" : "60px"
            }, 1fr))`,
          }}
        >
          {buckets.map((bucket) => (
            <div key={bucket.key} className="flex flex-col items-center">
              <div
                className={
                  isCompact
                    ? "relative flex h-20 w-full items-end justify-center gap-1 border-b border-slate-300"
                    : "relative flex h-40 w-full items-end justify-center gap-1 rounded-t border border-slate-300 bg-slate-50 px-1"
                }
              >
                <ChartBar
                  bar={bucket.previous}
                  maxCount={maxCount}
                  label={`${bucket.label} ${bucket.previousYear}`}
                  barClassName="bg-slate-400"
                  isCompact={isCompact}
                />

                <ChartBar
                  bar={bucket.current}
                  maxCount={maxCount}
                  label={`${bucket.label} ${bucket.currentYear}`}
                  barClassName="bg-blue-500"
                  isCompact={isCompact}
                />
              </div>

              <div className="mt-1 text-center leading-tight">
                <div
                  className={
                    isCompact
                      ? "text-[10px] font-medium text-slate-700"
                      : "text-xs font-medium text-slate-700"
                  }
                >
                  {bucket.label}
                </div>

                <div
                  className={
                    isCompact
                      ? "h-3 text-[9px] text-slate-500"
                      : "h-3 text-[10px] text-slate-500"
                  }
                >
                  {bucket.isCurrentMonth ? (
                    <span className="font-semibold text-blue-600">MTD</span>
                  ) : (
                    <span>
                      {String(bucket.previousYear).slice(-2)}/
                      {String(bucket.currentYear).slice(-2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  bar,
  maxCount,
  label,
  barClassName,
  isCompact,
}: {
  bar: BarData;
  maxCount: number;
  label: string;
  barClassName: string;
  isCompact: boolean;
}) {
  const heightPct =
    bar.count > 0
      ? Math.max((bar.count / maxCount) * 100, isCompact ? 10 : 6)
      : 0;

  const href =
    bar.mlsList.length > 0
      ? `/market-intelligence/closed-sales/search-results?mls=${bar.mlsList.join(
          ","
        )}`
      : "#";

  return (
    <div
      className={`flex h-full flex-1 flex-col items-center justify-end ${
        isCompact ? "max-w-5" : "max-w-7"
      }`}
    >
      {bar.count > 0 ? (
        <Link
          href={href}
          rel="nofollow"
          className={
            isCompact
              ? "mb-1 text-[9px] font-bold leading-none text-blue-700 hover:underline"
              : "mb-1 rounded-full border border-blue-200 bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-blue-700 shadow-sm hover:bg-blue-50 hover:underline"
          }
        >
          {bar.count}
        </Link>
      ) : (
        <span
          className={
            isCompact
              ? "mb-1 text-[9px] font-bold leading-none text-slate-400"
              : "mb-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-400"
          }
        >
          0
        </span>
      )}

      <div
        className={`w-full rounded-t-sm ${barClassName}`}
        style={{ height: `${heightPct}%` }}
        title={`${label}: ${bar.count} closed sales`}
      />
    </div>
  );
}

function buildMonthlyBuckets(
  rows: ClosedSaleChartRow[],
  today: Date
): ComparisonBucket[] {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const buckets = Array.from({ length: 12 }, (_, index) => {
      const currentDate = new Date(
        currentYear,
        currentMonth - (11 - index),
        1
      );

      const bucketYear = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const previousYear = bucketYear - 1;

      return {
        key: `${bucketYear}-${String(month + 1).padStart(2, "0")}`,
        label: currentDate.toLocaleDateString("en-US", {
          month: "short",
        }),
        currentYear: bucketYear,
        previousYear,
        month,
        isCurrentMonth:
          bucketYear === currentYear && month === currentMonth,
        current: {
          count: 0,
          mlsList: [] as string[],
        },
        previous: {
          count: 0,
          mlsList: [] as string[],
        },
      };
    });

  const bucketMap = new Map(
    buckets.map((bucket) => [
      `${bucket.currentYear}-${String(bucket.month + 1).padStart(2, "0")}`,
      bucket,
    ])
  );

  rows.forEach((row) => {
    if (!row.sold_date || !row.mls) return;

    const soldDate = parseISODate(row.sold_date);

    if (!soldDate) return;

    const soldYear = soldDate.getFullYear();
    const soldMonth = soldDate.getMonth();
    const soldDay = soldDate.getDate();

    const currentKey = `${soldYear}-${String(soldMonth + 1).padStart(2, "0")}`;
    const currentBucket = bucketMap.get(currentKey);

    if (currentBucket) {
      /*
       * The current period is already restricted by the query's
       * snapshotDate ending boundary.
       */
      currentBucket.current.count += 1;
      currentBucket.current.mlsList.push(String(row.mls));
      return;
    }

    const comparisonKey = `${soldYear + 1}-${String(soldMonth + 1).padStart(
      2,
      "0"
    )}`;

    const comparisonBucket = bucketMap.get(comparisonKey);

    if (!comparisonBucket) return;

    /*
     * For the currently incomplete month, compare only through the same
     * day in the previous year.
     *
     * Example:
     * snapshotDate = 2026-07-10
     * July 2025 includes July 1 through July 10 only.
     */
    if (comparisonBucket.isCurrentMonth && soldDay > currentDay) {
      return;
    }

    comparisonBucket.previous.count += 1;
    comparisonBucket.previous.mlsList.push(String(row.mls));
  });

  return buckets;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatMonthDay(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}