import MarketSummary from "./MarketSummary";

export default function SearchPVMarketInsight({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingTop: "48px" }}>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          SearchPV Market Insight
        </div>

        <h2 className="mt-2 text-2xl font-bold">Current Market Read</h2>

        <div className="mt-4 leading-7 text-slate-700">{children}</div>
      </section>
    </div>
  );
}
