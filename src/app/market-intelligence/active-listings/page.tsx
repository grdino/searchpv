import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PrintButton from "@/app/components/PrintButton";
import ReportHierarchyFilters from "@/app/components/ReportHierarchyFilters";

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
  address: string | null;
  development: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  sqm: number | null;
  original_price: number | null;
  current_price: number | null;
  price_changes: number | null;
  total_reduction: number | null;
  reduction_percent: number | null;
  dom: number | null;
};

const sortableColumns = new Set([
  "mls",
  "address",
  "development",
  "beds",
  "baths",
  "sqft",
  "sqm",
  "original_price",
  "current_price",
  "price_changes",
  "total_reduction",
  "reduction_percent",
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
    .select("*")
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

  const { data, error } = await query.limit(500);

  if (error) {
    return (
      <main style={pageStyle}>
        <h1>Active Listings Report</h1>
        <p>Error loading active listings.</p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  const rows = (data ?? []) as ActiveListing[];

  return (
    <main style={pageStyle}>
      <div className="no-print" style={topBarStyle}>
        <Link href="/market-intelligence" style={backLinkStyle}>
          ← Back to Market Intelligence
        </Link>

        <PrintButton />
      </div>

      <section style={{ marginBottom: "24px" }}>
        <p style={eyebrowStyle}>SearchPV Report</p>
        <h1 style={titleStyle}>Active Listings Report</h1>
        <p style={subtitleStyle}>
          Current active listings with sortable pricing, size, reduction and DOM.
        </p>
      </section>

      <section className="no-print" style={filterBoxStyle}>


        <div style={buttonRowStyle}>
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

      <div style={summaryStyle}>
        Showing <strong>{rows.length}</strong> active listings
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <SortableTh label="MLS" column="mls" params={params} />
              <SortableTh label="Address" column="address" params={params} />
              <SortableTh label="Development" column="development" params={params} />
              <SortableTh label="Beds" column="beds" params={params} align="right" />
              <SortableTh label="Baths" column="baths" params={params} align="right" />
              <SortableTh label="SqFt" column="sqft" params={params} align="right" />
              <SortableTh label="m²" column="sqm" params={params} align="right" />
              <SortableTh label="Original Price" column="original_price" params={params} align="right" />
              <SortableTh label="Current Price" column="current_price" params={params} align="right" />
              <SortableTh label="Price Chg #" column="price_changes" params={params} align="right" />
              <SortableTh label="Price Chg $" column="total_reduction" params={params} align="right" />
              <SortableTh label="Price Chg %" column="reduction_percent" params={params} align="right" />
              <SortableTh label="DOM" column="dom" params={params} align="right" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={`${row.mls}-${row.address}`}>
                <td style={tdStyle}>{row.mls}</td>
                <td style={tdStyle}>{row.address ?? "—"}</td>
                <td style={tdStyle}>{row.development ?? "—"}</td>
                <td style={tdRightStyle}>{formatNumber(row.beds)}</td>
                <td style={tdRightStyle}>{formatNumber(row.baths)}</td>
                <td style={tdRightStyle}>{formatNumber(row.sqft)}</td>
                <td style={tdRightStyle}>{formatNumber(row.sqm)}</td>
                <td style={tdRightStyle}>{formatCurrency(row.original_price)}</td>
                <td style={tdRightStyle}>{formatCurrency(row.current_price)}</td>
                <td style={tdRightStyle}>{formatNumber(row.price_changes)}</td>
                <td style={tdRightStyle}>{formatCurrency(row.total_reduction)}</td>
                <td style={tdRightStyle}>{formatPercent(row.reduction_percent)}</td>
                <td style={tdRightStyle}>{formatNumber(row.dom)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .report-hierarchy-shell {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid #dde8e2;
        }

        .report-hierarchy-shell > * {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(180px, 1fr)) !important;
          gap: 14px !important;
          align-items: end !important;
          width: 100% !important;
        }

        .report-hierarchy-shell label,
        .report-hierarchy-shell div {
          text-align: left;
        }

        .report-hierarchy-shell select {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          border: 1px solid #c8d8d0;
          background: white;
          padding: 0 14px;
          font-weight: 700;
          color: #26352f;
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
}: {
  label: string;
  column: string;
  params: SearchParams;
  align?: "left" | "right";
}) {
  const currentSort = params.sort ?? "current_price";
  const currentDir = params.dir ?? "desc";
  const isCurrent = currentSort === column;

  const nextDir = isCurrent && currentDir === "asc" ? "desc" : "asc";
  const arrow = isCurrent ? (currentDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <th style={{ ...thStyle, textAlign: align }}>
      <Link
        href={buildHref(params, { sort: column, dir: nextDir })}
        style={thLinkStyle}
      >
        {label}
        {arrow}
      </Link>
    </th>
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
      <div style={filterRowStyle}>
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
  ? `/market-intelligence/active-listings?${qs}`
  : "/market-intelligence/active-listings";
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

const buttonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
  gap: "18px",
  alignItems: "start",
  marginBottom: "24px",
} as const;

const pageStyle = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "28px 18px 60px",
  color: "#17211b",
} as const;

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "24px",
} as const;

const backLinkStyle = {
  color: "#2f5d50",
  textDecoration: "none",
  fontWeight: 600,
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

const tableWrapStyle = {
  overflowX: "auto",
  border: "1px solid #dde8e2",
  borderRadius: "16px",
} as const;

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1250px",
  background: "#ffffff",
} as const;

const thStyle = {
  padding: "10px",
  borderBottom: "1px solid #dde8e2",
  background: "#f7faf8",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
} as const;

const thLinkStyle = {
  color: "#17211b",
  textDecoration: "none",
} as const;

const tdStyle = {
  padding: "9px 10px",
  borderBottom: "1px solid #eef3f0",
  fontSize: "0.9rem",
  verticalAlign: "top",
} as const;

const tdRightStyle = {
  ...tdStyle,
  textAlign: "right",
  whiteSpace: "nowrap",
} as const;


const buttonFilterTitleStyle = {
  ...filterTitleStyle,
  textAlign: "center",
} as const;