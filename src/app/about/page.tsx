import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Database,
  FileCheck2,
  LineChart,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
  X,
  Check,
  Home,
  Handshake,
  Clock3,
  Building2,
} from "lucide-react";
import Image from "next/image";
import HamburgerMenu from "@/app/components/HamburgerMenu";

export const metadata: Metadata = {
  title: "About SearchPV | Puerto Vallarta Market Intelligence",
  description:
    "SearchPV organizes available Puerto Vallarta and Riviera Nayarit MLS market data into clear, interactive real estate reports supported by local professionals.",
};

const stats = [
  {
    icon: Home,
    value: "4,000+",
    label: "Active & Pending Listings",
  },
  {
    icon: Handshake,
    value: "15,000+",
    label: "Closed Sales Analyzed",
  },
  {
    icon: MapPin,
    value: "60+",
    label: "Communities Covered",
  },
  {
    icon: Building2,
    value: "Hundreds",
    label: "of Developments Included",
  },
  {
    icon: Clock3,
    value: "Updated",
    label: "Regularly with New Data",
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Market Intelligence",
    text: "Interactive reports that reveal inventory, pricing, sales activity, and market trends.",
  },
  {
    icon: MapPin,
    title: "Local Focus",
    text: "Detailed statistics by area, community, and development — not just citywide averages.",
  },
  {
    icon: Users,
    title: "Professional Support",
    text: "Have questions? A local real estate professional can help interpret the data and guide next steps.",
  },
  {
    icon: RefreshCw,
    title: "Continuously Improving",
    text: "SearchPV is an evolving platform with new reports, refinements, and data improvements added regularly.",
  },
];

const process = [
  {
    icon: Database,
    title: "Market Data",
    text: "Based primarily on available local MLS data.",
  },
  {
    icon: FileCheck2,
    title: "Review & Standardization",
    text: "We organize, clean, and standardize the data where possible.",
  },
  {
    icon: LineChart,
    title: "Market Analysis",
    text: "Data is analyzed to uncover trends, patterns, and key indicators.",
  },
  {
    icon: MonitorSmartphone,
    title: "Interactive Reports",
    text: "Information is presented in easy-to-use market reports.",
  },
  {
    icon: Target,
    title: "Better Decisions",
    text: "Use the data as a starting point for informed real estate conversations.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950">
        <header className="relative z-20 border-b border-white/10 bg-black">
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.35),transparent_35%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.7)),url('/about-pv-hero.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" />

        <div className="relative mx-auto grid min-h-[540px] max-w-6xl items-center px-4 py-14 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-sky-300">
              About SearchPV
            </p>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-7xl">
              Puerto Vallarta Market Intelligence
            </h1>

            <p className="mt-5 text-2xl font-bold leading-tight text-sky-300 sm:text-3xl">
              Understand the market.
              <br />
              Not just the listings.
            </p>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-100 sm:text-lg">
              SearchPV transforms available real estate market data into clear,
              interactive reports designed to help buyers, sellers, investors,
              and real estate professionals better understand market activity
              across Puerto Vallarta and Riviera Nayarit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#market-explorer"
                className="rounded-lg bg-sky-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400"
              >
                Explore the Markets
              </Link>

              <Link
                href="/contact"
                className="rounded-lg border border-white/50 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white hover:text-slate-950"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        {features.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <Icon size={28} strokeWidth={2.4} />
              </div>

              <h2 className="text-lg font-black text-slate-950">
                {item.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          );
        })}
      </section>

      <section className="bg-sky-50/70 px-4 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="How SearchPV Works" />

          <div className="mt-10 grid gap-6 md:grid-cols-5">
            {process.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="relative text-center">
                  {index < process.length - 1 && (
                    <div className="absolute left-1/2 top-10 hidden h-px w-full bg-sky-300 md:block" />
                  )}

                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-sky-600 bg-white text-sky-700 shadow-sm">
                    <Icon size={34} strokeWidth={1.8} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-950">
                    {index + 1}. {item.title}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid gap-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:grid-cols-[120px_1fr] md:p-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldCheck size={54} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Honest Data. Honest Expectations.
            </h2>

            <p className="mt-3 leading-7 text-slate-700">
              SearchPV is based primarily on available MLS market data,
              enhanced through our own review and organization process. While
              every effort is made to improve consistency and accuracy, no
              single data source captures every property or transaction, and
              occasional errors or omissions may occur.
            </p>

            <p className="mt-3 leading-7 text-slate-700">
              We believe informed decisions begin with transparent information —
              including being transparent about the limits of the data itself.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <SectionHeading title="Supported by Real Professionals" />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfoPanel
            icon={MonitorSmartphone}
            title="Technology"
            text="SearchPV organizes thousands of property records into reports that make complex market information easier to understand."
          />

          <InfoPanel
            icon={Users}
            title="Local Expertise"
            text="When you need more than numbers, the experienced team behind SearchPV is available to answer questions and help you navigate the Puerto Vallarta real estate market."
          />
        </div>
      </section>

      <section className="bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.35),transparent_35%)] px-4 py-10 text-white md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.value}
                className="border-white/15 text-center sm:border-r last:border-r-0"
              >
                <Icon className="mx-auto mb-3 text-sky-300" size={38} />
                <p className="text-3xl font-black">{item.value}</p>
                <p className="mt-2 text-sm leading-5 text-slate-200">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <SectionHeading title="What SearchPV Is — and Isn’t" />

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-6">
            {[
              "A market intelligence platform.",
              "A research tool.",
              "A starting point for informed conversations.",
              "Supported by experienced local real estate professionals.",
            ].map((text) => (
              <div key={text} className="mb-3 flex gap-3 text-sm">
                <Check className="mt-0.5 text-emerald-600" size={18} />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-rose-50 p-6">
            {[
              "Not an appraisal.",
              "Not a complete record of every sale.",
              "Not a substitute for professional advice or due diligence.",
            ].map((text) => (
              <div key={text} className="mb-3 flex gap-3 text-sm">
                <X className="mt-0.5 text-rose-600" size={18} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sky-600 px-4 py-12 text-center text-white md:px-8">
        <h2 className="text-3xl font-black">Ready to Explore the Market?</h2>

        <p className="mx-auto mt-3 max-w-2xl text-sky-50">
          Browse communities, compare neighborhoods, or contact our team with
          your questions.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#market-explorer"
            className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
          >
            Explore SearchPV
          </Link>

          <Link
            href="/contact"
            className="rounded-lg border border-white/60 px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-sky-700"
          >
            Contact Our Team
          </Link>
        </div>
      </section>

      <footer className="px-4 py-4 text-center text-xs text-slate-500">
        SearchPV market information is based primarily on available MLS data and
        is deemed reliable but not guaranteed.
      </footer>
    </main>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-black text-slate-950">{title}</h2>
      <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-sky-500" />
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MonitorSmartphone;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700">
        <Icon size={34} strokeWidth={1.8} />
      </div>

      <h3 className="text-xl font-black text-slate-950">{title}</h3>

      <p className="mt-3 leading-7 text-slate-600">{text}</p>
    </div>
  );
}