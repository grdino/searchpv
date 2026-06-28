export default function MarketSummary({
  title = "Market Summary",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingTop: "48px" }}>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="mt-4 leading-7 text-slate-700">{children}</div>
      </section>
    </div>
  );
}
