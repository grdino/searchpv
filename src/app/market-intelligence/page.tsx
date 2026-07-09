import Header from "@/app/components/Header";
import {
  BadgeDollarSign,
  Building2,
  ChartLine,
  ClipboardList,
  Clock3,
  Map,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Active Listings",
    description: "Current inventory with pricing, DOM, and listing details.",
    href: "/market-intelligence/active-listings",
    Icon: ClipboardList,
    inDevelopment: true,
  },
  {
    title: "Pending Sales",
    description: "Listings currently under contract across selected markets.",
    href: "/market-intelligence/pending-sales",
    Icon: Clock3,
    inDevelopment: true,
  },
  {
    title: "Closed Sales",
    description: "Historical sales activity, sold pricing, and market results.",
    href: "/market-intelligence/closed-sales",
    Icon: BadgeDollarSign,
    inDevelopment: false,
  },
  {
    title: "Price Reductions",
    description: "Track price changes, reductions, and listing adjustments.",
    href: "/market-intelligence/price-reductions",
    Icon: TrendingDown,
    inDevelopment: true,
  },
  {
    title: "Community Summary",
    description: "Market snapshot for individual Puerto Vallarta communities.",
    href: "/market-intelligence/community-summary",
    Icon: Map,
    inDevelopment: true,
  },
  {
    title: "Development Summary",
    description: "Inventory, pricing, and sales activity by development.",
    href: "/market-intelligence/development-summary",
    Icon: Building2,
    inDevelopment: true,
  },
  {
    title: "Market Trends",
    description: "Inventory, pricing, sales, and activity over time.",
    href: "/market-intelligence/market-trends",
    Icon: ChartLine,
    inDevelopment: true,
  },
];

export default function ReportsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
      }}
    >
      <section
        style={{
          background: "#020817",
          color: "white",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <Header />

          <div style={{ marginTop: "40px", maxWidth: "760px" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "0.85rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.75,
              }}
            >
              Analyze the Puerto Vallarta real estate market.
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(32px, 6vw, 56px)",
                lineHeight: 1.05,
              }}
            >
              Market Intelligence
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                color: "#dbe4f0",
              }}
            >
              Analyze Listings ┃ Market Updates ┃ Market Trends
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px 64px",
        }}
      >
        <div style={{ marginBottom: "22px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            Analysis Tools
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(24px, 4vw, 34px)",
              color: "#0f172a",
            }}
          >
            Choose a Market Intelligence Tool
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          {reports.map(({ title, description, href, Icon, inDevelopment }) => (
            <Link
              key={title}
              href={href}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <article
                style={{
                  minHeight: "180px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "22px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    background: "#eaf2ff",
                    color: "#1e3a8a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.3rem",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {title}
                </h3>

                {inDevelopment && (
                  <span
                    style={{
                      display: "inline-block",
                      background: "#f59e0b",
                      color: "#111827",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      letterSpacing: "0.04em",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      marginTop: "10px",
                    }}
                  >
                    🚧 IN DEVELOPMENT
                  </span>
                )}

                <p
                  style={{
                    margin: "10px 0 18px",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    color: "#475569",
                  }}
                >
                  {description}
                </p>

                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#1e3a8a",
                  }}
                >
                  Explore →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}