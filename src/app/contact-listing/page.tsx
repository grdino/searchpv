import Link from "next/link";

type SearchParams = {
  mls?: string;
};

export default async function ContactListingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const mls = params.mls ?? "";

  const defaultMessage = mls
    ? `Hi SearchPV,\n\nI would like more information about MLS #${mls}.`
    : `Hi SearchPV,\n\nI would like more information about a property I saw on SearchPV.`;

  return (
    <main style={{ background: "#f4f7fb", minHeight: "100vh" }}>
      <section
        style={{
          background: "#020617",
          color: "white",
          padding: "48px 24px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              color: "#cbd5e1",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back to SearchPV
          </Link>

          <p
            style={{
              marginTop: "36px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: "13px",
              color: "#cbd5e1",
            }}
          >
            SearchPV Property Inquiry
          </p>

          <h1 style={{ fontSize: "34px", marginTop: "10px" }}>
            Contact SearchPV
          </h1>

          <p style={{ color: "#cbd5e1", maxWidth: "680px" }}>
            Ask about this listing, request more details, or schedule a follow-up.
          </p>
        </div>
      </section>

      <section style={{ padding: "40px 24px" }}>
        <form
          action="/api/contact-listing"
          method="POST"
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            background: "white",
            borderRadius: "18px",
            padding: "32px",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <input type="hidden" name="mls" value={mls} />

          {mls && (
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: "#f1f5f9",
                borderRadius: "12px",
                color: "#0f172a",
              }}
            >
              <strong>MLS #:</strong> {mls}
            </div>
          )}

          <label style={{ display: "block", fontWeight: 700 }}>
            Your Name:
          </label>
          <input
            name="name"
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Email or WhatsApp:</label>
          <input
            name="contact"
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Message:</label>
          <textarea
            name="message"
            required
            defaultValue={defaultMessage}
            rows={7}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <button
            type="submit"
            style={{
              marginTop: "22px",
              width: "100%",
              border: "none",
              borderRadius: "999px",
              padding: "14px 22px",
              background: "#0f172a",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Send Message
          </button>
        </form>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  marginTop: "18px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "8px",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "16px",
};