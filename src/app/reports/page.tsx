import Header from "@/app/components/Header";
import {
  BadgeDollarSign,
  ClipboardList,
  Clock3,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Active Listings Report",
    description: "Download current inventory with pricing, DOM, and listing details.",
    href: "/reports/active-listings-report",
    Icon: ClipboardList,
    inDevelopment: false,
  },
  {
    title: "Pending Sales Report",
    description: "Download listings currently under contract across selected markets.",
    href: "/reports/pending-sales-report",
    Icon: Clock3,
    inDevelopment: true,
  },
  {
    title: "Closed Sales Report",
    description: "Download historical sales activity, sold pricing, and market results.",
    href: "/reports/closed-sales-report",
    Icon: BadgeDollarSign,
    inDevelopment: true,
  },
  {
    title: "Price Changes Report",
    description: "Download price changes, reductions, and listing adjustments.",
    href: "/reports/price-changes-report",
    Icon: TrendingDown,
    inDevelopment: true,
  },
  {
    title: "New Listings Report",
    description: "Download newly listed properties entering the market.",
    href: "/reports/new-listings-report",
    Icon: Sparkles,
    inDevelopment: true,
  },
];

export default function ReportsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <section style={{ background: "#020817", color: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>
          <Header />

          <div style={{ marginTop: "40px", maxWidth: "760px" }}>
            <p style={eyebrowStyle}>Download Puerto Vallarta market reports.</p>

            <h1 style={heroTitleStyle}>Reports</h1>

            <p style={heroTextStyle}>
              Download professionally formatted reports using current inventory,
              pending sales, closed sales, pricing history, and market statistics.
            </p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ marginBottom: "22px" }}>
          <p style={sectionEyebrowStyle}>Downloads</p>

          <h2 style={sectionTitleStyle}>Choose a Report</h2>
        </div>

        <div style={gridStyle}>
          {reports.map(({ title, description, href, Icon, inDevelopment }) => (
            <Link key={title} href={href} style={cardLinkStyle}>
              <article style={cardStyle}>
                <div style={iconBoxStyle}>
                  <Icon size={22} strokeWidth={2} />
                </div>

                <h3 style={cardTitleStyle}>{title}</h3>

                {inDevelopment && (
                  <span style={badgeStyle}>🚧 IN DEVELOPMENT</span>
                )}

                <p style={cardTextStyle}>{description}</p>

                <span style={actionStyle}>
                  {inDevelopment ? "Coming Soon →" : "Download →"}
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const eyebrowStyle = {
  margin: "0 0 12px",
  fontSize: "0.85rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.75,
};

const heroTitleStyle = {
  margin: 0,
  fontSize: "clamp(32px, 6vw, 56px)",
  lineHeight: 1.05,
};

const heroTextStyle = {
  marginTop: "18px",
  fontSize: "1.05rem",
  lineHeight: 1.6,
  color: "#dbe4f0",
};

const sectionEyebrowStyle = {
  margin: "0 0 8px",
  fontSize: "0.8rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
  fontWeight: 700,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "clamp(24px, 4vw, 34px)",
  color: "#0f172a",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
};

const cardLinkStyle = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
};

const cardStyle = {
  minHeight: "180px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const iconBoxStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "#eaf2ff",
  color: "#1e3a8a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "18px",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "1.3rem",
  fontWeight: 900,
  lineHeight: 1.15,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const badgeStyle = {
  display: "inline-block",
  background: "#f59e0b",
  color: "#111827",
  fontWeight: 800,
  fontSize: "0.72rem",
  letterSpacing: "0.04em",
  padding: "4px 10px",
  borderRadius: "999px",
  marginTop: "10px",
};

const cardTextStyle = {
  margin: "10px 0 18px",
  fontSize: "0.95rem",
  lineHeight: 1.5,
  color: "#475569",
};

const actionStyle = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#1e3a8a",
};