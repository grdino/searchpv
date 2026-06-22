import Link from "next/link";

type SearchParams = {
  zone?: string;
  area?: string;
  community?: string;
  market?: string;
  propertyType?: string;
  metric?: string;
  bedroom?: string;
  count?: string;
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const zone = params.zone ?? "Not specified";
  const area = params.area ?? "Not specified";
  const community = params.community ?? "this community";
  const market = formatMarket(params.market);
  const propertyType = formatPropertyType(params.propertyType);
  const bedroom = formatBedroom(params.bedroom);
  const count = params.count ?? "matching";

  const requestSummary = `${bedroom} ${market} ${propertyType} closed sales in ${community}`;

  const message = `Hi Gerry,

I would like the closed sales details for:

Zone: ${zone}
Area: ${area}
Community: ${community}
Market: ${market}
Property Type: ${propertyType}
Bedroom: ${bedroom}
Matching Sales: ${count}

Please send the information by email or WhatsApp.

Thank you.`;

  const mailtoHref = `mailto:gerry@ronmorgan.net?subject=${encodeURIComponent(
    `SearchPV Request - ${community} Closed Sales`
  )}&body=${encodeURIComponent(message)}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-slate-300 hover:underline">
            ← BACK TO SEARCHPV
          </Link>

          <p className="mt-8 text-sm uppercase tracking-widest text-slate-300">
            SearchPV Market Request
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Closed Sales Information Request
          </h1>

          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-900">
            <strong>Closed Sales Data Available Upon Request</strong>

            <div className="mt-1 text-sm">
              MLS rules do not allow closed sales to be displayed publicly
              through IDX. Complete the form below and I will send the requested
              sales information directly to you.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <div className="rounded-2xl bg-white p-6 shadow md:p-8">
          <h2 className="text-2xl font-bold">Request Summary</h2>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <strong>Zone:</strong> {zone}
            </p>
            <p>
              <strong>Area:</strong> {area}
            </p>
            <p>
              <strong>Community:</strong> {community}
            </p>
            <p>
              <strong>Request:</strong> {requestSummary}
            </p>
            <p>
              <strong>Matching sales:</strong> {count}
            </p>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              The information requested below is not publicly available through
              IDX and will be provided directly by Gerry Ray.
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            <div style={{ width: "100%" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                Your Name
                </label>
                <input
                autoFocus
                type="text"
                name="name"
                placeholder="Your name"
                style={{
                    marginTop: "6px",
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    padding: "12px 16px",
                }}
                />
            </div>

            <div style={{ width: "100%" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                Email or WhatsApp
                </label>
                <input
                type="text"
                name="contact"
                placeholder="Email or WhatsApp number"
                style={{
                    marginTop: "6px",
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    padding: "12px 16px",
                }}
                />
            </div>

            <div style={{ width: "100%" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                Message
                </label>
                <textarea
                name="message"
                rows={11}
                defaultValue={message}
                style={{
                    marginTop: "6px",
                    display: "block",
                    width: "100%",
                    maxWidth: "100%",
                    minHeight: "280px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    padding: "12px 16px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                }}
                />
            </div>

            <a
                href={mailtoHref}
                style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "12px",
                backgroundColor: "#020617",
                padding: "16px 24px",
                textAlign: "center",
                fontWeight: 700,
                color: "#ffffff",
                textDecoration: "none",
                }}
            >
                Send Request
            </a>
            </div>
        </div>
      </section>
    </main>
  );
}

function formatMarket(value?: string) {
  if (value === "pre_construction") return "pre-construction";
  if (value === "resale") return "resale";
  return "all market";
}

function formatPropertyType(value?: string) {
  if (value === "condos") return "condos";
  if (value === "houses") return "houses";
  return "properties";
}

function formatBedroom(value?: string) {
  if (value === "0br") return "studio";
  if (value === "1br") return "1-bedroom";
  if (value === "2br") return "2-bedroom";
  if (value === "3br_plus") return "3-bedroom+";
  return "all bedroom";
}