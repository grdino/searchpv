import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

export default function StickyBreadcrumb({
  crumbs,
  filters,
}: {
  crumbs: Crumb[];
  filters?: string;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "#334155",
        borderBottom: "1px solid #1e293b",
        padding: "10px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          textAlign: "center",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {index > 0 && " > "}
            {crumb.href ? (
              <Link
                href={crumb.href}
                style={{ color: "#ffffff", textDecoration: "underline" }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}

        {filters && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {filters}
          </div>
        )}
      </div>
    </div>
  );
}
