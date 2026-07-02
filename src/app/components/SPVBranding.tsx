import Image from "next/image";
import Link from "next/link";

export default function SPVBranding({
  rmpBadge = false,
}: {
  rmpBadge?: boolean;
}) {
  return (
    <div style={brandWrapStyle}>
      <Link href="/" style={brandLinkStyle}>
        <h1 style={titleStyle}>SearchPV</h1>
      </Link>

      <div style={logoRowStyle}>
        <Link href="/" aria-label="SearchPV Home" style={logoLinkStyle}>
          <Image
            src="/spv_logo_round.png"
            alt="SPV Logo"
            width={32}
            height={32}
            priority
            style={spvLogoStyle}
          />
        </Link>

        <a
          href="https://ronmorgan.net"
          aria-label="Ron Morgan Properties"
          style={rmpBadge ? rmpBadgeStyle : logoLinkStyle}
        >
          <Image
            src="/rmp_logo_white.png"
            alt="RMP Logo"
            width={32}
            height={40}
            priority
            style={rmpLogoStyle}
          />
        </a>
      </div>
    </div>
  );
}

const brandWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  minWidth: 0,
};

const brandLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 700,
  fontSize: "clamp(32px, 8vw, 56px)",
  lineHeight: 1,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const logoRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "5px",
  flexShrink: 0,
};

const logoLinkStyle: React.CSSProperties = {
  display: "flex",
  flexShrink: 0,
};

const rmpBadgeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#020617",
  borderRadius: "8px",
  padding: "2px 4px",
  flexShrink: 0,
};

const spvLogoStyle: React.CSSProperties = {
  width: "clamp(18px, 3vw, 30px)",
  height: "clamp(18px, 3vw, 30px)",
  objectFit: "contain",
  marginTop: "2px",
  cursor: "pointer",
  flexShrink: 0,
};

const rmpLogoStyle: React.CSSProperties = {
  width: "clamp(18px, 3vw, 30px)",
  height: "clamp(22px, 3.5vw, 36px)",
  objectFit: "contain",
  cursor: "pointer",
  flexShrink: 0,
};