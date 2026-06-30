import Header from "@/app/components/Header";

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
              Coming Soon
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(32px, 6vw, 56px)",
                lineHeight: 1.05,
              }}
            >
              SearchPV Reports
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                color: "#dbe4f0",
              }}
            >
              Interactive Puerto Vallarta market reports are being built,
              including active listings, price reductions, sold history,
              development summaries, and community-level analysis.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}