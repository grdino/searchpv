import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReportExportButtons from "@/app/components/ReportExportButtons";
import ReportHierarchyFilters from "@/app/components/ReportHierarchyFilters";
import { buildIdxUrl } from "@/lib/idx";
import SPVBranding from "@/app/components/SPVBranding";
import HamburgerMenu from "@/app/components/HamburgerMenu";

export const metadata: Metadata = {
  title: "Active Listings Report | SearchPV",
  description: "Sortable active listings report for Puerto Vallarta real estate.",
};

type SearchParams = {
  zone?: string;  
  area?: string;
  community?: string;
  development?: string;
  propertyType?: string;
  marketType?: string;
  beds?: string;
  sort?: string;
  dir?: "asc" | "desc";
};

type ActiveListing = {
  mls: number | null;
  data_current_as_of: string | null;
  development: string | null;
  unit_id: string | null;
  address: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  sqm: number | null;
  original_price: number | null;
  current_price: number | null;
  price_changes: number | null;
  price_change_amount: number | null;
  price_change_percent: number | null;
  dom: number | null;
};

const sortableColumns = new Set([
  "mls",
  "development",
  "unit_id",
  "address",
  "beds",
  "baths",
  "sqft",
  "sqm",
  "original_price",
  "current_price",
  "price_changes",
  "price_change_amount",
  "price_change_percent",
  "dom",
]);

export default async function ActiveListingsReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let zoneQuery = supabase
  .from("active_listing")
  .select("zone_name");

if (params.propertyType) {
  zoneQuery = zoneQuery.eq("prprty_type", params.propertyType);
}

if (params.marketType) {
  zoneQuery = zoneQuery.eq("market_type", params.marketType);
}

const { data: zoneRows } = await zoneQuery;
const zones = unique(zoneRows, "zone_name");

let areaRows: { area_name: string | null }[] | null = [];

