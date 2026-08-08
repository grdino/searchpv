export default function AtlasSearch() {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 18,
          padding: "14px 16px",
          boxShadow: "0 8px 30px rgba(15,23,42,0.14)",
          backdropFilter: "blur(14px)",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        🔍 Search places, communities, developments…
      </div>
    </div>
  );
}