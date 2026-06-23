import Image from "next/image";

export default function SPVBranding() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end", // bottom-align logo with text
        gap: "10px",
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
        width={42}
        height={42}
        priority
        style={{
          width: "clamp(24px, 6vw, 42px)",
          height: "clamp(24px, 6vw, 42px)",
          objectFit: "contain",
          marginBottom: "2px",
        }}
      />
    </div>
  );
}