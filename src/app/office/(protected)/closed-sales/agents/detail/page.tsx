import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import { createClient } from "@/lib/supabase/server";

import AgentDetailExportButtons from "./AgentDetailExportButtons";

import {
  buildReportHref,
  formatDateLong,
  formatDateShort,
  formatMoney,
  formatNumber,
  getMarketSegment,
  getPropertyTypeSegment,
  getRangeKey,
  getSortDir,
  getSortKey,
  resolveDateRange,
  toRpcMarketType,
  toRpcPropertyType,
} from "../agent-report-utils";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export const dynamic = "force-dynamic";

export type AgentDetailRow = {
  clsd_sale_ky: number;
  lstng_nb: string | null;
  sold_dt: string | null;

  zone_nm: string | null;
  area_nm: string | null;
  community_nm: string | null;
  development_nm: string | null;

  prprty_type_cd: string | null;
  market_type_nm: string | null;

  sold_price_usd: number | null;
  dom_nb: number | null;

  sold_to_list_pc: number | null;
  sold_vs_list_pc: number | null;

  participation_nm:
    | "Listing Side"
    | "Selling Side"
    | "Both Sides"
    | string
    | null;

  listing_agent_nm: string | null;
  listing_agency_nm: string | null;

  selling_agent_nm: string | null;
  selling_agency_nm: string | null;
};

