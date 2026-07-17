import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";

import type { SupabaseClient } from "@supabase/supabase-js";

import AgentClosedSalesFilters from "./AgentClosedSalesFilters";
import {
  buildReportHref,
  formatDateLong,
  formatDateShort,
  formatMoney,
  formatNumber,
  formatPercent,
  getMarketSegment,
  getPropertyTypeSegment,
  getRangeKey,
  getSortDir,
  getSortKey,
  resolveDateRange,
  sortRows,
  toRpcMarketType,
  toRpcPropertyType,
  type AgentReportRow,
  type AgentReportSummary,
  type AgentSortKey,
  type SortDir,
} from "./agent-report-utils";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export const dynamic = "force-dynamic";

export default async function ClosedSalesByAgentPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const selectedMarket = getMarketSegment(params.market);
  const selectedPropertyType = getPropertyTypeSegment(
    params.propertyType,
  );
  const selectedZone =
    params.zone ?? DEFAULT_ZONE_NAME;
  const selectedArea =
    params.area ?? "all";
  const selectedCommunity =
    params.community ?? "all";
  const selectedDevelopment =
    params.development ?? "all";
  const selectedRange =
    getRangeKey(params.range);
  const selectedSort =
    getSortKey(params.sort);
  const selectedDir =
    getSortDir(params.dir);

  const {
    startDate: selectedStartDate,
    endDate: selectedEndDate,
  } = resolveDateRange(
    selectedRange,
    params.startDate,
    params.endDate,
  );

