import { supabase } from "@/lib/supabase";

import Link from "next/link";

type CommunitySnapshot = {
  community_name: string;
  snapshot_date: string | null;
  active_count: number | null;
  pending_count: number | null;
  sales_12mo: number | null;
  median_sold_price: number | null;
  avg_sold_price_ft2: number | null;
  sold_avg_dom_12mo: number | null;
  months_inventory: number | null;
};

export default async function Home() {
  const { data, error } = await supabase
    .from("community_snapshot")
    .select("*")
    .eq("market_segment", "all")
    .order("sales_12mo", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">SearchPV</h1>
        <p className="mt-4 text-red-600">Error loading market data.</p>
        <pre className="mt-4 text-sm">{error.message}</pre>
      </main>
    );
  }

  const rows = (data ?? []) as CommunitySnapshot[];

  const snapshotDate =
  rows.length > 0 && rows[0].snapshot_date
    ? new Date(rows[0].snapshot_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const totalActive = rows.reduce((sum, r) => sum + Number(r.active_count ?? 0), 0);
  const totalPending = rows.reduce((sum, r) => sum + Number(r.pending_count ?? 0), 0);
  const totalSales = rows.reduce((sum, r) => sum + Number(r.sales_12mo ?? 0), 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-widest text-slate-300">
            Puerto Vallarta Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">SearchPV</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Real estate market snapshots by community, powered by MLS inventory
            and closed sales data.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Active Listings" value={totalActive} />
          <MetricCard label="Pending Listings" value={totalPending} />
          <MetricCard label="Closed Sales - 12 Mo" value={totalSales} />
        </div>

        <h2 className="mt-12 text-2xl font-bold">Community Snapshot</h2>

        <p className="mt-1 text-sm text-slate-500">
          Snapshot Date: {snapshotDate}
        </p>

        <div className="mt-6 max-h-[70vh] overflow-auto rounded-xl bg-white shadow md:max-h-[65vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 shadow-sm">
              <tr>
                <Th>Community</Th>
                <Th>Active</Th>
                <Th>Pending</Th>
                <Th>Sales 12 Mo</Th>
                <Th>Median Sold</Th>
                <Th>Avg Sold $/ft²</Th>
                <Th>DOM</Th>
                <Th>MOI</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.community_name} className="border-t">
                  <Td>
                    {row.community_name === "Emiliano Zapata" ? (
                      <Link
                        href="/communities/emiliano-zapata"
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {row.community_name}
                      </Link>
                    ) : (
                      row.community_name
                    )}
                  </Td>
                  <Td>{row.active_count ?? 0}</Td>
                  <Td>{row.pending_count ?? 0}</Td>
                  <Td>{row.sales_12mo ?? 0}</Td>
                  <Td>{formatMoney(row.median_sold_price)}</Td>
                  <Td>{formatMoney(row.avg_sold_price_ft2)}</Td>
                  <Td>{row.sold_avg_dom_12mo ?? "-"}</Td>
                  <Td>{row.months_inventory ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3">{children}</td>;
}

function formatMoney(value: number | null) {
  if (!value) return "-";

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}