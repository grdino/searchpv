import Link from "next/link";
import AreaGuideModal from "@/app/components/AreaGuideModal";

const heroButtonClass =
  "rounded-full border border-[#00E5FF] bg-[#00E5FF] px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_12px_rgba(0,229,255,.45)] hover:bg-cyan-300";

export default function SPVHeroMission() {
  return (
    <section className="mt-8 max-w-4xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Puerto Vallarta Market Intelligence
      </p>

      <h1 className="mt-3 max-w-3xl text-xl font-black leading-tight text-white sm:text-3xl md:text-3xl">
        <span className="block whitespace-nowrap">Explore Neighborhoods</span>
        <span className="block whitespace-nowrap">Analyze Market Trends</span>
        <span className="block whitespace-nowrap">
          Generate Professional Reports
        </span>
      </h1>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
        SearchPV ┃ Puerto Vallarta Real Estate ┃ Explore • Analyze • Share
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="#market-explorer" className={heroButtonClass}>
          Explore the Market
        </a>

        <Link href="/market-intelligence" className={heroButtonClass}>
          Market Intelligence
        </Link>

        <Link href="/reports" className={heroButtonClass}>
          Professional Reports
        </Link>
      </div>

      <div
        id="market-explorer"
        className="mt-8 flex scroll-mt-4 items-center gap-4 md:mt-10"
      >
        <div className="h-px flex-1 bg-white/20" />

        <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em] text-white">
          Market Explorer
        </span>

        <div className="h-px flex-1 bg-white/20" />
      </div>

      <div className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
        <p>
          Explore Puerto Vallarta real estate by geographic hierarchy.
          Select from zones, areas, communities and developments to discover market
          statistics, active listings, and recent sales.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">
            Need help finding a neighborhood?
          </span>

          <div className="rounded-full border border-slate-500 px-3 py-1.5 text-xs font-bold text-white">
            <AreaGuideModal />
          </div>
        </div>
      </div>
    </section>
  );
}