function buildAgentDetailHref(row: AgentReportRow) {
  const detailParams = new URLSearchParams({
    agent: row.agent_nm,
    agency: row.agency_nm ?? "",

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

  return `/office/closed-sales/agents/detail?${detailParams.toString()}`;
}

  const rpcParams = {
    p_start_date:
      selectedStartDate || null,
    p_end_date:
      selectedEndDate || null,
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
      toRpcPropertyType(
        selectedPropertyType,
      ),
    p_market_type_nm:
      toRpcMarketType(selectedMarket),
  };

  const [
    agentResponse,
    summaryResponse,
    optionResponse,
  ] = await Promise.all([
    supabase.rpc(
      "closed_sales_by_agent",
      rpcParams,
    ),
    supabase.rpc(
      "closed_sales_agent_report_summary",
      rpcParams,
    ),
    loadFilterOptions({
      supabase,
      selectedMarket,
      selectedPropertyType,
      selectedStartDate,
      selectedEndDate,
    }),
  ]);

  const error =
    agentResponse.error ||
    summaryResponse.error ||
    optionResponse.error;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold">
          Closed Sales by Agent
        </h1>

        <p className="mt-4 text-red-600">
          Error loading the agent report.
        </p>

        <pre className="mt-4 whitespace-pre-wrap text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const rows = sortRows(
    (agentResponse.data ??
      []) as AgentReportRow[],
    selectedSort,
    selectedDir,
  );

  const summary =
    (((summaryResponse.data ??
      [])[0] as
      | AgentReportSummary
      | undefined) ?? null);

  const optionRows =
    optionResponse.rows;

  const zones = uniqueSorted(
    optionRows.map(
      (row) => row.zone_name,
    ),
  );

  const areas = uniqueSorted(
    optionRows
      .filter(
        (row) =>
          selectedZone === "all" ||
          row.zone_name ===
            selectedZone,
      )
      .map(
        (row) => row.area_name,
      ),
  );

  const communities =
    selectedArea === "all"
      ? []
      : uniqueSorted(
          optionRows
            .filter(
              (row) =>
                selectedZone ===
                  "all" ||
                row.zone_name ===
                  selectedZone,
            )
            .filter(
              (row) =>
                row.area_name ===
                selectedArea,
            )
            .map(
              (row) =>
                row.community_name,
            ),
        );

  const developments =
    selectedCommunity === "all"
      ? []
      : uniqueSorted(
          optionRows
            .filter(
              (row) =>
                selectedZone ===
                  "all" ||
                row.zone_name ===
                  selectedZone,
            )
            .filter(
              (row) =>
                selectedArea ===
                  "all" ||
                row.area_name ===
                  selectedArea,
            )
            .filter(
              (row) =>
                row.community_name ===
                selectedCommunity,
            )
            .map(
              (row) =>
                row.development_name,
            ),
        );

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
            Closed Sales by Agent
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Compare agent transaction
            volume with listing-side,
            selling-side, both-sides, and
            total side production.
          </p>

          <AgentClosedSalesFilters
            selectedMarket={
              selectedMarket
            }
            selectedPropertyType={
              selectedPropertyType
            }
            selectedZone={
              selectedZone
            }
            selectedArea={
              selectedArea
            }
            selectedCommunity={
              selectedCommunity
            }
            selectedDevelopment={
              selectedDevelopment
            }
            selectedRange={
              selectedRange
            }
            selectedStartDate={
              selectedStartDate
            }
            selectedEndDate={
              selectedEndDate
            }
            selectedSort={
              selectedSort
            }
            selectedDir={
              selectedDir
            }
            zones={zones}
            areas={areas}
            communities={
              communities
            }
            developments={
              developments
            }
          />
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

            <span>
              Closed Sales by Agent
            </span>
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
            {formatDateLong(
              selectedStartDate,
            ) || "All Time"}{" "}
            through{" "}
            {formatDateLong(
              selectedEndDate,
            ) || "Today"}
          </p>
        </div>

        <KpiGrid summary={summary} />

        <div className="mt-8">
          <h2 className="text-2xl font-bold">
            Agent Ranking
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {rows.length.toLocaleString()}{" "}
            agent records match the
            selected filters. Click a
            column heading to sort.
          </p>

          <div className="mt-3 max-h-[72vh] overflow-auto rounded-xl bg-white shadow">
            <table className="min-w-[1950px] border-separate border-spacing-0 text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <Th>Rank</Th>

                  <SortableTh
                    label="Agent"
                    sortKey="agent_nm"
                    stickyLeft
                  />

                  <SortableTh
                    label="Agency"
                    sortKey="agency_nm"
                  />

                  <SortableTh
                    label="Transactions"
                    sortKey="closed_transactions"
                  />

                  <SortableTh
                    label="Transaction Volume"
                    sortKey="transaction_volume_usd"
                  />

                  <SortableTh
                    label="List Sides"
                    sortKey="listing_sides"
                  />

                  <SortableTh
                    label="List Volume"
                    sortKey="listing_volume_usd"
                  />

                  <SortableTh
                    label="Sell Sides"
                    sortKey="selling_sides"
                  />

                  <SortableTh
                    label="Sell Volume"
                    sortKey="selling_volume_usd"
                  />

                  <SortableTh
                    label="Both Sides"
                    sortKey="both_sides"
                  />

                  <SortableTh
                    label="Total Sides"
                    sortKey="total_sides"
                  />

                  <SortableTh
                    label="Side Volume"
                    sortKey="total_side_volume_usd"
                  />

                  <SortableTh
                    label="Capture %"
                    sortKey="side_capture_pc"
                  />

                  <SortableTh
                    label="Both-Sides %"
                    sortKey="both_sides_pc"
                  />

                  <SortableTh
                    label="Median Sold"
                    sortKey="median_sold_price_usd"
                  />

                  <SortableTh
                    label="Median DOM"
                    sortKey="median_dom"
                  />

                  <SortableTh
                    label="Median Sold/List"
                    sortKey="median_sold_to_list_pc"
                  />
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (row, index) => (
                    <tr
                      key={`${row.agent_nm}::${row.agency_nm ?? ""}`}
                    >
                      <Td>
                        {index + 1}
                      </Td>

                      <Td stickyLeft>
                        <Link
                          href={buildAgentDetailHref(row)}
                          className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                        >
                          {row.agent_nm}
                        </Link>
                      </Td>

                      <Td>
                        {row.agency_nm ||
                          "—"}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.closed_transactions,
                        )}
                      </Td>

                      <Td>
                        {formatMoney(
                          row.transaction_volume_usd,
                        )}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.listing_sides,
                        )}
                      </Td>

                      <Td>
                        {formatMoney(
                          row.listing_volume_usd,
                        )}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.selling_sides,
                        )}
                      </Td>

                      <Td>
                        {formatMoney(
                          row.selling_volume_usd,
                        )}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.both_sides,
                        )}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.total_sides,
                        )}
                      </Td>

                      <Td>
                        {formatMoney(
                          row.total_side_volume_usd,
                        )}
                      </Td>

                      <Td>
                        {formatPercent(
                          row.side_capture_pc,
                        )}
                      </Td>

                      <Td>
                        {formatPercent(
                          row.both_sides_pc,
                        )}
                      </Td>

                      <Td>
                        {formatMoney(
                          row.median_sold_price_usd,
                        )}
                      </Td>

                      <Td>
                        {formatNumber(
                          row.median_dom,
                          1,
                        )}
                      </Td>

                      <Td>
                        {formatPercent(
                          row.median_sold_to_list_pc,
                        )}
                      </Td>
                    </tr>
                  ),
                )}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={17}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No agent results
                      match the selected
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p className="font-bold text-slate-900">
            How agent participation is
            counted
          </p>

          <p className="mt-2 leading-6">
            Transaction volume counts
            each property once for each
            participating agent. Total
            side volume counts the sold
            price once for every listing
            or selling side represented
            by that agent. Listing and
            selling co-agents receive
            participation credit for
            their respective sides.
          </p>

          <p className="mt-2 leading-6">
            When the same agent
            represents both sides of a
            transaction, the property
            contributes once to
            transaction volume and twice
            to total side volume.
          </p>
        </div>
      </section>
    </main>
  );

  function SortableTh({
    label,
    sortKey,
    stickyLeft = false,
  }: {
    label: string;
    sortKey: AgentSortKey;
    stickyLeft?: boolean;
  }) {
    const isSelected =
      selectedSort === sortKey;

    const nextDir: SortDir =
      isSelected &&
      selectedDir === "desc"
        ? "asc"
        : "desc";

    const href = buildReportHref({
      market: selectedMarket,
      propertyType:
        selectedPropertyType,
      zone: selectedZone,
      area: selectedArea,
      community:
        selectedCommunity,
      development:
        selectedDevelopment,
      range: selectedRange,
      startDate:
        selectedStartDate,
      endDate:
        selectedEndDate,
      sort: sortKey,
      dir: nextDir,
    });

    const arrow = isSelected
      ? selectedDir === "asc"
        ? " ▲"
        : " ▼"
      : "";

    return (
      <th
        className={`sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold ${
          stickyLeft
            ? "left-0 z-40 shadow-[2px_0_0_#e2e8f0]"
            : ""
        }`}
      >
        <Link
          href={href}
          className="hover:underline"
        >
          {label}
          {arrow}
        </Link>
      </th>
    );
  }
}

