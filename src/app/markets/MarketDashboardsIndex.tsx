"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import SPVBranding from "@/app/components/SPVBranding";
import styles from "./markets.module.css";
import { MARKET_DASHBOARDS } from "@/lib/market-dashboard/listing-links";

/* Registry-driven: publishing a reviewed market automatically adds it here. */
const dashboards = Object.values(MARKET_DASHBOARDS).filter((market) => market.published).map((market) => ({
  slug: market.slug,
  name: market.displayName,
  area: market.breadcrumb.length > 2 ? market.breadcrumb[1] : market.displayName,
  region: market.breadcrumb[0] ?? "Puerto Vallarta",
  description: market.cardDescription,
}));

/* legacy literal removed */


type Snapshot = { active: number; sold12m: number; asOf: string | null };

export default function MarketDashboardsIndex() {
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});

  useEffect(() => {
    const controllers = dashboards.map((market) => {
      const controller = new AbortController();
      const params = new URLSearchParams({ property: "Condo", bedrooms: "All", segment: "Both" });
      fetch(`/api/market-dashboard/${market.slug}?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (!body) return;
          setSnapshots((current) => ({
            ...current,
            [market.slug]: {
              active: body.current?.active ?? 0,
              sold12m: body.current?.sold12m ?? 0,
              asOf: body.asOf ?? null,
            },
          }));
        })
        .catch((error) => { if (error?.name !== "AbortError") console.error(error); });
      return controller;
    });
    return () => controllers.forEach((controller) => controller.abort());
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.siteHeader}>
        <SPVBranding />
        <div className={styles.headerDescriptor}>PUERTO VALLARTA MARKET INTELLIGENCE</div>
        <div className={styles.headerMenu}><HamburgerMenu /></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>SEARCHPV MARKET INTELLIGENCE</div>
        <h1>Market Dashboards</h1>
        <p>Choose a market to examine current inventory, closed-sale trends, pricing, seller behavior and market composition.</p>
      </section>

      <section className={styles.content}>
        <div className={styles.sectionHead}>
          <div><span>PUERTO VALLARTA</span><h2>Compare markets one at a time.</h2></div>
          <p>Each dashboard uses the same analytical framework, so the market changes while the way you read it stays familiar.</p>
        </div>

        <div className={styles.grid}>
          {dashboards.map((market) => {
            const snapshot = snapshots[market.slug];
            return (
              <Link key={market.slug} href={`/market/${market.slug}`} className={styles.card}>
                <div className={styles.cardTop}><span>{market.region} / {market.area}</span><b>MARKET DASHBOARD →</b></div>
                <h3>{market.name}</h3>
                <p>{market.description}</p>
                <div className={styles.metrics}>
                  <div><strong>{snapshot ? snapshot.active : "—"}</strong><span>Available</span></div>
                  <div><strong>{snapshot ? snapshot.sold12m : "—"}</strong><span>Sold · 12M</span></div>
                </div>
                <div className={styles.open}>Open {market.name} Dashboard <span>→</span></div>
              </Link>
            );
          })}
        </div>

        <div className={styles.note}>
          <span>MORE MARKETS ARE COMING</span>
          <p>SearchPV publishes a Market Dashboard only where the underlying MLS history is substantial enough to support meaningful analysis. Additional Puerto Vallarta and Riviera Nayarit markets will be added as they are reviewed.</p>
        </div>
      </section>
    </main>
  );
}
