export default function AtlasBottomSheet() {
  return (
    <section
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "auto",
        background: "rgba(255,255,255,0.94)",
        borderRadius: "28px 28px 0 0",
        padding: "10px 20px 24px",
        boxShadow: "0 -10px 35px rgba(15,23,42,0.12)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 5,
          borderRadius: 999,
          background: "#cbd5e1",
          margin: "0 auto 14px",
        }}
      />

      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Explore
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 22,
            fontWeight: 650,
            color: "#0f172a",
          }}
        >
          Banderas Bay
        </div>
      </div>
    </section>
  );
}