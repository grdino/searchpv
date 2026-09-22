"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import SPVBranding from "@/app/components/SPVBranding";
import styles from "./imd.module.css";
import { buildMarketListingUrl } from "@/lib/market-dashboard/listing-links";

type PropertyType = "Condo" | "House";
type Bedrooms = "All" | "Studio" | "1 BR" | "2 BR" | "3+ BR";
type Segment = "Both" | "Resale" | "Pre-sale";
type PulseMetric = "Sold $/m²" | "Closed sales" | "DOM";
type Period = "12M" | "24M" | "5Y";

type MarketData = {
  asOf: string | null;
  current: { active: number; pending: number; sold12m: number; medianSold12m: number | null };
  priceBands: { label: string; count: number }[];
  composition: { label: string; count: number }[];
  history: {
    soldMonthly: { date: string; label: string; soldPricePerSqm: number | null; closedSales: number; dom: number | null }[];
    soldQuarterly: { key: string; soldPricePerSqm: number | null; closedSales: number; dom: number | null }[];
    soldYearly: { year: number; soldPricePerSqm: number | null; closedSales: number; dom: number | null }[];
    priorYearMtd: { date: string; throughDate: string; soldPricePerSqm: number | null; closedSales: number; dom: number | null } | null;
    priorYearYtd: { date: string; throughDate: string; soldPricePerSqm: number | null; closedSales: number; dom: number | null } | null;
    active: { snapshot_date: string; active_listing_count: number; median_list_price: number; median_price_per_sqm: number; median_dom: number }[];
    pending: { snapshot_date: string; pending_listing_count: number }[];
  };
  sellerBehavior: {
    finalAsking: { median: number | null; bands: { label: string; count: number }[] };
    originalAsking: { median: number | null; bands: { label: string; count: number }[] };
    sampleSize: number;
  };
};

