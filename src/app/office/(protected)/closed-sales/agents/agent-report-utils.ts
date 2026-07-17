export type MarketSegment =
  | "all"
  | "pre_construction"
  | "resale";

export type PropertyTypeSegment =
  | "all"
  | "condos"
  | "houses";

export type RangeKey =
  | "this_year"
  | "last_year"
  | "this_month"
  | "last_year_month"
  | "all"
  | "custom";

export type SortDir = "asc" | "desc";

export type AgentSortKey =
  | "agent_nm"
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

export type AgentReportRow = {
  agent_nm: string;
  agency_nm: string | null;

  closed_transactions: number | null;
  transaction_volume_usd: number | null;

  listing_sides: number | null;
  listing_volume_usd: number | null;

  selling_sides: number | null;
  selling_volume_usd: number | null;

  both_sides: number | null;
  total_sides: number | null;
  total_side_volume_usd: number | null;

  side_capture_pc: number | null;
  both_sides_pc: number | null;

  median_sold_price_usd: number | null;
  median_dom: number | null;
  median_sold_to_list_pc: number | null;
};

export type AgentReportSummary = {
  closed_transactions: number | null;
  transaction_volume_usd: number | null;

  listing_sides: number | null;
  listing_volume_usd: number | null;

  selling_sides: number | null;
  selling_volume_usd: number | null;

  both_sides: number | null;
  both_sides_pc: number | null;

  total_sides: number | null;
  total_side_volume_usd: number | null;
  side_capture_pc: number | null;

  median_sold_price_usd: number | null;
  average_sold_price_usd: number | null;

  median_dom: number | null;
  average_dom: number | null;

  median_sold_to_list_pc: number | null;
  average_sold_to_list_pc: number | null;
};

type BuildReportHrefParams = {
  market: MarketSegment;
  propertyType: PropertyTypeSegment;

  zone: string;
  area: string;
  community: string;
  development: string;

  range: RangeKey;
  startDate: string;
  endDate: string;

  sort: AgentSortKey;
  dir: SortDir;
};

type ResolvedDateRange = {
  startDate: string;
  endDate: string;
};

const DEFAULT_SORT_KEY: AgentSortKey =
  "total_side_volume_usd";

const DEFAULT_SORT_DIR: SortDir = "desc";

const VALID_MARKET_SEGMENTS: MarketSegment[] = [
  "all",
  "pre_construction",
  "resale",
];

const VALID_PROPERTY_TYPE_SEGMENTS: PropertyTypeSegment[] = [
  "all",
  "condos",
  "houses",
];

const VALID_RANGE_KEYS: RangeKey[] = [
  "this_year",
  "last_year",
  "this_month",
  "last_year_month",
  "all",
  "custom",
];

const VALID_SORT_KEYS: AgentSortKey[] = [
  "agent_nm",
  "agency_nm",
  "closed_transactions",
  "transaction_volume_usd",
  "listing_sides",
  "listing_volume_usd",
  "selling_sides",
  "selling_volume_usd",
  "both_sides",
  "total_sides",
  "total_side_volume_usd",
  "side_capture_pc",
  "both_sides_pc",
  "median_sold_price_usd",
  "median_dom",
  "median_sold_to_list_pc",
];

/**
 * Build the URL used by filters and sortable column headings.
 */
export function buildReportHref({
  market,
  propertyType,
  zone,
  area,
  community,
  development,
  range,
  startDate,
  endDate,
  sort,
  dir,
}: BuildReportHrefParams) {
  const params = new URLSearchParams();

  params.set("market", market);
  params.set("propertyType", propertyType);

  params.set("zone", zone);
  params.set("area", area);
  params.set("community", community);
  params.set("development", development);

  params.set("range", range);

  if (startDate) {
    params.set("startDate", startDate);
  }

  if (endDate) {
    params.set("endDate", endDate);
  }

  params.set("sort", sort);
  params.set("dir", dir);

  return `/office/closed-sales/agents?${params.toString()}`;
}

/**
 * Validate the market query-string value.
 */
export function getMarketSegment(
  value?: string,
): MarketSegment {
  return VALID_MARKET_SEGMENTS.includes(
    value as MarketSegment,
  )
    ? (value as MarketSegment)
    : "all";
}

/**
 * Validate the property-type query-string value.
 */
export function getPropertyTypeSegment(
  value?: string,
): PropertyTypeSegment {
  return VALID_PROPERTY_TYPE_SEGMENTS.includes(
    value as PropertyTypeSegment,
  )
    ? (value as PropertyTypeSegment)
    : "all";
}

/**
 * Validate the date-range query-string value.
 */
export function getRangeKey(value?: string): RangeKey {
  return VALID_RANGE_KEYS.includes(value as RangeKey)
    ? (value as RangeKey)
    : "this_year";
}

/**
 * Validate the table sort query-string value.
 */
export function getSortKey(
  value?: string,
): AgentSortKey {
  return VALID_SORT_KEYS.includes(value as AgentSortKey)
    ? (value as AgentSortKey)
    : DEFAULT_SORT_KEY;
}

/**
 * Validate the sort direction.
 */
