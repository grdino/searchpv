import Header from "@/app/components/Header";
import Link from "next/link";

const REPORT_TITLES: Record<string, string> = {
  "active-listings-report": "Active Listings",
  "pending-sales-report": "Pending Sales Report",
  "closed-sales-report": "Closed Sales Report",
};

function formatReportTitle(slug: string) {
  return (
    REPORT_TITLES[slug] ??
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export default async function ReportComingSoonPage({
  params,
}: {
  params: Promise<{ reportSlug: string }>;
}) {
  const { reportSlug } = await params;
  const reportTitle = formatReportTitle(reportSlug);

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <section style={{ background: "#020817", color: "white" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <Header />

          <div
            style={{
              marginTop: "56px",
              textAlign: "center",
              maxWidth: "700px",
              marginInline: "auto",
              paddingBottom: "80px",
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#7dd3fc",
                marginBottom: "16px",
              }}
            >
              SearchPV Reporting
            </p>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: "24px",
              }}
            >
              {reportTitle}
            </h1>

            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.7,
                color: "#cbd5e1",
                marginBottom: "40px",
              }}
            >
              This report is currently in development and will be available
              soon.
            </p>

            <Link
              href="/reports"
              style={{
                display: "inline-block",
                background: "#0ea5e9",
                color: "white",
                padding: "14px 26px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Back to Reports
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}