function KpiGrid({
  summary,
}: {
  summary: AgentReportSummary | null;
}) {
  const cards = [
    [
      "Closed Transactions",
      formatNumber(
        summary?.closed_transactions,
      ),
      "Actual properties sold",
    ],
    [
      "Transaction Volume",
      formatMoney(
        summary?.transaction_volume_usd,
      ),
      "Each sale counted once",
    ],
    [
      "Listing Sides",
      formatNumber(
        summary?.listing_sides,
      ),
      formatMoney(
        summary?.listing_volume_usd,
      ),
    ],
    [
      "Selling Sides",
      formatNumber(
        summary?.selling_sides,
      ),
      formatMoney(
        summary?.selling_volume_usd,
      ),
    ],
    [
      "Both Sides",
      formatNumber(
        summary?.both_sides,
      ),
      `${formatPercent(
        summary?.both_sides_pc,
      )} of transactions`,
    ],
    [
      "Total Sides",
      formatNumber(
        summary?.total_sides,
      ),
      `${formatPercent(
        summary?.side_capture_pc,
      )} capture rate`,
    ],
    [
      "Total Side Volume",
      formatMoney(
        summary?.total_side_volume_usd,
      ),
      "Listing + selling volume",
    ],
    [
      "Median Sold Price",
      formatMoney(
        summary?.median_sold_price_usd,
      ),
      `Average ${formatMoney(
        summary?.average_sold_price_usd,
      )}`,
    ],
    [
      "Median DOM",
      formatNumber(
        summary?.median_dom,
        1,
      ),
      `Average ${formatNumber(
        summary?.average_dom,
        1,
      )}`,
    ],
    [
      "Median Sold/List",
      formatPercent(
        summary?.median_sold_to_list_pc,
      ),
      `Average ${formatPercent(
        summary?.average_sold_to_list_pc,
      )}`,
    ],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(
        ([label, value, note]) => (
          <div
            key={label}
            className="rounded-xl bg-white p-4 shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {note}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

function Td({
  children,
  stickyLeft = false,
}: {
  children: React.ReactNode;
  stickyLeft?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-t border-slate-100 px-4 py-3 ${
        stickyLeft
          ? "sticky left-0 z-10 bg-white shadow-[2px_0_0_#e2e8f0]"
          : "bg-white"
      }`}
    >
      {children}
    </td>
  );
}

async function loadFilterOptions({
  supabase,
  selectedMarket,
  selectedPropertyType,
  selectedStartDate,
  selectedEndDate,
}: {
  supabase: SupabaseClient;
  selectedMarket: string;
  selectedPropertyType: string;
  selectedStartDate: string;
  selectedEndDate: string;
}) {
  let query = supabase
    .from("closed_listing_list")
    .select(
      "zone_name, area_name, community_name, development_name",
    );

  if (selectedMarket !== "all") {
    query = query.eq(
      "market_segment",
      selectedMarket,
    );
  }

  if (
    selectedPropertyType !== "all"
  ) {
    query = query.eq(
      "property_type_segment",
      selectedPropertyType,
    );
  }

  if (selectedStartDate) {
    query = query.gte(
      "sold_date",
      selectedStartDate,
    );
  }

  if (selectedEndDate) {
    query = query.lte(
      "sold_date",
      selectedEndDate,
    );
  }

  const rows: {
    zone_name: string | null;
    area_name: string | null;
    community_name: string | null;
    development_name: string | null;
  }[] = [];

  const pageSize = 1000;

  for (
    let from = 0;
    from < 50000;
    from += pageSize
  ) {
    const response =
      await query.range(
        from,
        from + pageSize - 1,
      );

    if (response.error) {
      return {
        rows,
        error: response.error,
      };
    }

    rows.push(
      ...(response.data ?? []),
    );

    if (
      !response.data ||
      response.data.length <
        pageSize
    ) {
      break;
    }
  }

  return {
    rows,
    error: null,
  };
}

function uniqueSorted(
  values: Array<string | null>,
) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value),
      ),
    ),
  ).sort((a, b) =>
    a.localeCompare(b),
  );
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
  const parts: string[] = [];

  parts.push(
    selectedMarket === "all"
      ? "All Markets"
      : selectedMarket ===
          "pre_construction"
        ? "Pre-Construction"
        : "Resale",
  );

  parts.push(
    selectedPropertyType === "all"
      ? "All Property Types"
      : selectedPropertyType ===
          "condos"
        ? "Condos"
        : "Houses",
  );

  parts.push(
    selectedZone === "all"
      ? "All Zones"
      : selectedZone,
  );

  if (selectedArea !== "all") {
    parts.push(selectedArea);
  }

  if (
    selectedCommunity !== "all"
  ) {
    parts.push(
      selectedCommunity,
    );
  }

  if (
    selectedDevelopment !==
    "all"
  ) {
    parts.push(
      selectedDevelopment,
    );
  }

  parts.push(
    `${formatDateShort(
      selectedStartDate,
    ) || "All Time"} – ${
      formatDateShort(
        selectedEndDate,
      ) || "Today"
    }`,
  );

  return parts.join(" • ");
}