export function getSortDir(value?: string): SortDir {
  return value === "asc" || value === "desc"
    ? value
    : DEFAULT_SORT_DIR;
}

/**
 * Convert the UI property-type filter into the value expected
 * by the Supabase RPC.
 */
export function toRpcPropertyType(
  propertyType: PropertyTypeSegment,
) {
  if (propertyType === "condos") {
    return "Condos";
  }

  if (propertyType === "houses") {
    return "Houses";
  }

  return null;
}

/**
 * Convert the UI market filter into the value expected
 * by the Supabase RPC.
 *
 * Change these returned strings if the database stores different
 * market-segment values.
 */
export function toRpcMarketType(value: MarketSegment) {
  if (value === "pre_construction") return "PRE-CONSTRUCTION";
  if (value === "resale") return "RESALE";
  return null;
}

/**
 * Resolve a preset or custom URL date range.
 */
export function resolveDateRange(
  range: RangeKey,
  customStartDate?: string,
  customEndDate?: string,
  today = new Date(),
): ResolvedDateRange {
  const currentDate = startOfLocalDay(today);

  switch (range) {
    case "this_year": {
      return {
        startDate: formatDateForUrl(
          new Date(currentDate.getFullYear(), 0, 1),
        ),
        endDate: formatDateForUrl(currentDate),
      };
    }

    case "last_year": {
      const lastYear = currentDate.getFullYear() - 1;

      return {
        startDate: formatDateForUrl(
          new Date(lastYear, 0, 1),
        ),
        endDate: formatDateForUrl(
          new Date(lastYear, 11, 31),
        ),
      };
    }

    case "this_month": {
      return {
        startDate: formatDateForUrl(
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
          ),
        ),
        endDate: formatDateForUrl(currentDate),
      };
    }

    case "last_year_month": {
      const lastYear = currentDate.getFullYear() - 1;
      const month = currentDate.getMonth();

      return {
        startDate: formatDateForUrl(
          new Date(lastYear, month, 1),
        ),
        endDate: formatDateForUrl(
          new Date(lastYear, month + 1, 0),
        ),
      };
    }

    case "custom": {
      return normalizeCustomDateRange(
        customStartDate,
        customEndDate,
      );
    }

    case "all":
    default: {
      return {
        startDate: "",
        endDate: "",
      };
    }
  }
}

/**
 * Sort agent report rows without mutating the Supabase result.
 */
export function sortRows(
  rows: AgentReportRow[],
  sortKey: AgentSortKey,
  sortDir: SortDir,
) {
  return [...rows].sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];

    if (left === null && right !== null) {
      return 1;
    }

    if (left !== null && right === null) {
      return -1;
    }

    if (left === null && right === null) {
      return compareAgentRows(a, b);
    }

    const comparison =
      typeof left === "number" &&
      typeof right === "number"
        ? left - right
        : compareText(
            String(left),
            String(right),
          );

    if (comparison !== 0) {
      return sortDir === "asc"
        ? comparison
        : -comparison;
    }

    return compareAgentRows(a, b);
  });
}

function compareAgentRows(
  a: AgentReportRow,
  b: AgentReportRow,
) {
  const agentComparison = compareText(
    a.agent_nm,
    b.agent_nm,
  );

  if (agentComparison !== 0) {
    return agentComparison;
  }

  return compareText(
    a.agency_nm,
    b.agency_nm,
  );
}

/**
 * Format a monetary value as whole US dollars.
 */
export function formatMoney(
  value: number | null | undefined,
) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

/**
 * Format counts, DOM, and similar numeric values.
 */
export function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 0,
) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number);
}

/**
 * Format a database percentage.
 *
 * This assumes the database returns 25 for 25%, not 0.25.
 */
export function formatPercent(
  value: number | null | undefined,
  maximumFractionDigits = 1,
) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number / 100);
}

/**
 * Format YYYY-MM-DD as a full display date.
 */
export function formatDateLong(value: string) {
  const date = parseUrlDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format YYYY-MM-DD as a shorter display date.
 */
export function formatDateShort(value: string) {
  const date = parseUrlDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeCustomDateRange(
  customStartDate?: string,
  customEndDate?: string,
): ResolvedDateRange {
  let startDate = isValidUrlDate(customStartDate)
    ? customStartDate!
    : "";

  let endDate = isValidUrlDate(customEndDate)
    ? customEndDate!
    : "";

  /*
   * If both dates are present but reversed, swap them.
   */
  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    [startDate, endDate] = [
      endDate,
      startDate,
    ];
  }

  return {
    startDate,
    endDate,
  };
}

function compareText(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return (left ?? "").localeCompare(
    right ?? "",
    "en",
    {
      sensitivity: "base",
      numeric: true,
    },
  );
}

function toFiniteNumber(
  value: number | null | undefined,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function startOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function formatDateForUrl(date: Date) {
  const year = date.getFullYear();

  if (year < 2000 || year > 2100) {
    return "";
  }

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseUrlDate(value: string) {
  if (!isValidUrlDate(value)) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function isValidUrlDate(
  value?: string,
): value is string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (year < 2000 || year > 2100) {
    return false;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}