import Link from "next/link";

type SearchParams = Record<string, string | undefined>;

export default function ReportFilterGroup({
  title,
  paramName,
  options,
  params,
  basePath,
  anchor,
  resetKeys = [],
}: {
  title: string;
  paramName: string;
  options: { label: string; value: string }[];
  params: SearchParams;
  basePath: string;
  anchor: string;
  resetKeys?: string[];
}) {
  const currentValue = params[paramName] ?? "";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={filterTitleStyle}>{title}</div>

      <div className="report-filter-group-row" style={filterRowStyle}>
        {options.map((option) => (
          <Link
            key={option.label}
            href={buildHref({
              params,
              basePath,
              anchor,
              updates: {
                [paramName]: option.value,
                ...Object.fromEntries(resetKeys.map((key) => [key, undefined])),
              },
            })}
            className="report-filter-button"
            style={
              currentValue === option.value
                ? selectedFilterStyle
                : filterLinkStyle
            }
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildHref({
  params,
  updates,
  basePath,
  anchor,
}: {
  params: SearchParams;
  updates: SearchParams;
  basePath: string;
  anchor: string;
}) {
  const merged = { ...params, ...updates };
  const next = new URLSearchParams();

  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      next.set(key, String(value));
    }
  });

  const qs = next.toString();

  return qs ? `${basePath}?${qs}#${anchor}` : `${basePath}#${anchor}`;
}

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