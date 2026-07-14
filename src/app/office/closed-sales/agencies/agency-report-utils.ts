export type MarketSegment = "all" | "pre_construction" | "resale";
export type PropertyTypeSegment = "all" | "condos" | "houses";
export type RangeKey = "this_year" | "last_year" | "this_month" | "last_year_month" | "all" | "custom";
export type SortDir = "asc" | "desc";
export type AgencySortKey =
  | "agency_nm"
  | "closed_transactions"
  | "transaction_volume_usd"
  | "listing_sides"
  | "listing_volume_usd"
  | "selling_sides"
  | "selling_volume_usd"
  | "both_sides"
  | "total_sides"
  | "total_side_volume_usd"
  | "side_capture_pc"
  | "both_sides_pc"
  | "median_sold_price_usd"
  | "median_dom"
  | "median_sold_to_list_pc";

export type AgencyReportRow = {
  agency_nm: string;
  closed_transactions: number | string | null;
  transaction_volume_usd: number | string | null;
  listing_sides: number | string | null;
  listing_volume_usd: number | string | null;
  selling_sides: number | string | null;
  selling_volume_usd: number | string | null;
  both_sides: number | string | null;
  total_sides: number | string | null;
  total_side_volume_usd: number | string | null;
  side_capture_pc: number | string | null;
  both_sides_pc: number | string | null;
  average_sold_price_usd: number | string | null;
  median_sold_price_usd: number | string | null;
  average_dom: number | string | null;
  median_dom: number | string | null;
  average_sold_to_list_pc: number | string | null;
  median_sold_to_list_pc: number | string | null;
  average_sold_vs_list_pc: number | string | null;
  median_sold_vs_list_pc: number | string | null;
};

export type AgencyReportSummary = Omit<AgencyReportRow, "agency_nm">;

export function getMarketSegment(value?: string): MarketSegment {
  if (value === "pre_construction") return "pre_construction";
  if (value === "resale") return "resale";
  return "all";
}

export function getPropertyTypeSegment(value?: string): PropertyTypeSegment {
  if (value === "condos") return "condos";
  if (value === "houses") return "houses";
  return "all";
}

export function getRangeKey(value?: string): RangeKey {
  if (value === "last_year") return "last_year";
  if (value === "this_month") return "this_month";
  if (value === "last_year_month") return "last_year_month";
  if (value === "all") return "all";
  if (value === "custom") return "custom";
  return "this_year";
}

export function getSortKey(value?: string): AgencySortKey {
  const allowed: AgencySortKey[] = [
    "agency_nm", "closed_transactions", "transaction_volume_usd",
    "listing_sides", "listing_volume_usd", "selling_sides",
    "selling_volume_usd", "both_sides", "total_sides",
    "total_side_volume_usd", "side_capture_pc", "both_sides_pc",
    "median_sold_price_usd", "median_dom", "median_sold_to_list_pc",
  ];
  return allowed.includes(value as AgencySortKey)
    ? (value as AgencySortKey)
    : "transaction_volume_usd";
}

export function getSortDir(value?: string): SortDir {
  return value === "asc" ? "asc" : "desc";
}

export function resolveDateRange(range: RangeKey, customStart?: string, customEnd?: string) {
  const today = new Date();
  if (range === "custom") return { startDate: validDate(customStart) ? customStart! : "", endDate: validDate(customEnd) ? customEnd! : "" };
  if (range === "all") return { startDate: "", endDate: "" };
  if (range === "last_year") return { startDate: `${today.getFullYear() - 1}-01-01`, endDate: `${today.getFullYear() - 1}-12-31` };
  if (range === "this_month") return { startDate: formatISODate(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: formatISODate(today) };
  if (range === "last_year_month") {
    const year = today.getFullYear() - 1;
    const month = today.getMonth();
    return { startDate: formatISODate(new Date(year, month, 1)), endDate: formatISODate(new Date(year, month + 1, 0)) };
  }
  return { startDate: `${today.getFullYear()}-01-01`, endDate: formatISODate(today) };
}

export function toRpcMarketType(value: MarketSegment) {
  if (value === "pre_construction") return "PRE-CONSTRUCTION";
  if (value === "resale") return "RESALE";
  return null;
}

export function toRpcPropertyType(value: PropertyTypeSegment) {
  if (value === "condos") return "Condos";
  if (value === "houses") return "Houses";
  return null;
}

export function sortRows(rows: AgencyReportRow[], key: AgencySortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const result = key === "agency_nm"
      ? String(av ?? "").localeCompare(String(bv ?? ""))
      : toNumber(av) - toNumber(bv);
    return dir === "asc" ? result : -result;
  });
}

export function buildReportHref(args: {
  market: MarketSegment;
  propertyType: PropertyTypeSegment;
  zone: string;
  area: string;
  community: string;
  development: string;
  range: RangeKey;
  startDate: string;
  endDate: string;
  sort: AgencySortKey;
  dir: SortDir;
}) {
  const p = new URLSearchParams();
  if (args.market !== "all") p.set("market", args.market);
  if (args.propertyType !== "all") p.set("propertyType", args.propertyType);
  if (args.zone !== "Puerto Vallarta") p.set("zone", args.zone);
  if (args.area !== "all") p.set("area", args.area);
  if (args.community !== "all") p.set("community", args.community);
  if (args.development !== "all") p.set("development", args.development);
  if (args.range !== "this_year") p.set("range", args.range);
  if (args.sort !== "transaction_volume_usd") p.set("sort", args.sort);
  if (args.dir !== "desc") p.set("dir", args.dir);
  if (args.range === "custom") {
    if (args.startDate) p.set("startDate", args.startDate);
    if (args.endDate) p.set("endDate", args.endDate);
  }
  const qs = p.toString();
  return qs ? `/office/closed-sales/agencies?${qs}` : "/office/closed-sales/agencies";
}

export function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatNumber(value: unknown, maximumFractionDigits = 0) {
  return toNumber(value).toLocaleString("en-US", { maximumFractionDigits });
}

export function formatPercent(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return `${toNumber(value).toFixed(1)}%`;
}

export function formatDateLong(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function validDate(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
