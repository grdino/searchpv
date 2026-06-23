export default function MainText() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        Puerto Vallarta & Riviera Nayarit Markets
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#cbd5e1",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        Inventory, Sales Activity, Pricing & Listing Detail
      </div>
    </div>
  );
}