if (params.zone) {
  let areaQuery = supabase
    .from("active_listing")
    .select("area_name")
    .eq("zone_name", params.zone);

  if (params.propertyType) {
    areaQuery = areaQuery.eq("prprty_type", params.propertyType);
  }

  if (params.marketType) {
    areaQuery = areaQuery.eq("market_type", params.marketType);
  }

  const { data } = await areaQuery;
  areaRows = data;
}

  const areas = unique(areaRows, "area_name");

  let communityRows: { community_name: string | null }[] | null = [];

  if (params.zone && params.area) {
    let communityQuery = supabase
      .from("active_listing")
      .select("community_name")
      .eq("zone_name", params.zone)
      .eq("area_name", params.area);

    if (params.propertyType) {
      communityQuery = communityQuery.eq("prprty_type", params.propertyType);
    }

    if (params.marketType) {
      communityQuery = communityQuery.eq("market_type", params.marketType);
    }

    const { data } = await communityQuery;
    communityRows = data;
  }

  const communities = unique(communityRows, "community_name");

  let developmentRows: { development_name: string | null }[] | null = [];

  if (params.zone && params.area && params.community) {
    let developmentQuery = supabase
      .from("active_listing")
      .select("development_name")
      .eq("zone_name", params.zone)
      .eq("area_name", params.area)
      .eq("community_name", params.community);

    if (params.propertyType) {
      developmentQuery = developmentQuery.eq("prprty_type", params.propertyType);
    }

    if (params.marketType) {
      developmentQuery = developmentQuery.eq("market_type", params.marketType);
    }

    const { data } = await developmentQuery;
    developmentRows = data;
  }

  const developments = unique(developmentRows, "development_name");

  const sort = sortableColumns.has(params.sort ?? "")
    ? params.sort!
    : "current_price";

  const dir = params.dir === "asc" ? "asc" : "desc";

  let query = supabase
    .from("active_listing")
    .select("*", { count: "exact" })
    .order(sort, { ascending: dir === "asc" });

    if (params.zone) query = query.eq("zone_name", params.zone);
    if (params.area) query = query.eq("area_name", params.area);
    if (params.community) query = query.eq("community_name", params.community);
    if (params.development) query = query.eq("development_name", params.development);
  
    if (params.propertyType) {
    query = query.eq("prprty_type", params.propertyType);
  }

  if (params.marketType) {
    query = query.eq("market_type", params.marketType);
  }

  if (params.beds === "0") query = query.eq("beds", 0);
  if (params.beds === "1") query = query.eq("beds", 1);
  if (params.beds === "2") query = query.eq("beds", 2);
  if (params.beds === "3plus") query = query.gte("beds", 3);

  const pageSize = 1000;
    let allRows: ActiveListing[] = [];
    let totalCount: number | null = null;
    let fetchError: string | null = null;

    for (let from = 0; from < 5000; from += pageSize) {
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        fetchError = error.message;
        break;
      }

      if (from === 0) {
        totalCount = count ?? null;
      }

      allRows = [...allRows, ...((data ?? []) as ActiveListing[])];

      if (!data || data.length < pageSize) {
        break;
      }
    }

  if (fetchError) {
    return (
      <main style={pageStyle}>
        <h1>Active Listings Report</h1>
        <p>Error loading active listings report.</p>
        <pre>{fetchError}</pre>
      </main>
    );
  }

  const rows = allRows;

  const reportGeneratedAt = formatDateTime(new Date().toISOString());
  const dataCurrentAsOf = formatDateTime(rows[0]?.data_current_as_of ?? null);

  return (
    <main style={pageStyle}>
      <div className="no-print report-topbar" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            gap: "12px",
          }}
        >
          <SPVBranding />
          <HamburgerMenu />
        </div>

        <div
          className="report-topbar-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "12px",
            width: "100%",
          }}
        >
          <ReportExportButtons reportKey="active-listings-report" />
        </div>
      </div>

      <section style={{ marginBottom: "24px" }}>
        <p style={eyebrowStyle}>SearchPV Report</p>
        <h1 style={titleStyle}>Active Listings Report</h1>
        <div style={{ marginTop: "14px" }}>
        <div style={metaLabelStyle}>Current Filters Applied</div>
          <div style={currentFiltersTextStyle}>
            {buildFilterSummary(params).join("  /  ")}
          </div>
        </div>

        <div style={reportMetaStyle}>
          <div>
            <div style={metaLabelStyle}>Data Current As Of</div>
            <div style={metaValueStyle}>{dataCurrentAsOf}</div>
          </div>

          <div>
            <div style={metaLabelStyle}>Report Generated</div>
            <div style={metaValueStyle}>{reportGeneratedAt}</div>
          </div>
        </div>
      </section>

      <div style={{ position: "relative", marginBottom: "18px" }}>  
        <div style={reportFiltersHeaderStyle1}>
          ← Report Filters →
        </div>

        <section
          id="active-listings-report"
          className="no-print"
          style={filterBoxStyle}
        >

        <div className="report-filter-buttons" style={buttonRowStyle}>
          <FilterGroup
            title="Property Type"
            paramName="propertyType"
            params={params}
            options={[
              { label: "All", value: "" },
              { label: "Condos", value: "Condos" },
              { label: "Houses", value: "Houses" },
            ]}
          />

          <FilterGroup
            title="Market Type"
            paramName="marketType"
            params={params}
            options={[
              { label: "All", value: "" },
              { label: "Resale", value: "Resale" },
              { label: "Pre-Construction", value: "Pre-Construction" },
            ]}
          />

          <FilterGroup
            title="Bedrooms"
            paramName="beds"
            params={params}
            options={[
              { label: "All", value: "" },
              { label: "Studio", value: "0" },
              { label: "1 BR", value: "1" },
              { label: "2 BR", value: "2" },
              { label: "3+ BR", value: "3plus" },
            ]}
          />
        </div>

        <div className="report-hierarchy-shell">
          <ReportHierarchyFilters
            params={params}
            zones={zones}
            areas={areas}
            communities={communities}
            developments={developments}
          />
        </div>
      </section>
      </div>

      <div style={summaryStyle}>
        Showing <strong>{totalCount ?? rows.length}</strong> active listings report
      </div>

      <p className="mt-2 text-xs text-slate-500 md:hidden">
          ← Swipe to see additional columns →
        </p>

        <div className="report-table-shell mt-1 max-h-[70vh] rounded-xl bg-white shadow md:max-h-[65vh]">
          <table className="w-max min-w-[1350px] text-sm">
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700 shadow-sm">
              <tr>
                <SortableTh label="MLS" column="mls" params={params} className="sticky left-0 z-30 bg-slate-100" />
                <SortableTh label="Development" column="development" params={params} />
                <SortableTh label="Unit" column="unit_id" params={params} />
                <SortableTh label="Address" column="address" params={params} />
                <SortableTh label="Beds" column="beds" params={params} align="right" />
                <SortableTh label="Baths" column="baths" params={params} align="right" />
                <SortableTh label="SqFt" column="sqft" params={params} align="right" />
                <SortableTh label="m²" column="sqm" params={params} align="right" />
                <SortableTh label="Original Price" column="original_price" params={params} align="right" />
                <SortableTh label="Current Price" column="current_price" params={params} align="right" />
                <SortableTh label="Price Chg #" column="price_changes" params={params} align="right" />
                <SortableTh label="Price Chg $" column="price_change_amount" params={params} align="right" />
                <SortableTh label="Price Chg %" column="price_change_percent" params={params} align="right" />
                <SortableTh label="DOM" column="dom" params={params} align="right" />
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={`${row.mls}-${row.address}`} className="border-t">
                  <Td className="sticky left-0 z-10 bg-white border-r border-slate-200 font-semibold">
                    {row.mls ? (
                      <a
                        href={buildIdxUrl(String(row.mls))}
                        style={{
                          color: "#0f5d8c",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {row.mls}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{row.development ?? "—"}</Td>
                  <Td>{row.unit_id ?? "—"}</Td>
                  <Td>{row.address ?? "—"}</Td>
                  <Td align="right">{formatNumber(row.beds)}</Td>
                  <Td align="right">{formatNumber(row.baths)}</Td>
                  <Td align="right">{formatNumber(row.sqft)}</Td>
                  <Td align="right">{formatNumber(row.sqm)}</Td>
                  <Td align="right">{formatCurrency(row.original_price)}</Td>
                  <Td align="right">{formatCurrency(row.current_price)}</Td>
                  <Td align="right">{formatNumber(row.price_changes)}</Td>
                  <Td align="right">{formatCurrency(row.price_change_amount)}</Td>
                  <Td align="right">{formatPercent(row.price_change_percent)}</Td>
                  <Td align="right">{formatNumber(row.dom)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <style>{`.report-hierarchy-shell {
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid #dde8e2;
        width: 100%;
        max-width: 100%;
      }
        
        .report-table-shell {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 700px) {
          .report-topbar-actions {
            width: 100% !important;
            justify-content: stretch !important;
          }
        }

        @media (max-width: 700px) {
          main {
            padding-left: 10px !important;
            padding-right: 10px !important;
           }
        }

        @media (max-width: 700px) {
          .report-filter-buttons {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }

          .report-filter-group-row {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 6px !important;
            width: 100%;
          }

          .report-filter-button {
            padding: 7px 9px !important;
            font-size: 0.78rem !important;
            white-space: nowrap !important;
            flex: 1 1 auto;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            max-width: none !important;
            padding: 0 !important;
          }

          table {
            font-size: 9px !important;
          }

          th, td {
            padding: 4px !important;
          }
        }
      `}</style>
    </main>
  );
}

function SortableTh({
  label,
  column,
  params,
  align = "left",
  className = "",
}: {
  label: string;
  column: string;
  params: SearchParams;
  align?: "left" | "right";
  className?: string;
}) {
  const currentSort = params.sort ?? "current_price";
  const currentDir = params.dir ?? "desc";
  const isCurrent = currentSort === column;

  const nextDir = isCurrent && currentDir === "asc" ? "desc" : "asc";
  const arrow = isCurrent ? (currentDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      className={`whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-wide ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      <Link
        href={buildHref(params, { sort: column, dir: nextDir })}
        className="text-slate-700 no-underline"
      >
        {label}
        {arrow}
      </Link>
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2 align-top text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

function FilterGroup({
  title,
  paramName,
  options,
  params,
}: {
  title: string;
  paramName: keyof SearchParams;
  options: { label: string; value: string }[];
  params: SearchParams;
}) {
  const currentValue = params[paramName] ?? "";

  return (
  <div style={{ textAlign: "center" }}>
      <div style={buttonFilterTitleStyle}>{title}</div>
      <div className="report-filter-group-row" style={filterRowStyle}>
        {options.map((option) => (
          <FilterLink
            key={option.label}
            label={option.label}
            params={params}
            set={
              paramName === "propertyType" || paramName === "marketType"
                ? {
                    [paramName]: option.value,
                    area: undefined,
                    community: undefined,
                    development: undefined,
                  }
                : { [paramName]: option.value }
            }
            active={currentValue === option.value}
          />
        ))}
      </div>
    </div>
  );
}

function unique<T extends Record<string, unknown>>(
  rows: T[] | null,
  key: keyof T
) {
  return Array.from(
    new Set(
      (rows ?? [])
        .map((row) => row[key])
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map(String)
    )
  ).sort();
}

function FilterLink({
  label,
  params,
  set,
  active,
}: {
  label: string;
  params: SearchParams;
  set?: Partial<SearchParams>;
  active?: boolean;
}) {
  return (
    <Link
      href={buildHref(params, set ?? {})}
      className="report-filter-button"
      style={active ? selectedFilterStyle : filterLinkStyle}
    >
      {label}
    </Link>
  );
}

function buildHref(params: SearchParams, updates: Partial<SearchParams>) {
  const merged = { ...params, ...updates };
  const next = new URLSearchParams();

  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      next.set(key, String(value));
    }
  });

  const qs = next.toString();

  return qs
    ? `/market-intelligence/active-listings?${qs}#active-listings-report`
    : "/market-intelligence/active-listings#active-listings-report";
}

function formatCurrency(value: number | null) {
  if (value == null) return "—";

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: number | null) {
  if (value == null) return "—";

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
}

function formatPercent(value: number | null) {
  if (value == null) return "—";

  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildFilterSummary(params: SearchParams) {
  return [
    params.propertyType ?? "All Property Types",
    params.marketType ?? "All Market Types",
    params.beds ? formatBedroomFilter(params.beds) : "All Bedrooms",
    params.zone ?? "All Zones",
    params.area ?? "All Areas",
    params.community ?? "All Communities",
    params.development ?? "All Developments",
  ];
}

function formatBedroomFilter(value: string) {
  if (value === "0") return "Studio";
  if (value === "1") return "1 BR";
  if (value === "2") return "2 BR";
  if (value === "3plus") return "3+ BR";
  return "All Bedrooms";
}

const buttonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "18px",
  alignItems: "start",
  marginBottom: "24px",
} as const;

const pageStyle = {
  width: "100%",
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "28px 12px 60px",
  color: "#17211b",
} as const;

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "24px",
} as const;

const eyebrowStyle = {
  margin: 0,
  fontSize: "0.8rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.75,
} as const;

const titleStyle = {
  margin: "6px 0 8px",
  fontSize: "2rem",
  lineHeight: 1.1,
} as const;

const subtitleStyle = {
  margin: 0,
  maxWidth: "760px",
  opacity: 0.8,
} as const;

const filterBoxStyle = {
  display: "block",
  padding: "20px 24px 24px",
  border: "1px solid #dde8e2",
  borderRadius: "18px",
  background: "#f7faf8",
  marginBottom: "18px",
} as const;

const filterTitleStyle = {
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  opacity: 0.7,
  textAlign: "center",
} as const;

const filterRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "8px",
} as const;

const filterLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #c8d8d0",
  borderRadius: "999px",
  padding: "7px 12px",
  textDecoration: "none",
  color: "#26352f",
  background: "#ffffff",
  fontSize: "0.9rem",
  fontWeight: 700,
} as const;

const selectedFilterStyle = {
  ...filterLinkStyle,
  color: "#ffffff",
  background: "#2f5d50",
  border: "1px solid #2f5d50",
} as const;

const summaryStyle = {
  marginBottom: "10px",
  fontSize: "0.95rem",
  opacity: 0.8,
} as const;

const buttonFilterTitleStyle = {
  ...filterTitleStyle,
  textAlign: "center",
} as const;

const reportMetaStyle = {
  marginTop: "14px",
  display: "flex",
  gap: "28px",
  flexWrap: "wrap",
} as const;

const metaLabelStyle = {
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.65,
} as const;

const metaValueStyle = {
  marginTop: "3px",
  fontSize: "0.92rem",
  fontWeight: 700,
  color: "#17211b",
} as const;

const filterSummaryStyle = {
  marginTop: "12px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
} as const;

const filterPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  background: "#eef6f2",
  border: "1px solid #c8d8d0",
  color: "#2f5d50",
  padding: "5px 10px",
  fontSize: "0.82rem",
  fontWeight: 700,
} as const;

const reportFiltersHeaderStyle1 = {
  position: "absolute",
  top: "-12px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "4px 14px",
  background: "#dfeee8",      // slightly darker than the filter box
  border: "1px solid #c8d8d0",
  borderRadius: "999px",
  color: "#2f5d50",
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
  zIndex: 10,
  letterSpacing: "0.35em",
  wordSpacing: "0.75em",
} as const;

const currentFiltersTextStyle = {
  marginTop: "3px",
  fontSize: "0.92rem",
  fontWeight: 700,
  color: "#17211b",
  lineHeight: 1.4,
} as const;