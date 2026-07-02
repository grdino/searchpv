import Image from "next/image";
import Link from "next/link";

export default function SPVBranding() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(32px, 8vw, 56px)",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          SearchPV
        </h1>
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "5px",
        }}
      >
        <Link
          href="/"
          aria-label="SearchPV Home"
          style={{ display: "flex" }}
        >
          <Image
            src="/spv_logo_round.png"
            alt="SPV Logo"
            width={32}
            height={32}
            priority
            style={{
              width: "clamp(20px, 4vw, 32px)",
              height: "clamp(20px, 4vw, 32px)",
              objectFit: "contain",
              marginTop: "2px",
              cursor: "pointer",
            }}
          />
        </Link>

        <a
          href="https://ronmorgan.net"
          aria-label="Ron Morgan Properties"
          style={{ display: "flex" }}
        >
          <Image
            src="/rmp_logo_white.png"
            alt="RMP Logo"
            width={32}
            height={40}
            priority
            style={{
              width: "clamp(25px, 4vw, 32px)",
              height: "clamp(25px, 4vw, 40px)",
              objectFit: "contain",
              marginTop: "2px",
              cursor: "pointer",
            }}
          />
        </a>
      </div>
    </div>
  );
}