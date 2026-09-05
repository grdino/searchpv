"use client";

import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Compass,
  Map,
  Search,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentType,
} from "react";

import Header from "@/app/components/Header";
import { ATLAS_DISCOVER_SEQUENCE } from "@/app/components/atlas/AtlasDiscoverConfig";

const ROTATION_MS = 7000;

export default function HomeDiscoveryBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || ATLAS_DISCOVER_SEQUENCE.length < 2) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveIndex(
          (current) =>
            (current + 1) % ATLAS_DISCOVER_SEQUENCE.length,
        );
      }
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  const activeScene = ATLAS_DISCOVER_SEQUENCE[activeIndex];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf7f8] text-slate-950">
      <div aria-hidden="true" className="absolute inset-0">
        {ATLAS_DISCOVER_SEQUENCE.map((scene, index) => (
          <div
            key={scene.id}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2400ms] ease-in-out motion-reduce:transition-none"
            style={{
              backgroundImage: `url("${scene.image}")`,
              opacity: index === activeIndex ? 0.18 : 0,
              transform: "scale(1.025)",
              filter: "saturate(.78) contrast(.9)",
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.91)_0%,rgba(255,255,255,.78)_38%,rgba(237,247,248,.66)_72%,rgba(237,247,248,.84)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-8 pt-8 md:px-8 md:pt-10">
        <Header />

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center pb-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">
            Puerto Vallarta · Riviera Nayarit
          </p>

          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-6xl">
            How would you like to explore?
          </h1>

          <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
            <HomePill
              href="/atlas/discover"
              title="Discover the Bay"
              detail="Take the visual tour"
              Icon={Compass}
              featured
            />

            <HomePill
              href="/search-properties"
              title="Search Properties"
              detail="Traditional listing search"
              Icon={Search}
            />

            <HomePill
              href="/atlas"
              title="Explore the Map"
              detail="Open Atlas directly"
              Icon={Map}
            />

            <HomePill
              href="/market-intelligence"
              title="Market Intelligence"
              detail="Inventory, sales and trends"
              Icon={BarChart3}
            />
          </div>

          <Link
            key={activeScene.id}
            href={`/atlas/discover?scene=${encodeURIComponent(activeScene.id)}`}
            className="group mt-7 inline-flex min-h-11 items-center gap-3 rounded-full border border-white/70 bg-white/65 px-5 text-sm shadow-[0_10px_35px_rgba(15,23,42,.08)] backdrop-blur-xl transition hover:bg-white/90"
          >
            <span className="font-semibold text-slate-500">Discover</span>
            <span className="font-black text-teal-800">
              {activeScene.menuLabel}
            </span>
            <ChevronRight
              aria-hidden="true"
              size={16}
              className="text-teal-700 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </section>
      </div>
    </main>
  );
}

function HomePill({
  href,
  title,
  detail,
  Icon,
  featured = false,
}: {
  href: string;
  title: string;
  detail: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group flex min-h-[82px] items-center gap-4 rounded-[24px] border px-5 py-4 text-left shadow-[0_10px_35px_rgba(15,23,42,.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(15,23,42,.12)]",
        featured
          ? "border-teal-700/20 bg-slate-950 text-white"
          : "border-white/80 bg-white/[0.76] text-slate-950 hover:bg-white/95",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          featured
            ? "bg-cyan-300 text-slate-950"
            : "bg-teal-50 text-teal-800",
        ].join(" ")}
      >
        <Icon size={21} strokeWidth={2.25} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-base font-black">{title}</span>
        <span
          className={[
            "mt-0.5 block text-xs font-semibold",
            featured ? "text-slate-300" : "text-slate-500",
          ].join(" ")}
        >
          {detail}
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        size={18}
        className={[
          "shrink-0 transition-transform group-hover:translate-x-0.5",
          featured ? "text-cyan-300" : "text-teal-700",
        ].join(" ")}
      />
    </Link>
  );
}