type PageSearchParams = {
  agent?: string;
  agency?: string;

  market?: string;
  propertyType?: string;

  zone?: string;
  area?: string;
  community?: string;
  development?: string;

  range?: string;
  startDate?: string;
  endDate?: string;

  sort?: string;
  dir?: string;
};

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const queryParams = await searchParams;
  const agentName = queryParams.agent?.trim() || "Agent";

  return {
    title: `${agentName} Closed Sales | SearchPV`,
    description: `Closed-sale transactions represented by ${agentName}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AgentClosedSalesDetailPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const queryParams = await searchParams;

  const agentName = queryParams.agent?.trim() ?? "";
  const agencyName = queryParams.agency?.trim() ?? "";

  const selectedMarket = getMarketSegment(queryParams.market);
  const selectedPropertyType = getPropertyTypeSegment(
    queryParams.propertyType,
  );

  const selectedZone =
    queryParams.zone ?? DEFAULT_ZONE_NAME;

  const selectedArea =
    queryParams.area ?? "all";

  const selectedCommunity =
    queryParams.community ?? "all";

  const selectedDevelopment =
    queryParams.development ?? "all";

  const selectedRange = getRangeKey(queryParams.range);
  const selectedSort = getSortKey(queryParams.sort);
  const selectedDir = getSortDir(queryParams.dir);

  const {
    startDate: selectedStartDate,
    endDate: selectedEndDate,
  } = resolveDateRange(
    selectedRange,
    queryParams.startDate,
    queryParams.endDate,
  );

  const backHref = buildReportHref({
    market: selectedMarket,
    propertyType: selectedPropertyType,

    zone: selectedZone,
    area: selectedArea,
    community: selectedCommunity,
    development: selectedDevelopment,

    range: selectedRange,
    startDate: selectedStartDate,
    endDate: selectedEndDate,

    sort: selectedSort,
    dir: selectedDir,
  });

  if (!agentName || !agencyName) {
    return (
      <ErrorPage
        title="Agent detail unavailable"
        message="The agent name or agency name is missing from the link."
        backHref={backHref}
      />
    );
  }

  const { data, error } = await supabase.rpc(
    "closed_sales_agent_detail",
    {
      p_agent_nm: agentName,
      p_agency_nm: agencyName,

      p_start_date: selectedStartDate || null,
      p_end_date: selectedEndDate || null,

      p_zone_nm:
        selectedZone === "all"
          ? null
          : selectedZone,

      p_area_nm:
        selectedArea === "all"
          ? null
          : selectedArea,

      p_community_nm:
        selectedCommunity === "all"
          ? null
          : selectedCommunity,

      p_development_nm:
        selectedDevelopment === "all"
          ? null
          : selectedDevelopment,

      p_property_type_cd:
        toRpcPropertyType(selectedPropertyType),

      p_market_type_nm:
        toRpcMarketType(selectedMarket),
    },
  );

  if (error) {
    return (
      <ErrorPage
        title="Error loading agent sales"
        message={error.message}
        backHref={backHref}
      />
    );
  }

  const rows = (data ?? []) as AgentDetailRow[];
  const summary = buildSummary(rows);
  
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Header />

            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Office Analytics
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {agentName}
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            {agencyName}
          </p>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Individual closed transactions represented by this
            agent under the filters selected on the agent ranking
            report.
          </p>

          <div className="mt-6">
            <Link
              href={backHref}
              className="inline-flex rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-white hover:border-sky-300 hover:text-sky-200"
            >
              ← Back to Agent Ranking
            </Link>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-700 px-4 py-3">
        <div className="mx-auto max-w-7xl text-center text-sm font-bold text-white">
          <div className="truncate">
            <Link
              href="/"
              className="underline hover:text-sky-200"
            >
              SearchPV
            </Link>

            {" > "}

            <Link
              href="/office"
              className="underline hover:text-sky-200"
            >
              Office
            </Link>

            {" > "}

            <Link
              href={backHref}
              className="underline hover:text-sky-200"
            >
              Closed Sales by Agent
            </Link>

            {" > "}

            <span>{agentName}</span>
          </div>

          <div className="mt-1 text-xs font-semibold text-slate-200">
            {formatSelectedFilters({
              selectedMarket,
              selectedPropertyType,
              selectedZone,
              selectedArea,
              selectedCommunity,
              selectedDevelopment,
              selectedStartDate,
              selectedEndDate,
            })}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-6 rounded-xl bg-white p-5 shadow">
          <p className="text-sm font-semibold text-slate-500">
            Showing Closed Sales From
          </p>

          <p className="mt-1 text-lg font-bold">
            {formatDateLong(selectedStartDate) || "All Time"}
            {" through "}
            {formatDateLong(selectedEndDate) || "Today"}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap justify-end gap-3">
          <AgentDetailExportButtons
            agentName={agentName}
            agencyName={agencyName}
            rows={rows}
            summary={summary}
            selectedMarket={selectedMarket}
            selectedPropertyType={selectedPropertyType}
            selectedZone={selectedZone}
            selectedArea={selectedArea}
            selectedCommunity={selectedCommunity}
            selectedDevelopment={selectedDevelopment}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
        </div>

        <KpiGrid summary={summary} />

        <div className="mt-8">
          <h2 className="text-2xl font-bold">
            Closed-Sale Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {rows.length.toLocaleString()} transactions match the
            selected agent, agency, and market filters.
          </p>

          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white p-8 text-center shadow">
              <p className="font-semibold">
                No closed sales matched these filters.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Return to the agent ranking and select a broader
                date range or market.
              </p>
            </div>
          ) : (
            <div className="mt-3 max-h-[72vh] overflow-auto rounded-xl bg-white shadow">
              <table className="min-w-[1700px] border-separate border-spacing-0 text-sm">
                <thead className="text-slate-700">
                  <tr>
                    <Th stickyLeft>MLS</Th>
                    <Th>Sold Date</Th>
                    <Th>Participation</Th>
                    <Th>Development</Th>
                    <Th>Community</Th>
                    <Th>Area</Th>
                    <Th>Property Type</Th>
                    <Th>Market</Th>
                    <Th numeric>Sold Price</Th>
                    <Th numeric>DOM</Th>
                    <Th numeric>Sold/List</Th>
                    <Th numeric>Above/Below List</Th>
                    <Th>Listing Agent</Th>
                    <Th>Listing Agency</Th>
                    <Th>Selling Agent</Th>
                    <Th>Selling Agency</Th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.clsd_sale_ky}>
                      <Td stickyLeft>
                        <span className="font-semibold text-slate-950">
                          {row.lstng_nb || "—"}
                        </span>
                      </Td>

                      <Td>
                        {row.sold_dt
                          ? formatDateShort(row.sold_dt)
                          : "—"}
                      </Td>

                      <Td>
                        <ParticipationBadge
                          participation={
                            row.participation_nm
                          }
                        />
                      </Td>

                      <Td>
                        {row.development_nm || "—"}
                      </Td>

                      <Td>
                        {row.community_nm || "—"}
                      </Td>

                      <Td>
                        {row.area_nm || "—"}
                      </Td>

                      <Td>
                        {row.prprty_type_cd || "—"}
                      </Td>

                      <Td>
                        {formatMarketType(
                          row.market_type_nm,
                        )}
                      </Td>

                      <Td numeric>
                        {formatMoney(
                          row.sold_price_usd,
                        )}
                      </Td>

                      <Td numeric>
                        {formatNumber(
                          row.dom_nb,
                        )}
                      </Td>

                      <Td numeric>
                        {formatRatioPercent(
                          row.sold_to_list_pc,
                        )}
                      </Td>

                      <Td numeric>
                        <VarianceValue
                          value={row.sold_vs_list_pc}
                        />
                      </Td>

                      <Td>
                        {row.listing_agent_nm || "—"}
                      </Td>

                      <Td>
                        {row.listing_agency_nm || "—"}
                      </Td>

                      <Td>
                        {row.selling_agent_nm || "—"}
                      </Td>

                      <Td>
                        {row.selling_agency_nm || "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function KpiGrid({
  summary,
}: {
  summary: AgentDetailSummary;
}) {
  const cards = [
    {
      label: "Transactions",
      value: formatNumber(summary.closedTransactions),
      note: "Each property counted once",
    },
    {
      label: "Transaction Volume",
      value: formatMoney(summary.transactionVolume),
      note: "Each property counted once",
    },
    {
      label: "Listing Sides",
      value: formatNumber(summary.listingSides),
      note: formatMoney(summary.listingVolume),
    },
    {
      label: "Selling Sides",
      value: formatNumber(summary.sellingSides),
      note: formatMoney(summary.sellingVolume),
    },
    {
      label: "Both Sides",
      value: formatNumber(summary.bothSides),
      note: `${formatWholePercent(
        summary.bothSidesPercent,
      )} of transactions`,
    },
    {
      label: "Total Sides",
      value: formatNumber(summary.totalSides),
      note: `${formatWholePercent(
        summary.sideCapturePercent,
      )} capture rate`,
    },
    {
      label: "Total Side Volume",
      value: formatMoney(summary.totalSideVolume),
      note: "Listing + selling volume",
    },
    {
      label: "Median Sold Price",
      value: formatMoney(summary.medianSoldPrice),
      note: `Average ${formatMoney(
        summary.averageSoldPrice,
      )}`,
    },
    {
      label: "Median DOM",
      value: formatNumber(summary.medianDom, 1),
      note: `Average ${formatNumber(
        summary.averageDom,
        1,
      )}`,
    },
    {
      label: "Median Sold/List",
      value: formatRatioPercent(
        summary.medianSoldToList,
      ),
      note: `Average ${formatRatioPercent(
        summary.averageSoldToList,
      )}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-white p-4 shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {card.label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {card.value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {card.note}
          </p>
        </div>
      ))}
    </div>
  );
}

