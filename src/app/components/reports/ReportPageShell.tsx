import SPVBranding from "@/app/components/SPVBranding";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import ReportExportButtons from "@/app/components/ReportExportButtons";

export default function ReportPageShell({
  reportKey,
  title,
  description,
  dataCurrentAsOf,
  reportGeneratedAt,
  filterSummary = [],
  children,
}: {
  reportKey: string;
  title: string;
  description: string;
  dataCurrentAsOf: string;
  reportGeneratedAt: string;
  filterSummary?: string[];
  children: React.ReactNode;
}) {
  return (
    <main style={pageStyle}>
      <div className="no-print report-topbar" style={{ marginBottom: "24px" }}>
        <div style={topbarStyle}>
          <SPVBranding />
          <HamburgerMenu />
        </div>

        <div className="report-topbar-actions" style={topbarActionsStyle}>
          <ReportExportButtons reportKey={reportKey} />
        </div>
      </div>

      <section style={{ marginBottom: "24px" }}>
        <p style={eyebrowStyle}>SearchPV Report</p>
        <h1 style={titleStyle}>{title}</h1>
        <p style={subtitleStyle}>{description}</p>

        {filterSummary.length > 0 && (
          <div style={filterSummaryStyle}>
            {filterSummary.map((item) => (
              <span key={item} style={filterPillStyle}>
                {item}
              </span>
            ))}
          </div>
        )}

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

      {children}

      <style>{`
        .report-table-shell {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 700px) {
          main {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .report-topbar-actions {
            width: 100% !important;
            justify-content: stretch !important;
          }

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

const pageStyle = {
  width: "100%",
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "28px 12px 60px",
  color: "#17211b",
} as const;

const topbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
  gap: "12px",
} as const;

const topbarActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "12px",
  width: "100%",
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