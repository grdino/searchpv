"use client";

import Link from "next/link";
import { BarChart3, ChevronRight, Compass, Map, Search } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

import Header from "@/app/components/Header";
import {
  ATLAS_DISCOVER_SEQUENCE,
  type AtlasDiscoverSceneConfig,
} from "@/app/components/atlas/AtlasDiscoverConfig";

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.98)_0%,rgba(255,255,255,.88)_46%,rgba(237,247,248,.74)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-8 pt-8 md:px-8 md:pt-10">
        <Header />

        <div className="absolute left-8 top-[108px] hidden w-[280px] md:block">
          <DiscoveryPreview
            activeIndex={activeIndex}
            activeScene={activeScene}
          />
        </div>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center pb-12 text-center md:pb-16">
          <div className="mb-7 w-full max-w-[230px] md:hidden">
            <DiscoveryPreview
              activeIndex={activeIndex}
              activeScene={activeScene}
            />
          </div>

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
        </section>
      </div>
    </main>
  );
}

function DiscoveryPreview({
  activeIndex,
  activeScene,
}: {
  activeIndex: number;
  activeScene: AtlasDiscoverSceneConfig;
}) {
  return (
    <Link
      href={`/atlas/discover?scene=${encodeURIComponent(activeScene.id)}`}
      aria-label={`Discover ${activeScene.menuLabel}`}
      className="group block overflow-hidden rounded-[22px] border border-white/90 bg-white/70 shadow-[0_12px_35px_rgba(15,23,42,.12)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(15,23,42,.16)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/40">
        {ATLAS_DISCOVER_SEQUENCE.map((scene, index) => (
          <img
            key={scene.id}
            src={scene.image}
            alt=""
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[1800ms] ease-in-out motion-reduce:transition-none"
            style={{ opacity: index === activeIndex ? 0.82 : 0 }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/5" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-left text-white">
          <span className="min-w-0 truncate text-xs font-black drop-shadow-md sm:text-sm">
            {activeScene.menuLabel}
          </span>

          <ChevronRight
            aria-hidden="true"
            size={16}
            className="shrink-0 drop-shadow-md transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
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
