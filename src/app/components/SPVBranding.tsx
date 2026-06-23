import Image from "next/image";

export default function SPVBranding() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: "clamp(32px, 8vw, 56px)",
          lineHeight: 1,
        }}
      >
        SearchPV
      </h1>

      <Image
        src="/spv_logo.png"
        alt="SearchPV Logo"
        width={32}
        height={32}
        priority
        style={{
          width: "clamp(20px, 4vw, 32px)",
          height: "clamp(20px, 4vw, 32px)",
          objectFit: "contain",
          marginTop: "2px",
        }}
      />
    </div>
  );
}