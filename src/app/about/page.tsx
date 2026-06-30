import Header from "@/app/components/Header";

export default function AboutPage() {
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
              About SearchPV
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                color: "#dbe4f0",
              }}
            >
              SearchPV is a Puerto Vallarta market intelligence project built
              around MLS data, neighborhood-level statistics, development
              snapshots, and real estate analytics.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}