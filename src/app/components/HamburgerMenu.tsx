"use client";

import { useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";

const marketIntelligenceLinks = [
  { label: "Active Listings", href: "/market-intelligence/active-listings", exists: false },
  { label: "Pending Sales", href: "/market-intelligence/pending-sales", exists: false },
  { label: "Closed Sales", href: "/market-intelligence/closed-sales", exists: true },
  { label: "Price Changes", href: "/market-intelligence/price-changes", exists: false },
  { label: "New Listings", href: "/market-intelligence/new-listings", exists: false },
];

const reportLinks = [
  { label: "Active Listings Report", href: "/reports/active-listings-report", exists: true,},
  { label: "Pending Sales Report", href: "/reports/pending-sales-report", exists: false,},
  { label: "Closed Sales Report", href: "/reports/closed-sales-report", exists: false, },
  { label: "Price Changes Report", href: "/reports/price-changes-report", exists: false,},
  { label: "New Listings Report", href: "/reports/new-listings-report", exists: false,},
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open menu"
        style={menuButtonStyle}
      >
        ☰
      </button>

      {open && (
        <div style={menuPanelStyle}>
          <Link href="/#market-explorer" onClick={closeMenu} style={menuLinkStyle}>
            Explore Market
          </Link>

          <div style={sectionStyle}>
            <Link href="/market-intelligence" onClick={closeMenu} style={menuLinkStyle}>
              Market Intelligence
            </Link>

            <div style={subMenuStyle}>
              {marketIntelligenceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  style={{
                    ...subMenuLinkStyle,
                    color: item.exists ? "#15803d" : "#ca8a04",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <Link href="/reports" onClick={closeMenu} style={menuLinkStyle}>
              Reports
            </Link>

            <div style={subMenuStyle}>
              {reportLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  style={{
                    ...subMenuLinkStyle,
                    color: item.exists ? "#15803d" : "#ca8a04",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/about" onClick={closeMenu} style={menuLinkStyle}>
            About SearchPV
          </Link>
        </div>
      )}
    </div>
  );
}

const menuButtonStyle: CSSProperties = {
  border: "2px solid #00E5FF",
  borderRadius: "50%",
  width: "48px",
  height: "48px",
  background: "#111827",
  fontSize: "1.8rem",
  fontWeight: 900,
  cursor: "pointer",
  color: "#00E5FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 12px rgba(0,229,255,.7)",
};

const menuPanelStyle: CSSProperties = {
  position: "absolute",
  top: "58px",
  right: 0,
  zIndex: 1000,
  minWidth: "300px",
  padding: "18px",
  borderRadius: "16px",
  border: "1px solid rgba(0,229,255,.35)",
  background: "#ffffff",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
};

const sectionStyle: CSSProperties = {
  marginTop: "12px",
  marginBottom: "18px",
};

const menuLinkStyle: CSSProperties = {
  display: "block",
  padding: "10px 0",
  color: "#1e40af",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "1.12rem",
};

const subMenuStyle: CSSProperties = {
  marginTop: "2px",
  marginLeft: "28px",
};

const subMenuLinkStyle: CSSProperties = {
  display: "block",
  padding: "6px 0",
  color: "#17211b",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1rem",
};