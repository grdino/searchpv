import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  GitCompareArrows,
  Home,
  House,
  Layers3,
  LineChart,
  Map,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import HamburgerMenu from "@/app/components/HamburgerMenu";

export const metadata: Metadata = {
  title: "Data & Methodology | SearchPV",
  description:
    "Learn how SearchPV organizes Vallarta-Nayarit MLS data, geography, and calculated metrics to create Puerto Vallarta and Riviera Nayarit market intelligence.",
  alternates: { canonical: "https://searchpv.com/data-methodology" },
  robots: { index: true, follow: true },
};

const pipeline = [
  {
    number: "01",
    icon: Database,
    eyebrow: "Source",
    title: "MLS Market Data",
    text: "Vallarta-Nayarit MLS records for Condos and Houses.",
    detail: "Active · Pending · Closed",
  },
  {
    number: "02",
    icon: RefreshCw,
    eyebrow: "Organize",
    title: "Process the Data",
    text: "Records are cleaned, standardized, related, and prepared for analysis.",
    detail: "Properties · Listings · Sales",
  },
  {
    number: "03",
    icon: MapPin,
    eyebrow: "Context",
    title: "Add Geography",
    text: "Market records are connected to useful location and development context.",
    detail: "Area · Community · Development",
  },
  {
    number: "04",
    icon: Calculator,
    eyebrow: "Analyze",
    title: "Calculate Metrics",
    text: "SearchPV derives market measures from the underlying records.",
    detail: "Inventory · Pricing · Sales · Trends",
  },
  {
    number: "05",
    icon: BarChart3,
    eyebrow: "Present",
    title: "Make It Useful",
    text: "The results become visual tools for exploring properties and the market.",
    detail: "Search · Atlas · Reports · Comparisons",
  },
];

const statuses = [
  {
    label: "Active",
    title: "Currently offered for sale",
    text: "A snapshot of available Condo and House inventory represented in the MLS data processed by SearchPV.",
  },
  {
    label: "Pending",
    title: "Under contract",
    text: "Listings reported as pending but not yet recorded as closed, providing context between available inventory and completed sales.",
  },
  {
    label: "Closed",
    title: "Completed transactions",
    text: "Recorded closed sales used to examine historical pricing, sales activity, market behavior, and comparisons.",
  },
];

const metrics = [
  { icon: Home, title: "Inventory", text: "How many properties are available?" },
  { icon: BarChart3, title: "Pricing", text: "What do asking and sold prices look like?" },
  { icon: Calculator, title: "Price per m²", text: "How does pricing compare across properties?" },
  { icon: TrendingUp, title: "Sales Activity", text: "What has actually been closing?" },
  { icon: Clock3, title: "Days on Market", text: "How long have properties taken to sell?" },
  { icon: GitCompareArrows, title: "List vs. Sale", text: "How did final prices compare with asking prices?" },
  { icon: LineChart, title: "Market Change", text: "How are key measures moving over time?" },
  { icon: Building2, title: "Local Context", text: "How do communities and developments compare?" },
];

const limitations = [
  {
    title: "Coverage",
    text: "SearchPV market analysis currently focuses on Condos and Houses. Other MLS property types are not included.",
  },
  {
    title: "Accuracy",
    text: "Source records may contain errors, omissions, inconsistent entries, or information entered differently from one listing to another.",
  },
  {
    title: "Timing",
    text: "SearchPV uses periodic MLS extracts rather than a real-time data feed. Recent changes may not yet be reflected.",
  },
  {
    title: "Geography",
    text: "MLS market areas and real-world geographic boundaries do not always describe places in exactly the same way.",
  },
];