function ParticipationBadge({
  participation,
}: {
  participation: string | null;
}) {
  const className =
    participation === "Both Sides"
      ? "bg-violet-100 text-violet-800"
      : participation === "Listing Side"
        ? "bg-sky-100 text-sky-800"
        : participation === "Selling Side"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {participation || "—"}
    </span>
  );
}

function VarianceValue({
  value,
}: {
  value: number | null;
}) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null) {
    return <>—</>;
  }

  const className =
    numericValue > 0
      ? "font-semibold text-emerald-700"
      : numericValue < 0
        ? "font-semibold text-red-700"
        : "font-semibold text-slate-700";

  return (
    <span className={className}>
      {numericValue > 0 ? "+" : ""}
      {numericValue.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
      %
    </span>
  );
}

function Th({
  children,
  stickyLeft = false,
  numeric = false,
}: {
  children: React.ReactNode;
  stickyLeft?: boolean;
  numeric?: boolean;
}) {
  return (
    <th
      className={[
        "sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 font-semibold",
        numeric ? "text-right" : "text-left",
        stickyLeft
          ? "left-0 z-30 shadow-[2px_0_0_#e2e8f0]"
          : "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  stickyLeft = false,
  numeric = false,
}: {
  children: React.ReactNode;
  stickyLeft?: boolean;
  numeric?: boolean;
}) {
  return (
    <td
      className={[
        "whitespace-nowrap border-t border-slate-100 px-4 py-3",
        numeric ? "text-right tabular-nums" : "text-left",
        stickyLeft
          ? "sticky left-0 z-10 bg-white shadow-[2px_0_0_#e2e8f0]"
          : "bg-white",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function ErrorPage({
  title,
  message,
  backHref,
}: {
  title: string;
  message: string;
  backHref: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        <p className="mt-4 text-red-700">
          {message}
        </p>

        <Link
          href={backHref}
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          ← Back to Agent Ranking
        </Link>
      </div>
    </main>
  );
}

export type AgentDetailSummary = {
  closedTransactions: number;
  transactionVolume: number;

  listingSides: number;
  listingVolume: number;

  sellingSides: number;
  sellingVolume: number;

  bothSides: number;

  totalSides: number;
  totalSideVolume: number;

  sideCapturePercent: number;
  bothSidesPercent: number;

  averageSoldPrice: number | null;
  medianSoldPrice: number | null;

  averageDom: number | null;
  medianDom: number | null;

  averageSoldToList: number | null;
  medianSoldToList: number | null;
};

function buildSummary(
  rows: AgentDetailRow[],
): AgentDetailSummary {
  const soldPrices = rows
    .map((row) => toFiniteNumber(row.sold_price_usd))
    .filter((value): value is number => value !== null);

  const domValues = rows
    .map((row) => toFiniteNumber(row.dom_nb))
    .filter((value): value is number => value !== null);

  const soldToListValues = rows
    .map((row) =>
      toFiniteNumber(row.sold_to_list_pc),
    )
    .filter((value): value is number => value !== null);

  const listingRows = rows.filter(
    (row) =>
      row.participation_nm === "Listing Side" ||
      row.participation_nm === "Both Sides",
  );

  const sellingRows = rows.filter(
    (row) =>
      row.participation_nm === "Selling Side" ||
      row.participation_nm === "Both Sides",
  );

  const bothSideRows = rows.filter(
    (row) => row.participation_nm === "Both Sides",
  );

  const closedTransactions = rows.length;
  const listingSides = listingRows.length;
  const sellingSides = sellingRows.length;
  const bothSides = bothSideRows.length;

  const transactionVolume = sumRows(rows);
  const listingVolume = sumRows(listingRows);
  const sellingVolume = sumRows(sellingRows);

  const totalSides =
    listingSides + sellingSides;

  const totalSideVolume =
    listingVolume + sellingVolume;

  return {
    closedTransactions,
    transactionVolume,

    listingSides,
    listingVolume,

    sellingSides,
    sellingVolume,

    bothSides,

    totalSides,
    totalSideVolume,

    sideCapturePercent:
      closedTransactions > 0
        ? (totalSides /
            (closedTransactions * 2)) *
          100
        : 0,

    bothSidesPercent:
      closedTransactions > 0
        ? (bothSides / closedTransactions) * 100
        : 0,

    averageSoldPrice: average(soldPrices),
    medianSoldPrice: median(soldPrices),

    averageDom: average(domValues),
    medianDom: median(domValues),

    averageSoldToList:
      average(soldToListValues),

    medianSoldToList:
      median(soldToListValues),
  };
}

function sumRows(rows: AgentDetailRow[]) {
  return rows.reduce((total, row) => {
    return (
      total +
      (toFiniteNumber(row.sold_price_usd) ?? 0)
    );
  }, 0);
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length
  );
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort(
    (left, right) => left - right,
  );

  const middleIndex = Math.floor(
    sorted.length / 2,
  );

  if (sorted.length % 2 === 1) {
    return sorted[middleIndex];
  }

  return (
    (sorted[middleIndex - 1] +
      sorted[middleIndex]) /
    2
  );
}

function formatRatioPercent(
  value: number | null | undefined,
) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function formatWholePercent(
  value: number | null | undefined,
) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null) {
    return "—";
  }

  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function formatMarketType(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  if (value === "PRE-CONSTRUCTION") {
    return "Pre-Construction";
  }

  if (value === "RESALE") {
    return "Resale";
  }

  return value;
}

function formatSelectedFilters({
  selectedMarket,
  selectedPropertyType,
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
  selectedStartDate,
  selectedEndDate,
}: {
  selectedMarket: string;
  selectedPropertyType: string;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
  selectedStartDate: string;
  selectedEndDate: string;
}) {
  const geography = [
    selectedZone !== "all"
      ? selectedZone
      : null,

    selectedArea !== "all"
      ? selectedArea
      : null,

    selectedCommunity !== "all"
      ? selectedCommunity
      : null,

    selectedDevelopment !== "all"
      ? selectedDevelopment
      : null,
  ]
    .filter(Boolean)
    .join(" > ");

  const market =
    selectedMarket === "pre_construction"
      ? "Pre-Construction"
      : selectedMarket === "resale"
        ? "Resale"
        : "All Markets";

  const propertyType =
    selectedPropertyType === "condos"
      ? "Condos"
      : selectedPropertyType === "houses"
        ? "Houses"
        : "All Property Types";

  const dateRange =
    selectedStartDate || selectedEndDate
      ? `${formatDateLong(selectedStartDate) || "Beginning"} through ${
          formatDateLong(selectedEndDate) || "Today"
        }`
      : "All Time";

  return [
    market,
    propertyType,
    geography || "All Locations",
    dateRange,
  ].join(" • ");
}

function toFiniteNumber(
  value: number | string | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}

