export default function MainText() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 800,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        Puerto Vallarta & Riviera Nayarit Markets
      </div>

      <div
        style={{
          fontSize: "clamp(14px, 2vw, 18px)",
          fontWeight: 500,
          lineHeight: 1.2,
          color: "#cbd5e1",
          whiteSpace: "nowrap",
        }}
      >
        Inventory, Sales Activity, Pricing & Listing Detail
      </div>
    </div>
  );
}