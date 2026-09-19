import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Building2,
  Check,
  Database,
  FileCheck2,
  Handshake,
  Home,
  LineChart,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import HamburgerMenu from "@/app/components/HamburgerMenu";

export const metadata: Metadata = {
  title: "About SearchPV",
  description:
    "Learn why SearchPV was created and how it helps buyers, sellers, investors, and real estate professionals understand the Puerto Vallarta and Riviera Nayarit market.",
  alternates: { canonical: "https://searchpv.com/about" },
  robots: { index: true, follow: true },
};

const features = [
  {
    icon: BarChart3,
    title: "Market Intelligence",
    text: "Interactive reports that put inventory, pricing, sales activity, and market trends into useful context.",
  },
  {
    icon: MapPin,
    title: "Local Detail",
    text: "Explore the market by area, community, and development — not just broad citywide averages.",
  },
  {
    icon: MonitorSmartphone,
    title: "Practical Tools",
    text: "Search, compare, map, and explore properties using tools designed around the questions real buyers and sellers ask.",
  },
  {
    icon: RefreshCw,
    title: "Always Evolving",
    text: "SearchPV is an ongoing project, with new tools, refinements, and data improvements added as useful ideas emerge.",
  },
];

const stats = [
  { icon: Home, value: "4,000+", label: "Active & Pending Listings" },
  { icon: Handshake, value: "15,000+", label: "Closed Sales Analyzed" },
  { icon: MapPin, value: "60+", label: "Communities Covered" },
  { icon: Building2, value: "Hundreds", label: "of Developments Included" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950">
        <header className="relative z-20 border-b border-white/10 bg-black">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/spv_logo_round.png" alt="SearchPV" width={44} height={44} priority className="h-11 w-11" />
              <span className="text-3xl font-black tracking-tight text-white">
                Search<span className="text-sky-400">PV</span>
              </span>
            </Link>
            <div className="text-white"><HamburgerMenu /></div>
          </div>
        </header>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.35),transparent_35%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.7)),url('/about-pv-hero.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" />

        <div className="relative mx-auto grid min-h-[540px] max-w-6xl items-center px-4 py-14 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-sky-300">About SearchPV</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-7xl">
              Puerto Vallarta Market Intelligence
            </h1>
            <p className="mt-5 text-2xl font-bold leading-tight text-sky-300 sm:text-3xl">
              Understand the market.<br />Not just the listings.
            </p>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-100 sm:text-lg">
              SearchPV brings property search, local geography, and real estate market data together to help people better understand their options across Puerto Vallarta and Riviera Nayarit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/buyer-explorer" className="rounded-lg bg-sky-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400">
                Explore Your Options
              </Link>
              <Link href="/contact" className="rounded-lg border border-white/50 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white hover:text-slate-950">
                Ask a Question
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-11 md:px-8 md:py-14">
        <div className="grid gap-8 md:grid-cols-[0.78fr_1.22fr] md:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Why SearchPV Exists</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Better information.<br />Better decisions.
            </h2>
          </div>

          <div>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {[
                ["Where does my budget fit?", "See where your money gives you the most options."],
                ["How do areas compare?", "Understand differences in inventory, pricing, and market activity."],
                ["Is this property typical?", "Put an individual listing into its market context."],
                ["What has actually been selling?", "Look beyond asking prices to recent market activity."],
              ].map(([title, text]) => (
                <div key={title} className="border-l-2 border-sky-400 pl-4">
                  <h3 className="font-black text-slate-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 max-w-2xl text-sm leading-6 text-slate-600">
              SearchPV brings listings, market data, maps, and comparisons together so you can explore these questions at your own pace — without having to start with a sales conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="What You'll Find Here" title="Research first. Help when you want it." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Icon size={28} strokeWidth={2.2} />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="p-7 md:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Behind SearchPV</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Built from real estate experience and a data mindset.</h2>
              <div className="mt-6 space-y-4 leading-7 text-slate-600">
                <p>
                  SearchPV was created and developed by <strong className="text-slate-900">Gerry Ray</strong>, combining a long background in technology and data with extensive experience in the Puerto Vallarta real estate market.
                </p>
                <p>
                  Gerry is a member of <strong className="text-slate-900">AMPI (Asociación Mexicana de Profesionales Inmobiliarios)</strong> and approaches SearchPV much the same way he approaches real estate: understand the information, ask good questions, and let the facts help guide the conversation.
                </p>
                <p>
                  SearchPV continues to evolve as an independent research and learning project, shaped by practical questions that come up when people are trying to understand this market.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-slate-950 p-7 text-white md:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">A Simple Philosophy</p>
              <p className="mt-4 text-2xl font-black leading-snug">The property either makes sense for you, or it doesn&apos;t.</p>
              <p className="mt-5 leading-7 text-slate-300">
                Good real estate guidance should make it easier to understand the choices, the tradeoffs, and the details — including when the right decision is not to move forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sky-50/70 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="When You Need More Than Data" title="Local professional support" />
          <div className="mx-auto mt-8 max-w-4xl text-center text-base leading-8 text-slate-600">
            <p>
              SearchPV is designed so you can research independently. If you reach the point where you want personal help, Gerry and a team of experienced local real estate professionals can assist with property questions, market context, showings, negotiations, and transaction coordination.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
            <SupportCard icon={Users} title="Real Estate Guidance" text="Local professionals who can help interpret the market and work through the practical details of a purchase or sale." />
            <SupportCard icon={FileCheck2} title="Due Diligence" text="Transactions are supported by experienced closing attorneys and other appropriate professionals so legal and closing details receive proper review." />
            <SupportCard icon={ShieldCheck} title="No Pressure" text="Ask a question, request help, or simply keep researching. SearchPV is useful whether or not you ever become a client." />
          </div>

          <div className="mx-auto mt-9 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
            <p>
              <strong className="text-slate-900">Professional affiliation:</strong> Gerry Ray is an AMPI member and is currently affiliated with <strong className="text-slate-900">Ron Morgan Properties</strong> in Puerto Vallarta. Professional real estate assistance is available for SearchPV visitors who would like help moving from research to a transaction.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 md:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Database size={30} strokeWidth={1.9} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">Transparent about the data.</h2>
            <p className="mt-4 leading-7 text-slate-700">
              SearchPV is based primarily on available local MLS data, which is organized, standardized, and transformed for analysis. No data source captures every property or transaction, and source data can contain delays, inconsistencies, errors, or omissions.
            </p>
            <p className="mt-4 leading-7 text-slate-700">
              We would rather explain those limitations than hide them.
            </p>
            <Link href="/data-methodology" className="mt-6 inline-flex font-bold text-sky-700 transition hover:text-sky-500">
              Read Data &amp; Methodology →
            </Link>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7 text-white md:p-9">
            <h2 className="text-2xl font-black">What SearchPV is — and isn&apos;t.</h2>
            <div className="mt-6 space-y-4">
              {["A market research platform", "A set of practical real estate tools", "A starting point for informed conversations", "A way to explore before talking to an agent"].map((text) => (
                <div key={text} className="flex gap-3 text-sm text-slate-200"><Check className="mt-0.5 shrink-0 text-sky-300" size={18} /><span>{text}</span></div>
              ))}
            </div>
            <div className="my-6 h-px bg-white/10" />
            <p className="text-sm leading-6 text-slate-400">
              SearchPV is not an appraisal, legal opinion, or substitute for professional due diligence.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <Icon className="mx-auto mb-3 text-sky-300" size={34} />
                <p className="text-3xl font-black">{item.value}</p>
                <p className="mt-2 text-sm leading-5 text-slate-300">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-sky-600 px-4 py-12 text-center text-white md:px-8">
        <h2 className="text-3xl font-black">Explore first. Ask when you&apos;re ready.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sky-50">
          Use SearchPV to understand the market on your own, or reach out when a question would benefit from local context.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/buyer-explorer" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50">Where Does My Budget Fit?</Link>
          <Link href="/contact" className="rounded-lg border border-white/60 px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-sky-700">Ask a Question</Link>
        </div>
      </section>

      <footer className="px-4 py-4 text-center text-xs text-slate-500">
        SearchPV market information is based primarily on available MLS data and is deemed reliable but not guaranteed.
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="text-center">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-sky-500" />
    </div>
  );
}

function SupportCard({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
        <Icon size={25} strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
