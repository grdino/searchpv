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

    if (
      reducedMotion ||
      ATLAS_DISCOVER_SEQUENCE.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveIndex(
          (current) =>
            (current + 1) %
            ATLAS_DISCOVER_SEQUENCE.length,
        );
      }
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  const activeScene =
    ATLAS_DISCOVER_SEQUENCE[activeIndex];

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#edf7f8] text-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.98)_0%,rgba(255,255,255,.88)_46%,rgba(237,247,248,.74)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-4 pt-5 md:px-8 md:pb-8 md:pt-10">
        <Header />

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-start pb-4 text-center md:pb-16">
          <div className="mb-3 w-full max-w-[190px] md:mb-5 md:max-w-[280px]">
            <DiscoveryPreview
              activeIndex={activeIndex}
              activeScene={activeScene}
            />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 md:text-xs md:tracking-[0.24em]">
            Puerto Vallarta · Riviera Nayarit
          </p>

          <h1 className="mt-3 max-w-2xl text-[34px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-5xl md:mt-5 md:text-6xl md:leading-[1.02]">
            How would you like to explore?
          </h1>

          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-600 md:text-base">
            Search Puerto Vallarta and Riviera Nayarit real estate, explore neighborhoods,
            or dive into local market data.
          </p>

          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2 md:mt-10 md:gap-3">
            
            <HomePill
              href="/search-properties"
              title="Search Properties"
              detail="Traditional listing search"
              Icon={Search}
              tone="teal"
            />

            <HomePill
              href="/atlas"
              title="Explore the Map"
              detail="Open Atlas Map"
              Icon={Map}
              tone="sky"
              hardNavigate
            />

            <HomePill
              href="/market-intelligence"
              title="Market Intelligence"
              detail="Active/Pending Inventory, Closed sales and trends"
              Icon={BarChart3}
              tone="indigo"
            />

            <HomePill
              href="/atlas/discover"
              title="Discover the Bay"
              detail="Take a visual tour"
              Icon={Compass}
              tone="cyan"
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
      href={`/atlas/discover?scene=${encodeURIComponent(
        activeScene.id,
      )}`}
      aria-label={`Discover ${activeScene.menuLabel}`}
      className="group block overflow-hidden rounded-[18px] border border-white/90 bg-white/70 shadow-[0_12px_35px_rgba(15,23,42,.12)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(15,23,42,.16)] md:rounded-[22px]"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/40">
        {ATLAS_DISCOVER_SEQUENCE.map(
          (scene, index) => (
            <img
              key={scene.id}
              src={scene.image}
              alt=""
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[1800ms] ease-in-out motion-reduce:transition-none"
              style={{
                opacity:
                  index === activeIndex ? 0.82 : 0,
              }}
            />
          ),
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/5" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 text-left text-white md:gap-3 md:px-4 md:py-3">
          <span className="min-w-0 truncate text-[11px] font-black drop-shadow-md sm:text-sm">
            {activeScene.menuLabel}
          </span>

          <ChevronRight
            aria-hidden="true"
            size={15}
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
  tone,
  hardNavigate = false,
}: {
  href: string;
  title: string;
  detail: string;
  Icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  tone: "cyan" | "teal" | "sky" | "indigo";
  hardNavigate?: boolean;
}) {
  const toneStyles = {
    cyan: {
      card: "border-cyan-200/80 bg-cyan-50/85 hover:bg-cyan-50",
      icon: "bg-cyan-100 text-cyan-800",
      arrow: "text-cyan-700",
    },
    teal: {
      card: "border-teal-200/80 bg-teal-50/85 hover:bg-teal-50",
      icon: "bg-teal-100 text-teal-800",
      arrow: "text-teal-700",
    },
    sky: {
      card: "border-sky-200/80 bg-sky-50/85 hover:bg-sky-50",
      icon: "bg-sky-100 text-sky-800",
      arrow: "text-sky-700",
    },
    indigo: {
      card: "border-indigo-200/80 bg-indigo-50/85 hover:bg-indigo-50",
      icon: "bg-indigo-100 text-indigo-800",
      arrow: "text-indigo-700",
    },
  }[tone];

  return (
    <Link
      href={href}
      onClick={
        hardNavigate
          ? (event) => {
              event.preventDefault();
              window.location.assign(href);
            }
          : undefined
      }
      className={[
        "group flex min-h-[64px] items-center gap-3 rounded-[20px] border px-4 py-2.5 text-left shadow-[0_10px_35px_rgba(15,23,42,.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(15,23,42,.12)] md:min-h-[82px] md:gap-4 md:rounded-[24px] md:px-5 md:py-4",
        "text-slate-950",
        toneStyles.card,
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11",
          toneStyles.icon,
        ].join(" ")}
      >
        <Icon size={20} strokeWidth={2.25} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black md:text-base">
          {title}
        </span>

        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 md:text-xs">
          {detail}
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        size={17}
        className={[
          "shrink-0 transition-transform group-hover:translate-x-0.5",
          toneStyles.arrow,
        ].join(" ")}
      />
    </Link>
  );
}