export default function DataMethodologyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative bg-slate-950">
        <header className="relative z-50 border-b border-white/10 bg-black">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/spv_logo_round.png"
                alt="SearchPV"
                width={44}
                height={44}
                priority
                className="h-11 w-11"
              />
              <span className="text-3xl font-black tracking-tight text-white">
                Search<span className="text-sky-400">PV</span>
              </span>
            </Link>
            <div className="text-white">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">
              Data &amp; Methodology
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-7xl">
              From market data
              <br />
              <span className="text-sky-300">to market intelligence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              SearchPV organizes and analyzes available real estate data to make the Puerto Vallarta and Riviera Nayarit market easier to explore and understand.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
              <ArrowDown size={17} className="text-sky-300" />
              See how the data moves through SearchPV
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">The Data Pipeline</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Source data becomes useful context.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            SearchPV does more than display records. It organizes them, connects them, and calculates useful market context around them.
          </p>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {pipeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.number} className="contents">
                <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="absolute right-4 top-3 text-4xl font-black text-slate-100">{item.number}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Icon size={22} />
                  </div>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">{item.eyebrow}</p>
                  <h3 className="mt-1 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
                </div>
                {index < pipeline.length - 1 && (
                  <>
                    <div className="hidden items-center justify-center px-1 text-sky-400 lg:flex">
                      <ArrowRight size={22} />
                    </div>
                    <div className="flex justify-center py-1 text-sky-400 lg:hidden">
                      <ArrowDown size={22} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-slate-950 px-6 py-5 text-center text-sm leading-6 text-slate-200">
          <strong className="text-white">The original data isn&apos;t replaced.</strong>{" "}
          SearchPV organizes it, relates it, and adds calculated context around it.
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 md:px-8 md:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Property Coverage</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">What&apos;s included?</h2>
              <p className="mt-4 leading-7 text-slate-600">
                SearchPV market analysis currently focuses on the two residential property types most central to the platform.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Building2 size={25} />
                  </div>
                  <div>
                    <p className="text-xl font-black">Condos</p>
                    <p className="text-sm text-slate-500">Included in market analysis</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <House size={25} />
                  </div>
                  <div>
                    <p className="text-xl font-black">Houses</p>
                    <p className="text-sm text-slate-500">Included in market analysis</p>
                  </div>
                </div>
              </div>
              <p className="sm:col-span-2 text-sm leading-6 text-slate-500">
                Other MLS property types are not currently included in SearchPV market analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Listing Status</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Three views of the market.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {statuses.map((status, index) => (
            <div key={status.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">0{index + 1}</span>
                  <CheckCircle2 size={20} className="text-sky-300" />
                </div>
                <h3 className="mt-2 text-2xl font-black">{status.label}</h3>
              </div>
              <div className="p-6">
                <p className="font-black text-slate-900">{status.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{status.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sky-50/70 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Geography</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Two ways to understand place.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              SearchPV intentionally keeps market geography and mapped geography distinct because they answer different questions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Layers3 size={28} />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Market Intelligence</p>
              <h3 className="mt-2 text-2xl font-black">MLS Geography</h3>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
                {["Zone", "Area", "Community", "Development"].map((item, index) => (
                  <span key={item} className="contents">
                    <span className="rounded-lg bg-slate-100 px-3 py-2">{item}</span>
                    {index < 3 && <ArrowRight size={15} className="text-slate-400" />}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-600">
                Used to analyze the market according to the location structure represented in MLS records.
              </p>
            </div>

            <div className="flex items-center justify-center py-2 text-sky-500">
              <GitCompareArrows size={30} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Map size={28} />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Atlas</p>
              <h3 className="mt-2 text-2xl font-black">Mapped Geography</h3>
              <div className="mt-6 rounded-xl bg-slate-950 p-4 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <MapPin className="shrink-0 text-sky-300" size={20} />
                  <span>Real-world mapped location and spatial context</span>
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-600">
                Used to help visitors understand where places are and how locations relate to one another geographically.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-6 text-slate-600">
            MLS geography is useful for understanding the market as it is recorded. Atlas geography is useful for understanding where a place actually is. They may overlap without being identical.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Calculated by SearchPV</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">What do we calculate?</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Individual source records become more useful when they are grouped and compared in consistent ways.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.title} className="flex gap-4 border-l-2 border-sky-400 pl-4">
                  <Icon size={22} className="mt-0.5 shrink-0 text-sky-700" />
                  <div>
                    <h3 className="font-black">{metric.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{metric.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">An Important Distinction</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Reported data vs. calculated metrics.</h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <Database className="text-sky-300" size={30} />
              <h3 className="mt-4 text-xl font-black">Reported Data</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Information contained in the underlying MLS records — such as list price, sold price, status, dates, property characteristics, and reported location.
              </p>
            </div>
            <div className="flex justify-center text-sky-300">
              <ArrowRight className="hidden md:block" size={30} />
              <ArrowDown className="md:hidden" size={30} />
            </div>
            <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-7">
              <Calculator className="text-sky-300" size={30} />
              <h3 className="mt-4 text-xl font-black">SearchPV Calculations</h3>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Measures derived from those records — such as counts, averages, medians, ratios, trends, comparisons, and geographic aggregations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">Limitations</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Data has limits.</h2>
            <p className="mt-4 text-xl font-bold text-slate-700">We think you should know them.</p>
            <p className="mt-5 leading-7 text-slate-600">
              SearchPV cleans and standardizes data where practical, but does not treat imperfect source data as more precise than it actually is.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {limitations.map((item) => (
              <div key={item.title} className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-sky-600 p-7 text-white md:p-9">
              <RefreshCw size={34} />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-sky-100">Data Freshness</p>
              <h2 className="mt-2 text-3xl font-black">Periodic, not real-time.</h2>
            </div>
            <div className="p-7 md:p-9">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                <span className="rounded-lg bg-slate-100 px-3 py-2">MLS Data</span>
                <ArrowRight size={16} className="text-sky-500" />
                <span className="rounded-lg bg-slate-100 px-3 py-2">Periodic Extract</span>
                <ArrowRight size={16} className="text-sky-500" />
                <span className="rounded-lg bg-slate-100 px-3 py-2">Process</span>
                <ArrowRight size={16} className="text-sky-500" />
                <span className="rounded-lg bg-slate-100 px-3 py-2">SearchPV</span>
              </div>
              <p className="mt-6 leading-7 text-slate-600">
                SearchPV periodically imports newly available MLS data and processes it through its data pipeline. Because this is not a real-time MLS feed, recent listing, status, or transaction changes may not yet be reflected.
              </p>
              <p className="mt-4 text-sm font-bold leading-6 text-slate-700">
                Where applicable, SearchPV pages display the snapshot date for the data being shown.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 md:p-9">
            <FileSearch className="text-sky-700" size={32} />
            <h2 className="mt-5 text-2xl font-black">Use the numbers as context.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              SearchPV is designed for market research and exploration. Its calculations are informational and should be considered alongside the underlying property details and appropriate professional due diligence.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-7 text-white md:p-9">
            <Search className="text-sky-300" size={32} />
            <h2 className="mt-5 text-2xl font-black">Question a number?</h2>
            <p className="mt-4 leading-7 text-slate-300">
              If something looks unusual or you want to understand how a figure was calculated, ask. Good market intelligence should be explainable.
            </p>
            <Link href="/contact" className="mt-6 inline-flex font-bold text-sky-300 transition hover:text-sky-200">
              Contact SearchPV →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-sky-600 px-4 py-12 text-center text-white md:px-8">
        <h2 className="text-3xl font-black">Explore the market with the methodology in view.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sky-50">
          SearchPV is built to make the data easier to understand without hiding where it came from or what its limitations are.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/market-intelligence" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50">
            Explore Market Intelligence
          </Link>
          <Link href="/about" className="rounded-lg border border-white/60 px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-sky-700">
            About SearchPV
          </Link>
        </div>
      </section>

      <footer className="bg-black px-4 py-8 text-center text-xs leading-5 text-slate-400 md:px-8">
        <p className="mx-auto max-w-4xl">
          SearchPV provides real estate market information for general informational purposes. Data may contain errors, omissions, delays, or inconsistencies and should not be relied upon as an appraisal, legal opinion, or substitute for independent verification and professional due diligence.
        </p>
      </footer>
    </main>
  );
}
