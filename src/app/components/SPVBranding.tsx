import Image from "next/image";
import Link from "next/link";

export default function SPVBranding({
  rmpBadge = false,
}: {
  rmpBadge?: boolean;
}) {
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
              width: "clamp(18px, 3vw, 30px)",
              height: "clamp(18px, 3vw, 30px)",
              objectFit: "contain",
              marginTop: "2px",
              cursor: "pointer",
            }}
          />
        </Link>

        <a
          href="https://ronmorgan.net"
          aria-label="Ron Morgan Properties"
          style={
            rmpBadge
              ? {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#020617",
                  borderRadius: "8px",
                  padding: "2px 4px",
                }
              : {
                  display: "flex",
                }
          }
        >
          <Image
            src="/rmp_logo_white.png"
            alt="RMP Logo"
            width={32}
            height={40}
            priority
            style={{
              width: "clamp(18px, 3vw, 30px)",
              height: "clamp(22px, 3.5vw, 36px)",
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