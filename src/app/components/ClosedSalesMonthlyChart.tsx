// src/app/components/ClosedSalesMonthlyChart.tsx

import Link from "next/link";

type RangeKey = "90d" | "6mo" | "12mo" | "all" | "custom";
type ChartVariant = "card" | "compact";

type ClosedSaleChartRow = {
  mls: string | number | null;
  sold_date: string | null;
};

type ClosedSalesMonthlyChartProps = {
  title?: string;
  rows: ClosedSaleChartRow[];
  selectedRange: RangeKey;
  variant?: ChartVariant;
};

export default function ClosedSalesMonthlyChart({
  title = "13-Month Market Snapshot",
  rows,
  selectedRange,
  variant = "card",
}: ClosedSalesMonthlyChartProps) {
  const buckets = buildMonthlyBuckets(rows);
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  if (!buckets.length) return null;

  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "rounded-xl border border-blue-200 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 p-3 shadow-sm"
          : "rounded-xl border border-blue-300 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-200 p-4 shadow"
      }
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2
          className={
            isCompact
              ? "text-xs font-bold text-slate-800"
              : "text-sm font-bold text-slate-800"
          }
        >
          {title}
        </h2>

        {!isCompact && (
          <p className="text-xs text-slate-500">
            Click a number to view matching sales
          </p>
        )}
      </div>

      <div className="overflow-x-auto md:overflow-visible">
        <div
          className={`grid items-end ${
            isCompact ? "min-w-[520px] gap-2" : "min-w-[420px] gap-3"
          }`}
          style={{
            gridTemplateColumns: `repeat(${buckets.length}, minmax(${
              isCompact ? "30px" : "42px"
            }, 1fr))`,
          }}
        >
          {buckets.map((bucket) => {
            const heightPct =
              bucket.count > 0
                ? Math.max((bucket.count / maxCount) * 100, isCompact ? 10 : 8)
                : 0;

            const href =
              bucket.mlsList.length > 0
                ? `/market-intelligence/closed-sales/search-results?mls=${bucket.mlsList.join(
                    ","
                  )}`
                : "#";

            return (
              <div key={bucket.key} className="flex flex-col items-center">
                {bucket.count > 0 ? (
                  <Link
                    href={href}
                    className={
                      isCompact
                        ? "mb-1 text-[10px] font-bold text-blue-700 hover:underline"
                        : "mb-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 hover:underline"
                    }
                  >
                    {bucket.count}
                  </Link>
                ) : (
                  <span
                    className={
                      isCompact
                        ? "mb-1 text-[10px] font-bold text-slate-400"
                        : "mb-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-400"
                    }
                  >
                    0
                  </span>
                )}

                <div
                  className={
                    isCompact
                      ? "flex h-14 w-full items-end justify-center border-b border-slate-300"
                      : "flex h-32 w-full items-end justify-center rounded-t border border-slate-300 bg-slate-50"
                  }
                >
                  <div
                    className={`rounded-t-sm ${
                      isCompact ? "w-4" : "w-8"
                    } ${
                      bucket.isCurrentMonth ? "bg-blue-500" : "bg-slate-500"
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${bucket.label}: ${bucket.count} closed sales`}
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

                  <div className={isCompact ? "h-3 text-[9px]" : "h-3 text-[10px]"}>
                    {bucket.showYear && (
                      <span className="text-slate-500">{bucket.year}</span>
                    )}

                    {bucket.showYear && bucket.isCurrentMonth && " "}

                    {bucket.isCurrentMonth && (
                      <span
                        className={
                          isCompact
                            ? "font-semibold text-blue-600"
                            : "font-semibold text-blue-600"
                        }
                      >
                        MTD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildMonthlyBuckets(rows: ClosedSaleChartRow[]) {
  const monthCount = 13;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(currentYear, currentMonth - (monthCount - 1 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

    return {
      key,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      year,
      month,
      count: 0,
      mlsList: [] as string[],
      isCurrentMonth: year === currentYear && month === currentMonth,
      showYear: false,
    };
  });

  buckets.forEach((bucket, index) => {
    bucket.showYear = index === 0 || bucket.month === 0;
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  rows.forEach((row) => {
    if (!row.sold_date || !row.mls) return;

    const [year, month] = row.sold_date.split("-").map(Number);
    if (!year || !month) return;

    const key = `${year}-${String(month).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);

    if (!bucket) return;

    bucket.count += 1;
    bucket.mlsList.push(String(row.mls));
  });

  return buckets;
}