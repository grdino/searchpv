import Link from "next/link";

export default function ThanksPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          background: "white",
          padding: "36px",
          borderRadius: "18px",
          textAlign: "center",
        }}
      >
        <h1>Message Sent</h1>
        <p>Thanks. An agent will follow up with you shortly.</p>
        <Link href="/">Back to SearchPV</Link>
      </div>
    </main>
  );
}