export default function InteractiveMarketDashboard() {
  const searchParams = useSearchParams();
  const [propertyType, setPropertyType] = useState<PropertyType>(() => parsePropertyParam(searchParams.get("property")));
  const [bedrooms, setBedrooms] = useState<Bedrooms>(() => parseBedroomParam(searchParams.get("bedrooms")));
  const [segment, setSegment] = useState<Segment>(() => parseSegmentParam(searchParams.get("segment")));
  const [pulse, setPulse] = useState<PulseMetric>("Sold $/m²");
  const [period, setPeriod] = useState<Period>("12M");
  const [askingBasis, setAskingBasis] = useState<"Final asking" | "Original asking">("Final asking");
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cockpitRef = useRef<HTMLElement | null>(null);
  const [cockpitVisible, setCockpitVisible] = useState(false);

  useEffect(() => {
    const node = cockpitRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setCockpitVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setCockpitVisible(true); observer.disconnect(); }
    }, { threshold: 0.28 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ property: propertyType, bedrooms, segment });
    const nextUrl = `/market/zona-romantica?${params.toString()}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [propertyType, bedrooms, segment]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ property: propertyType, bedrooms, segment });
    setLoading(true);
    setError(null);

    fetch(`/api/market-dashboard/zona-romantica?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load market data.");
        return body as MarketData;
      })
      .then((body) => {
        setData(body);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "Unable to load market data.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [propertyType, bedrooms, segment]);

  const trendBars = useMemo(() => {
    if (!data) return [];

    const asOf = new Date(`${data.asOf}T00:00:00Z`);
    const currentYear = asOf.getUTCFullYear();
    const priorYear = currentYear - 1;
    const currentMonth = asOf.getUTCMonth();
    const byMonth = new Map(data.history.soldMonthly.map((r) => [r.date.slice(0, 7), r]));

    const metricValue = (row: MarketData["history"]["soldMonthly"][number] | undefined) => {
      if (!row) return null;
      const raw = pulse === "Sold $/m²" ? row.soldPricePerSqm : pulse === "Closed sales" ? row.closedSales : row.dom;
      const n = raw === null || raw === undefined ? null : Number(raw);
      return n !== null && Number.isFinite(n) ? n : null;
    };

    // 12M is the detailed year-over-year instrument: Jan through the current
    // month, paired against the same months last year. Current month uses the
    // same through-date in the prior year.
    if (period === "12M") {
      return Array.from({ length: currentMonth + 1 }, (_, month) => {
        const mm = String(month + 1).padStart(2, "0");
        const currentKey = `${currentYear}-${mm}`;
        const priorKey = `${priorYear}-${mm}`;
        const currentRow = byMonth.get(currentKey);
        const priorRow = month === currentMonth && data.history.priorYearMtd
          ? {
              soldPricePerSqm: data.history.priorYearMtd.soldPricePerSqm,
              closedSales: data.history.priorYearMtd.closedSales,
              dom: data.history.priorYearMtd.dom,
            } as MarketData["history"]["soldMonthly"][number]
          : byMonth.get(priorKey);

        return {
          label: month === currentMonth ? `${monthShort(month)} MTD` : monthShort(month),
          current: metricValue(currentRow),
          prior: metricValue(priorRow),
          currentYear,
          priorYear,
          isMtd: month === currentMonth,
          sampleSize: currentRow?.closedSales ?? 0,
          priorSampleSize: priorRow?.closedSales ?? 0,
        };
      });
    }

    // 24M uses transaction-level quarterly aggregates from the API.
    // Each quarter is compared with the same quarter one year earlier.
    if (period === "24M") {
      const byQuarter = new Map((data.history.soldQuarterly ?? []).map((row) => [row.key, row]));
      return Array.from({ length: 4 }, (_, i) => {
        const endQuarter = Math.floor(currentMonth / 3);
        const d = new Date(Date.UTC(currentYear, (endQuarter - (3 - i)) * 3, 1));
        const year = d.getUTCFullYear();
        const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
        const currentRow = byQuarter.get(`${year}-Q${quarter}`);
        const priorRow = byQuarter.get(`${year - 1}-Q${quarter}`);
        return {
          label: `Q${quarter}`,
          comparisonYears: `${year} / ${year - 1}`,
          current: aggregateMetricValue(currentRow, pulse),
          prior: aggregateMetricValue(priorRow, pulse),
          currentYear: year,
          priorYear: year - 1,
          isMtd: i === 3,
          sampleSize: currentRow?.closedSales || 0,
          priorSampleSize: priorRow?.closedSales || 0,
        };
      });
    }

    // 5Y uses transaction-level annual aggregates. Current year is YTD
    // through the dashboard as-of date; previous years are complete years.
    const byYear = new Map((data.history.soldYearly ?? []).map((row) => [row.year, row]));
    return Array.from({ length: 5 }, (_, i) => {
      const year = currentYear - 4 + i;
      const isCurrent = year === currentYear;
      const row = byYear.get(year);
      return {
        label: isCurrent ? `${year} YTD` : String(year),
        current: aggregateMetricValue(row, pulse),
        prior: null,
        currentYear: year,
        priorYear: 0,
        isMtd: isCurrent,
        sampleSize: row?.closedSales || 0,
      };
    });
  }, [data, pulse, period]);

  const barChart = useMemo(() => buildBarChart(trendBars), [trendBars]);
  const fiveYearComparison = useMemo(() => {
    if (!data || period !== "5Y" || !data.history.priorYearYtd) return null;
    const current = trendBars.at(-1);
    if (!current || current.current === null) return null;
    const prior = data.history.priorYearYtd;
    const priorValue = pulse === "Sold $/m²"
      ? prior.soldPricePerSqm
      : pulse === "Closed sales"
        ? prior.closedSales
        : prior.dom;
    if (priorValue === null || priorValue === undefined || Number(priorValue) === 0) return null;
    const change = ((Number(current.current) - Number(priorValue)) / Number(priorValue)) * 100;
    return {
      change,
      currentLabel: current.label,
      previousLabel: `the same period in ${new Date(`${prior.throughDate}T00:00:00Z`).getUTCFullYear()}`,
    };
  }, [data, period, trendBars, pulse]);
  const showMtdContext = Boolean(data && period === "12M");
  const thinSelection = period === "12M" &&
    trendBars.filter((row) => row.current !== null).length > 0 &&
    trendBars.filter((row) => row.current !== null).every((row) => (row.sampleSize ?? 0) <= 4);
  const seller = data?.sellerBehavior[askingBasis === "Final asking" ? "finalAsking" : "originalAsking"];
  const maxBand = Math.max(...(data?.priceBands.map((x) => x.count) || [1]), 1);
  const maxComposition = Math.max(...(data?.composition.map((x) => x.count) || [1]), 1);
  const compositionTotal = data?.composition.reduce((sum, row) => sum + row.count, 0) || 0;
  const dashboardStateUrl = buildDashboardStateUrl(propertyType, bedrooms, segment);
  const matchingPropertiesUrl = buildMatchingPropertiesUrl(propertyType, bedrooms, segment, dashboardStateUrl);
  const availableListingsUrl = buildMarketListingUrl("zona-romantica", {
    status: "active",
    propertyType,
    bedrooms,
    segment,
  });
  const sold12mUrl = buildSnapshotSold12mUrl(
    propertyType,
    bedrooms,
    segment
  );
  const pendingListingsUrl = buildMarketListingUrl("zona-romantica", {
    status: "pending",
    propertyType,
    bedrooms,
    segment,
  });
  const inventoryHistory = data?.history.active || [];
  const inventoryFirst = inventoryHistory[0] || null;
  const inventoryLast = inventoryHistory.at(-1) || null;
  const inventoryMax = Math.max(...inventoryHistory.map((row) => Number(row.active_listing_count)), 1);
  const inventoryMin = Math.min(...inventoryHistory.map((row) => Number(row.active_listing_count)), inventoryMax);
  const inventoryRange = Math.max(inventoryMax - inventoryMin, 1);
  const inventoryPath = inventoryHistory.length > 1
    ? inventoryHistory.map((row, index) => {
        const x = index / (inventoryHistory.length - 1) * 100;
        const y = 90 - ((Number(row.active_listing_count) - inventoryMin) / inventoryRange) * 72;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" ")
    : "";

  const marketBrief = useMemo(() => {
    if (!data) return null;
    const propertyWord = propertyType === "Condo" ? "condos" : "houses";
    const selection = bedrooms === "All" ? propertyWord : `${bedrooms} ${propertyWord}`;
    const segmentText = segment === "Both" ? "Resale + pre-construction" : segment;
    return {
      active: data.current.active ?? 0,
      sold: data.current.sold12m ?? 0,
      median: money(data.current.medianSold12m),
      selection: `${segmentText} · ${selection}`,
      observedSince: inventoryFirst ? shortDate(inventoryFirst.snapshot_date) : null,
    };
  }, [data, propertyType, bedrooms, segment, inventoryFirst]);

  return (
    <main className={styles.page}>
      <header className={styles.siteHeader}>
        <SPVBranding />
        <div className={styles.headerDescriptor}>PUERTO VALLARTA MARKET INTELLIGENCE</div>
        <div className={styles.headerMenu}><HamburgerMenu /></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>INTERACTIVE MARKET DASHBOARD</div>
        <h1>Zona Romántica <span>Real Estate Market</span></h1>
        <p className={styles.snapshot}>Puerto Vallarta / Centro South / Zona Romántica</p>
        <section className={styles.marketBrief}>
          <div>
            <span>MARKET BRIEF</span>
            <p>Explore the Zona Romántica real estate market in Puerto Vallarta’s Centro South, including active inventory, closed-sale trends, pricing, seller behavior and bedroom mix. Filter by property type, bedrooms, and resale or pre-construction activity.</p>
          </div>
        </section>
        {error ? <div className={styles.dataError}>{error}</div> : null}
      </section>

      <div className={styles.stickyMarket} aria-label="Current market selection">
        <div className={styles.stickyIdentity}>
          <span>Zona Romántica</span>
          <b>{data?.asOf ? `Data through ${longDate(data.asOf)}` : "Loading market data…"}</b>
        </div>
        <div className={styles.stickyFilters}>
          <Filter 
            label="Property" 
            values={["Condo", "House"]} 
            value={propertyType} 
            setValue={(v) => setPropertyType(v as PropertyType)} 
          />
          <Filter 
            label="Bedrooms" 
            values={["All", "Studio", "1 BR", "2 BR", "3+ BR"]} 
            value={bedrooms} 
            setValue={(v) => setBedrooms(v as Bedrooms)} 
          />
          <Filter 
            label="Market" 
            values={["Both", "Resale", "Pre-sale"]} 
            value={segment} 
            setValue={(v) => setSegment(v as Segment)}
            displayLabels={{ "Pre-sale": "Pre-con" }}
           />
        </div>
      </div>

      <section ref={cockpitRef} className={`${styles.cockpit} ${cockpitVisible ? styles.cockpitVisible : ""}`} aria-label="Market dashboard instruments">
        <div className={styles.cockpitHeading}><span>MARKET DASHBOARD</span><p>Select an instrument for the detailed view.</p></div>
        <div className={styles.cockpitGrid}>
          <a className={`${styles.cockpitCard} ${styles.snapshotCard}`} href="#market-snapshot">
            <MiniHead kicker="WHAT DOES THE MARKET LOOK LIKE NOW?" title="Market Snapshot" />
            <div className={`${styles.stateRow} ${styles.cockpitStateRow} ${loading ? styles.loadingBank : ""}`}>
              <SlotStat value={loading && !data ? null : String(data?.current.active ?? 0)} label="Available" order={0} />
              <SlotStat value={loading && !data ? null : String(data?.current.pending ?? 0)} label="Pending" order={1} />
              <SlotStat value={loading && !data ? null : String(data?.current.sold12m ?? 0)} label="Sold · 12M" order={2} />
              <SlotStat value={loading && !data ? null : money(data?.current.medianSold12m)} label="Median sold · 12M" order={3} />
            </div>
          </a>

          <a className={styles.cockpitCard} href="#price-range">
            <MiniHead kicker="WHAT DOES IT COST?" title="Active Listings by Price Range" />
            <div className={styles.miniPriceBars}>{(data?.priceBands || []).map((row,i)=><i key={row.label} style={{height:`${18+70*row.count/maxBand}%`,animationDelay:`${.12+i*.07}s`}} />)}</div>
          </a>

          <a className={styles.cockpitCard} href="#market-trends">
            <MiniHead kicker="WHERE IS THIS MARKET GOING?" title="Market Trends" />
            <div className={styles.miniTrendBars}>{trendBars.map((row,i)=><span key={`${row.label}-${i}`}><i className={styles.miniPrior} style={{height:`${row.prior===null?0:barHeight(row.prior,barChart?.max||1)}%`}}/><i style={{height:`${row.current===null?0:barHeight(row.current,barChart?.max||1)}%`}}/></span>)}</div>
          </a>

          <a className={styles.cockpitCard} href="#current-inventory">
            <MiniHead kicker="WHAT'S AVAILABLE NOW?" title="Inventory Trend" />
            <div className={styles.miniInventory}><b>{inventoryLast?.active_listing_count ?? "—"}</b><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength={1} d={inventoryPath}/></svg></div>
          </a>

          <a className={styles.cockpitCard} href="#seller-behavior">
            <MiniHead kicker="HOW ARE SELLERS NEGOTIATING?" title="Seller Behavior" />
            <div className={styles.miniSeller}>{seller?.bands.map((row,ri)=><span key={row.label}><span className={styles.miniSellerDots}>{Array.from({length:Math.min(row.count,18)}).map((_,i)=><i key={i} style={{animationDelay:`${.08+(ri*18+i)*.012}s`}}/>)}</span><b>{row.count}</b><em>{row.label}</em></span>)}</div>
          </a>

          <a className={styles.cockpitCard} href="#market-composition">
            <MiniHead kicker="WHAT MAKES UP THE CURRENT MARKET?" title="Market Composition" />
            <div className={styles.miniComposition}>{(data?.composition||[]).slice(0,5).map((row,i)=><div key={row.label}><span>{row.label}</span><i style={{width:`${row.count/maxComposition*100}%`,animationDelay:`${.1+i*.08}s`}}/></div>)}</div>
          </a>
        </div>
        <nav className={styles.mobileInstrumentNav} aria-label="Market instruments">
          <a href="#market-snapshot">Snapshot</a><a href="#price-range">Price</a><a href="#market-trends">Trends</a><a href="#current-inventory">Inventory</a><a href="#seller-behavior">Sellers</a><a href="#market-composition">Mix</a>
        </nav>
      </section>

      <section className={styles.dashboard}>
        <AnimatedArticle id="market-snapshot" className={`${styles.panel} ${styles.wide} ${styles.snapshotDetail}`}>
          <PanelHead kicker="WHAT DOES THE MARKET LOOK LIKE NOW?" title="Market Snapshot" text="For the selected market." />
          <div data-ignition-target className={`${styles.stateRow} ${styles.detailStateRow} ${loading ? styles.loadingBank : ""}`}>
            <SlotStat value={loading && !data ? null : String(data?.current.active ?? 0)} label="Available" order={0} href={availableListingsUrl} />
            <SlotStat value={loading && !data ? null : String(data?.current.pending ?? 0)} label="Pending" order={1} href={pendingListingsUrl} />
            <SlotStat value={loading && !data ? null : String(data?.current.sold12m ?? 0)} label="Sold · 12M" order={2} href={sold12mUrl} />
            <SlotStat value={loading && !data ? null : money(data?.current.medianSold12m)} label="Median sold · 12M" order={3} />
          </div>
        </AnimatedArticle>

        <AnimatedArticle id="price-range" className={`${styles.panel} ${styles.wide}`}>
          <PanelHead kicker="WHAT DOES IT COST?" title="Active Listings by Price Range" text="" />
          <div data-ignition-target className={styles.bands}>
            {(data?.priceBands || []).map((row, index) => {
              const priceRange = priceRangeFromLabel(row.label);

              const href = buildMarketListingUrl("zona-romantica", {
                status: "active",
                propertyType,
                bedrooms,
                segment,
                ...priceRange,
              });

              return (
                <a
                  key={row.label}
                  href={href}
                  className={`${styles.band} ${styles.bandLink}`}
                  aria-label={`View ${row.count} active listings ${row.label}`}
                >
                  <div className={styles.barTrack}>
                    <i
                      style={{
                        height: `${18 + 70 * row.count / maxBand}%`,
                        animationDelay: `${index * 0.08}s`,
                      }}
                    />
                  </div>

                  <b>{row.count}</b>
                  <span>{row.label}</span>
                </a>
              );
            })}
          </div>
          {!loading && data?.priceBands.length === 0 ? <Empty /> : null}
        </AnimatedArticle>

        <AnimatedArticle id="market-trends" className={`${styles.panel} ${styles.wide}`}>
          <PanelHead kicker="WHERE IS THIS MARKET GOING?" title="Market Trends" text="Closed-sale trends over time." />
          <div className={styles.instrumentBlock}>
            <div className={styles.pulseControls}>
              {(["Sold $/m²", "Closed sales", "DOM"] as PulseMetric[]).map((x) => <button key={x} className={pulse === x ? styles.on : ""} onClick={() => setPulse(x)}>{x}</button>)}
              <span />
              {(["12M", "24M", "5Y"] as Period[]).map((x) => <button key={x} className={period === x ? styles.on : ""} onClick={() => setPeriod(x)}>{x}</button>)}
            </div>
            {barChart && data?.asOf ? <>
              <div className={styles.directionSummary}><span>{directionMetricLabel(pulse, period)}</span>{period === "12M" ? <em>Current month through {monthDay(data.asOf)}</em> : period === "24M" ? <em>Latest four quarters compared with the same quarters one year earlier</em> : <em>Five calendar years · {new Date(`${data.asOf}T00:00:00Z`).getUTCFullYear()} YTD through {monthDay(data.asOf)}</em>}</div>
              {period === "12M" ? <div className={styles.yoyLegend}><span><i className={styles.currentSwatch}/>{new Date(`${data.asOf}T00:00:00Z`).getUTCFullYear()}</span><span><i className={styles.priorSwatch}/>{new Date(`${data.asOf}T00:00:00Z`).getUTCFullYear()-1} · same calendar period</span></div> : period === "24M" ? <div className={styles.yoyLegend}><span><i className={styles.currentSwatch}/>Selected quarter</span><span><i className={styles.priorSwatch}/>Same quarter · prior year</span></div> : null}
              {thinSelection ? <div className={styles.sampleNote}>Limited sales history for this selection — monthly results may reflect only a few transactions.</div> : null}
              {fiveYearComparison ? <div className={styles.fiveYearNote}>{fiveYearComparison.currentLabel} is <b>{Math.abs(fiveYearComparison.change).toFixed(1)}% {fiveYearComparison.change >= 0 ? "above" : "below"}</b> {fiveYearComparison.previousLabel}.</div> : null}
              <div data-ignition-target className={styles.barChartGrid}>
                <div className={styles.yAxis}>
                  <span className={styles.yAxisTitle}>
                    {directionMetricLabel(pulse, period)}
                  </span>

                  <div className={styles.yTicks}>
                    {barChart.ticks.map((tick) => (
                      <b key={tick}>{metricFormat(pulse, tick)}</b>
                    ))}
                  </div>
                </div>

                <div
                  className={styles.yoyChart}
                  role="img"
                  aria-label={`${directionMetricLabel(pulse, period)} market activity`}
                >
                  <div className={styles.yoyGrid}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className={styles.yoyGroups}>
                    {trendBars.map((row, index) => {
                      const is12M = period === "12M";
                      const is24M = period === "24M";
                      const is5Y = period === "5Y";

                      const priorSampleSize =
                        (is12M || is24M) && "priorSampleSize" in row
                          ? Number(row.priorSampleSize)
                          : 0;

                      const quarter =
                        is24M
                          ? Number(String(row.label).replace("Q", ""))
                          : null;

                      const priorHref =
                        is12M && priorSampleSize > 0
                          ? buildTrendClosedSalesUrl(
                              propertyType,
                              bedrooms,
                              segment,
                              row.priorYear,
                              index + 1,
                              row.isMtd
                            )
                          : is24M && priorSampleSize > 0 && quarter
                            ? buildQuarterTrendClosedSalesUrl(
                                propertyType,
                                bedrooms,
                                segment,
                                row.priorYear,
                                quarter
                              )
                            : undefined;

                      const currentHref =
                        is12M && row.sampleSize > 0
                          ? buildTrendClosedSalesUrl(
                              propertyType,
                              bedrooms,
                              segment,
                              row.currentYear,
                              index + 1,
                              row.isMtd
                            )
                          : is24M && row.sampleSize > 0 && quarter
                            ? buildQuarterTrendClosedSalesUrl(
                                propertyType,
                                bedrooms,
                                segment,
                                row.currentYear,
                                quarter
                              )
                            : is5Y && row.sampleSize > 0
                              ? buildYearTrendClosedSalesUrl(
                                  propertyType,
                                  bedrooms,
                                  segment,
                                  row.currentYear
                                )
                              : undefined;

                      const priorBar = (
                        <i
                          className={`${styles.yoyBar} ${styles.priorBar}`}
                          style={{
                            height: `${
                              row.prior === null
                                ? 0
                                : barHeight(row.prior, barChart.max)
                            }%`,
                          }}
                        />
                      );

                      const currentBar = (
                        <i
                          className={`${styles.yoyBar} ${styles.currentBar}`}
                          style={{
                            height: `${
                              row.current === null
                                ? 0
                                : barHeight(row.current, barChart.max)
                            }%`,
                          }}
                        />
                      );

                      return (
                        <div
                          className={styles.yoyGroup}
                          key={`${row.label}-${index}`}
                        >
                          <div className={styles.yoyBars}>
                            {is12M && priorSampleSize === 0 ? (
                              <span
                                className={`${styles.zeroValue} ${styles.zeroPrior}`}
                                aria-label={`No closed sales for ${row.label} ${row.priorYear}`}
                              >
                                0
                              </span>
                            ) : priorHref ? (
                              <a
                                href={priorHref}
                                className={styles.trendBarLink}
                                title={`View ${priorSampleSize} closed sales`}
                                aria-label={`View ${priorSampleSize} closed sales for ${row.label} ${row.priorYear}`}
                              >
                                {priorBar}
                              </a>
                            ) : (
                              priorBar
                            )}

                            {is12M && row.sampleSize === 0 ? (
                              <span
                                className={`${styles.zeroValue} ${styles.zeroCurrent}`}
                                aria-label={`No closed sales for ${row.label} ${row.currentYear}`}
                              >
                                0
                              </span>
                            ) : currentHref ? (
                              <a
                                href={currentHref}
                                className={styles.trendBarLink}
                                title={`View ${row.sampleSize} closed sales`}
                                aria-label={`View ${row.sampleSize} closed sales for ${row.label} ${row.currentYear}`}
                              >
                                {currentBar}
                              </a>
                            ) : (
                              currentBar
                            )}
                          </div>

                          <span className={row.isMtd ? styles.mtdLabel : ""}>
                            {row.label}
                            {period === "24M" && "comparisonYears" in row ? (
                              <small>{String(row.comparisonYears)}</small>
                            ) : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </> : <Empty text="Not enough closed-sale history for this selection yet." />}
          </div>
        </AnimatedArticle>

        <AnimatedArticle id="current-inventory" className={`${styles.panel} ${styles.wide}`}>
          <PanelHead kicker="WHAT'S AVAILABLE NOW?" title="Inventory Trend" text="" />
          {inventoryLast ? <div className={styles.inventoryNow}><b>{inventoryLast.active_listing_count}</b><span>available now</span></div> : null}
          {inventoryFirst && inventoryLast && inventoryHistory.length > 1 ? <><div className={styles.inventoryMeta}><span>Observed since {longDate(inventoryFirst.snapshot_date)}</span><em>{inventoryFirst.active_listing_count} at first observation → {inventoryLast.active_listing_count} now</em></div><div data-ignition-target className={styles.inventoryChart} role="img" aria-label={`Active inventory from ${longDate(inventoryFirst.snapshot_date)} through ${longDate(inventoryLast.snapshot_date)}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="18" x2="100" y2="18"/><line x1="0" y1="54" x2="100" y2="54"/><line x1="0" y1="90" x2="100" y2="90"/><path pathLength={1} d={inventoryPath}/>{inventoryHistory.map((row,index)=>{const x=index/(inventoryHistory.length-1)*100;const y=90-((Number(row.active_listing_count)-inventoryMin)/inventoryRange)*72;return <circle key={row.snapshot_date} cx={x} cy={y} r="1.15"><title>{longDate(row.snapshot_date)} · {row.active_listing_count} active</title></circle>})}</svg><div className={styles.inventoryMonths}>{inventoryMonthTicks(inventoryHistory).map((tick)=><span key={tick.key} style={{left:`${tick.left}%`}}>{tick.label}</span>)}</div><div className={styles.inventoryDates}><span>{shortDate(inventoryFirst.snapshot_date)}</span><span>{shortDate(inventoryLast.snapshot_date)}</span></div></div><p className={styles.inventoryFootnote}>Pre-construction inventory can change sharply when developers activate, expire, or renew groups of MLS listings.</p></> : <Empty text="Inventory history is not yet available for this selection." />}
        </AnimatedArticle>

        <AnimatedArticle id="seller-behavior" className={`${styles.panel} ${styles.wide}`}>
          <PanelHead kicker="HOW ARE SELLERS NEGOTIATING?" title="Seller Behavior" text="Compare what buyers paid with the seller’s final asking price or the original asking price before price changes." />
          <div className={styles.sellerToggle}>{(["Final asking", "Original asking"] as const).map((x) => <button key={x} className={askingBasis === x ? styles.on : ""} onClick={() => setAskingBasis(x)}>{x}</button>)}</div>
          {seller && data?.sellerBehavior.sampleSize ? (
            <>
              <div data-ignition-target className={styles.acceptance}>
                {seller.bands.map((row, ri) => {
                  const href = buildSellerBehaviorUrl(
                    propertyType,
                    bedrooms,
                    segment,
                    askingBasis,
                    row.label
                  );

                  const content = (
                    <>
                      <div className={styles.miniDots}>
                        {Array.from({ length: Math.min(row.count, 24) }).map(
                          (_, i) => (
                            <i
                              key={i}
                              style={{
                                animationDelay: `${0.05 + (ri * 24 + i) * 0.012}s`,
                              }}
                            />
                          )
                        )}
                      </div>

                      <b>{row.count}</b>
                      <span>{row.label}</span>
                    </>
                  );

                  return href && row.count > 0 ? (
                    <a
                      key={row.label}
                      href={href}
                      className={styles.sellerBandLink}
                      aria-label={`View ${row.count} closed sales at ${row.label} of ${askingBasis.toLowerCase()} price`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={row.label}>
                      {content}
                    </div>
                  );
                })}
              </div>

              <div className={styles.acceptMedian}>
                <span>Median transaction</span>
                <b>{seller.median ? `${seller.median.toFixed(1)}%` : "—"}</b>
                <span>
                  of {askingBasis.toLowerCase()} price ·{" "}
                  {data.sellerBehavior.sampleSize} sales in trailing 12 months
                </span>
              </div>
            </>
          ) : (
            <Empty text="Not enough closed-sale history for this selection." />
          )}
        </AnimatedArticle>

        <AnimatedArticle id="market-composition" className={`${styles.panel} ${styles.wide}`}>
          <PanelHead kicker="WHAT MAKES UP THE CURRENT MARKET?" title="Market Composition" text="Distribution by bedroom count." />
          <div data-ignition-target className={styles.composition}>{(data?.composition || []).map((row,index) => <div key={row.label}><span>{row.label}</span><div><i style={{ width: `${row.count / maxComposition * 100}%`, animationDelay:`${index*.08}s` }} /></div><b>{row.count} · {compositionTotal ? Math.round(row.count / compositionTotal * 100) : 0}%</b></div>)}</div>
        </AnimatedArticle>
      </section>

      <section className={styles.next}>
        <div><span>FROM MARKET → PROPERTY</span><h2>See the properties behind the numbers.</h2><p>Your current market view is already a property search: <b>Zona Romántica · {propertyType} · {bedrooms === "All" ? "All bedrooms" : bedrooms} · {segment}</b>.</p></div>
        <div className={styles.actions}><Link href={matchingPropertiesUrl}>Search matching properties →</Link><Link href="/atlas?q=Zona%20Romantica">Explore in Atlas →</Link></div>
      </section>

      <section className={styles.cta}><span>SEARCHPV · PUERTO VALLARTA MARKET INTELLIGENCE</span><h2>We built SearchPV to help you understand the market.</h2><p>Let us put that same attention to detail to work for you when you want personal help.</p><Link href="/contact">Ask about this market →</Link></section>

      <footer className={styles.footer}>SearchPV uses periodic MLS extracts rather than a real-time data feed. Market information is deemed reliable but is not guaranteed. <Link href="/data-methodology">Data &amp; Methodology</Link></footer>
    </main>
  );
}

function Filter({
  label,
  values,
  value,
  setValue,
  displayLabels = {},
}: {
  label: string;
  values: string[];
  value: string;
  setValue: (v: string) => void;
  displayLabels?: Record<string, string>;
}) {
  return (
    <div className={styles.filter}>
      <span>{label}</span>
      <div>
        {values.map((v) => (
          <button
            key={v}
            onClick={() => setValue(v)}
            className={v === value ? styles.selected : ""}
          >
            {displayLabels[v] ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}

function SlotStat({ value, label, order, href }: { value: string | null; label: string; order: number; href?: string }) {
  const statRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const hasIgnited = useRef(false);
  const previousValue = useRef<string | null>(null);
  const [settled, setSettled] = useState(false);
  const [swap, setSwap] = useState<{ oldValue: string; newValue: string } | null>(null);

  useEffect(() => {
    const node = statRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (value === null || !inView) return;

    if (!hasIgnited.current) {
      hasIgnited.current = true;
      previousValue.current = value;
      setSettled(false);
      const t = window.setTimeout(() => setSettled(true), 1250 + order * 170);
      return () => window.clearTimeout(t);
    }

    if (previousValue.current !== null && previousValue.current !== value) {
      const oldValue = previousValue.current;
      previousValue.current = value;
      setSettled(true);
      setSwap({ oldValue, newValue: value });
      const t = window.setTimeout(() => setSwap(null), 430);
      return () => window.clearTimeout(t);
    }

    previousValue.current = value;
  }, [inView, order, value]);

  const display = value ?? "";
  const sizeClass = display.length >= 8 ? styles.valueXL : display.length >= 7 ? styles.valueLong : "";

  const content = (
    <>
      <b className={`${styles.slotValue} ${sizeClass} ${settled ? styles.slotSettled : ""}`} aria-label={display || label}>
        {value === null
          ? <span className={styles.slotPlaceholder} aria-hidden="true">&nbsp;</span>
          : swap
            ? <span className={styles.valueSwap} aria-hidden="true">
                <span className={styles.valueSwapOld}>{swap.oldValue}</span>
                <span className={styles.valueSwapNew}>{swap.newValue}</span>
              </span>
            : settled
              ? <span className={styles.finalValue}>{display}</span>
              : Array.from(display).map((ch, i) =>
                  /\d/.test(ch)
                    ? <DigitReel key={`${i}-${ch}`} digit={Number(ch)} delay={order * 170 + i * 28} />
                    : <span key={`${i}-${ch}`} className={styles.slotStatic}>{ch}</span>
                )}
      </b>
      <span className={styles.statLabel}>{label}</span>
    </>
  );

  if (href && value !== null) {
    return (
      <a
        href={href}
        className={`${styles.stat} ${styles.statLink}`}
        aria-label={`View ${display} ${label.toLowerCase()} listings`}
      >
        {content}
      </a>
    );
  }

  return <div ref={statRef} className={styles.stat}>{content}</div>;
}

function DigitReel({ digit, delay }: { digit: number; delay: number }) {
  const [running, setRunning] = useState(false);
  const chars = Array.from({ length: 30 }, (_, i) => i % 10);
  const target = 20 + digit;

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setRunning(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <span className={styles.reel}>
      <span
        className={styles.reelStrip}
        style={{
          transform: running ? `translate3d(0,-${target}em,0)` : "translate3d(0,0,0)",
          transitionDelay: running ? `${delay}ms` : "0ms",
        }}
      >
        {chars.map((n, i) => <i key={i}>{n}</i>)}
      </span>
    </span>
  );
}

function MiniHead({ kicker, title }: { kicker: string; title: string }) {
  return <header className={styles.miniHead}><span>{kicker}</span><h2>{title}</h2></header>;
}

function AnimatedArticle({ id, className, children }: { id: string; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const target = node.querySelector<HTMLElement>("[data-ignition-target]") ?? node;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.22 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <article ref={ref} id={id} className={`${className} ${styles.animatedInstrument} ${visible ? styles.instrumentVisible : ""}`}>{children}</article>;
}

function PanelHead({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return <header className={styles.panelHead}><span>{kicker}</span><h2>{title}</h2>{text ? <p>{text}</p> : null}</header>;
}

function Empty({ text = "No listings match this selection." }: { text?: string }) {
  return <div className={styles.emptyState}>{text}</div>;
}

function money(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1_000_000) {
    const k = n / 1000;
    return `$${(k >= 100 ? k.toFixed(1) : k.toFixed(0)).replace(/\.0$/, "")}K`;
  }
  const m = n / 1_000_000;
  return `$${m.toFixed(m < 10 ? 2 : 1).replace(/\.0+$|(?<=\.[0-9])0$/, "")}M`;
}


function parsePropertyParam(value: string | null): PropertyType {
  return value === "House" ? "House" : "Condo";
}
function parseBedroomParam(value: string | null): Bedrooms {
  return value === "Studio" || value === "1 BR" || value === "2 BR" || value === "3+ BR" ? value : "All";
}
function parseSegmentParam(value: string | null): Segment {
  return value === "Resale" || value === "Pre-sale" ? value : "Both";
}
function buildDashboardStateUrl(propertyType: PropertyType, bedrooms: Bedrooms, segment: Segment) {
  const params = new URLSearchParams({ property: propertyType, bedrooms, segment });
  return `/market/zona-romantica?${params.toString()}`;
}
function buildMatchingPropertiesUrl(propertyType: PropertyType, bedrooms: Bedrooms, segment: Segment, returnUrl: string) {
  const params = new URLSearchParams({
    propertyType: propertyType === "Condo" ? "condos" : "houses",
    zone: "Puerto Vallarta",
    area: "Centro South",
    community: "Emiliano Zapata",
    return: returnUrl,
  });
  if (bedrooms === "Studio") { params.set("minBeds", "0"); params.set("maxBeds", "0"); }
  if (bedrooms === "1 BR") { params.set("minBeds", "1"); params.set("maxBeds", "1"); }
  if (bedrooms === "2 BR") { params.set("minBeds", "2"); params.set("maxBeds", "2"); }
  if (bedrooms === "3+ BR") { params.set("minBeds", "3"); }
  if (segment === "Resale") params.set("market", "resale");
  if (segment === "Pre-sale") params.set("market", "pre_construction");
  return `/search-properties?${params.toString()}#selected-market`;
}
function inventoryMonthTicks(rows: MarketData["history"]["active"]) {
  if (!rows.length) return [];
  const firstTime = new Date(`${rows[0].snapshot_date}T00:00:00Z`).getTime();
  const lastTime = new Date(`${rows[rows.length - 1].snapshot_date}T00:00:00Z`).getTime();
  const span = Math.max(lastTime - firstTime, 1);
  const first = new Date(firstTime);
  const last = new Date(lastTime);
  const ticks: { key: string; label: string; left: number }[] = [];
  let cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
  while (cursor.getTime() < lastTime) {
    const time = cursor.getTime();
    ticks.push({
      key: cursor.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(cursor),
      left: ((time - firstTime) / span) * 100,
    });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return ticks;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function metricLabel(metric: PulseMetric) {
  return metric === "Sold $/m²" ? "Median sold USD / m²" : metric === "Closed sales" ? "Closed sales / month" : "Median days on market";
}
function metricFormat(metric: PulseMetric, value: number) {
  return metric === "Sold $/m²" ? `$${Math.round(value).toLocaleString()}` : Math.round(value).toLocaleString();
}
function buildBarChart(rows: { current: number | null; prior: number | null }[]) {
  const values = rows.flatMap((r) => [r.current, r.prior]).filter((v): v is number => v !== null && Number.isFinite(Number(v))).map(Number);
  if (!values.length) return null;
  const maxValue = Math.max(...values);
  const max = maxValue <= 0 ? 1 : maxValue * 1.12;
  const ticks = Array.from({ length: 5 }, (_, i) => max - i * (max / 4));
  return { max, ticks };
}

function barHeight(value: number, max: number) {
  return Math.max(2, Math.min(100, (Number(value) / Math.max(max, 1)) * 100));
}

function monthShort(monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(2026, monthIndex, 1)));
}

function aggregateMetricValue(
  row: { soldPricePerSqm: number | null; closedSales: number; dom: number | null } | undefined,
  pulse: PulseMetric
) {
  if (!row) return null;
  const raw = pulse === "Sold $/m²" ? row.soldPricePerSqm : pulse === "Closed sales" ? row.closedSales : row.dom;
  const value = raw === null || raw === undefined ? null : Number(raw);
  return value !== null && Number.isFinite(value) ? value : null;
}

function directionMetricLabel(pulse: PulseMetric, period: Period) {
  if (pulse === "Closed sales") {
    if (period === "24M") return "Closed sales / quarter";
    if (period === "5Y") return "Closed sales / year";
    return "Closed sales / month";
  }
  return metricLabel(pulse);
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function monthNameFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function monthName(value: string) {
  const [year, month] = value.slice(0, 7).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function monthDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function priceRangeFromLabel(label: string): {
  minPrice?: number;
  maxPrice?: number;
} {
  switch (label) {
    case "<$400K":
      return { maxPrice: 399999.99 };

    case "$400–600K":
      return { minPrice: 400000, maxPrice: 599999.99 };

    case "$600–800K":
      return { minPrice: 600000, maxPrice: 799999.99 };

    case "$800K–1M":
      return { minPrice: 800000, maxPrice: 999999.99 };

    case "$1M+":
      return { minPrice: 1000000 };

    default:
      return {};
  }
}

function sellerBandKey(label: string) {
  switch (label) {
    case "<90%":
      return "under90";
    case "90–94%":
      return "90to94";
    case "95–99%":
      return "95to99";
    case "100%+":
      return "100plus";
    default:
      return null;
  }
}

function buildSellerBehaviorUrl(
  propertyType: PropertyType,
  bedrooms: Bedrooms,
  segment: Segment,
  askingBasis: "Final asking" | "Original asking",
  label: string
) {
  const band = sellerBandKey(label);

  if (!band) return undefined;

  const params = new URLSearchParams({
    market: "zona-romantica",
    property: propertyType,
    bedrooms,
    segment,
    basis: askingBasis === "Final asking" ? "final" : "original",
    band,
  });

  return `/api/market-closed-sales?${params.toString()}`;
}

function buildTrendClosedSalesUrl(
  propertyType: PropertyType,
  bedrooms: Bedrooms,
  segment: Segment,
  year: number,
  month: number,
  mtd: boolean
) {
  const params = new URLSearchParams({
    mode: "trend",
    market: "zona-romantica",
    property: propertyType,
    bedrooms,
    segment,
    year: String(year),
    month: String(month),
    mtd: mtd ? "1" : "0",
  });

  return `/api/market-closed-sales?${params.toString()}`;
}

function buildQuarterTrendClosedSalesUrl(
  propertyType: PropertyType,
  bedrooms: Bedrooms,
  segment: Segment,
  year: number,
  quarter: number
) {
  const params = new URLSearchParams({
    mode: "trend",
    market: "zona-romantica",
    property: propertyType,
    bedrooms,
    segment,
    year: String(year),
    quarter: String(quarter),
  });

  return `/api/market-closed-sales?${params.toString()}`;
}

function buildYearTrendClosedSalesUrl(
  propertyType: PropertyType,
  bedrooms: Bedrooms,
  segment: Segment,
  year: number
) {
  const params = new URLSearchParams({
    mode: "trend",
    market: "zona-romantica",
    property: propertyType,
    bedrooms,
    segment,
    year: String(year),
    ytd: "1",
  });

  return `/api/market-closed-sales?${params.toString()}`;
}

function buildSnapshotSold12mUrl(
  propertyType: PropertyType,
  bedrooms: Bedrooms,
  segment: Segment
) {
  const params = new URLSearchParams({
    mode: "snapshot",
    market: "zona-romantica",
    property: propertyType,
    bedrooms,
    segment,
  });

  return `/api/market-closed-sales?${params.toString()}`;
}