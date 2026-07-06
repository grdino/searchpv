import Image from "next/image";
import Link from "next/link";

export default function SPVBranding() {
  return (
  <div style={brandStackStyle}>
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
      </div>
    </div>

    <a
      href="https://ronmorgan.net"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Ron Morgan Properties"
      style={{ display: "flex" }}
    >
      <Image
        src="/RMPLogoHorizontal.png"
        alt="Ron Morgan Properties"
        width={220}
        height={28}
        priority
        style={rmpHorizontalLogoStyle}
      />
    </a>
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

const spvLogoStyle: React.CSSProperties = {
  width: "clamp(18px, 3vw, 30px)",
  height: "clamp(18px, 3vw, 30px)",
  objectFit: "contain",
  marginTop: "2px",
  cursor: "pointer",
  flexShrink: 0,
};

const brandStackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const rmpHorizontalLogoStyle: React.CSSProperties = {
  height: "clamp(12px, 1.8vw, 18px)",
  width: "auto",
  marginTop: "2px",
};