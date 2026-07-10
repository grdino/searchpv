import type { Metadata } from "next";
import Header from "@/app/components/Header";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Closed Sales Search Results | SearchPV",
  robots: {
    index: false,
    follow: true,
  },
};

type SearchParams = {
  ListingId?: string;
  mls?: string;
  sort?: string;
  dir?: "asc" | "desc";
};

type ClosedSaleRow = {
  mls: string;
  zone_name: string | null;
  area_name: string | null;
  community_name: string | null;
  development: string | null;
  building: string | null;
  address: string | null;
  unit: string | null;
  property_type: string | null;
  beds: number | null;
  full_baths: number | null;
  half_baths: number | null;
  m2: number | null;
  ft2: number | null;
  orig_price: number | null;
  list_price: number | null;
  sold_price: number | null;
  sold_price_ft2: number | null;
  dom: number | null;
  sold_date: string | null;
  sold_year_month: string | null;
};

const sortableColumns = {
  mls: "MLS",
  sold_date: "Sold Date",
  development: "Development",
  unit: "Unit",
  address: "Address",
  beds: "Beds",
  full_baths: "Baths",
  ft2: "Ft²",
  orig_price: "Orig Price",
  list_price: "List Price",
  sold_price: "Sold Price",
  sold_price_ft2: "$/Ft²",
  dom: "DOM",
} as const;

function parseMlsList(searchParams: SearchParams) {
  const raw = searchParams.mls || searchParams.ListingId || "";

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10000);
}

function formatCurrency(value: number | null) {
  if (value == null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value == null) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function SortableTh({
  label,
  sortKey,
  currentSort,
  currentDir,
  mlsList,
}: {
  label: string;
  sortKey: keyof typeof sortableColumns;
  currentSort: string;
  currentDir: "asc" | "desc";
  mlsList: string[];
}) {
  const isActive = currentSort === sortKey;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const arrow = isActive ? (currentDir === "asc" ? " ↑" : " ↓") : "";

  const href = `/market-intelligence/closed-sales/search-results?mls=${mlsList.join(
    ","
  )}&sort=${sortKey}&dir=${nextDir}`;

  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
      <Link href={href} className="hover:text-slate-950">
        {label}
        {arrow}
      </Link>
    </th>
  );
}

export default async function ClosedSalesSearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const mlsList = parseMlsList(params);
  const selectedSort = params.sort || "sold_date";
  const selectedDir = params.dir === "asc" ? "asc" : "desc";

  let rows: ClosedSaleRow[] = [];

  if (mlsList.length > 0) {
    const { data, error } = await supabase
      .from("closed_sales_mls_list")
      .select(
        `
        mls,
        zone_name,
        area_name,
        community_name,
        development,
        building,
        address,
        unit,
        property_type,
        beds,
        full_baths,
        half_baths,
        m2,
        ft2,
        orig_price,
        list_price,
        sold_price,
        sold_price_ft2,
        dom,
        sold_date,
        sold_year_month
      `
      )
      .in("mls", mlsList);

    if (error) {
      throw new Error(error.message);
    }

    rows = (data || []) as ClosedSaleRow[];
  }

  rows.sort((a, b) => {
    const key = selectedSort as keyof ClosedSaleRow;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return selectedDir === "asc" ? aValue - bValue : bValue - aValue;
    }

    return selectedDir === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Header />

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Market Intelligence
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Closed Sales Search Results
            </h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Closed MLS sales from the SearchPV database. Click any MLS number
              to view the full closed-sale detail page.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-4 rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Showing</p>
          <p className="text-2xl font-bold text-slate-950">
            {rows.length} closed sale{rows.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr>
                  {Object.entries(sortableColumns).map(([key, label]) => (
                    <SortableTh
                      key={key}
                      label={label}
                      sortKey={key as keyof typeof sortableColumns}
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      mlsList={mlsList}
                    />
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.mls} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      <Link
                        href={`/market-intelligence/closed-sales/${row.mls}`}
                        className="text-blue-700 hover:underline"
                      >
                        {row.mls}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(row.sold_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.development || row.building || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.unit || "—"}
                    </td>
                    <td className="min-w-[220px] px-4 py-3">
                      {row.address || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.beds ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.full_baths ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatNumber(row.ft2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCurrency(row.orig_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCurrency(row.list_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      {formatCurrency(row.sold_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCurrency(row.sold_price_ft2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.dom ?? "—"}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No closed MLS listings were found for this link.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
} 