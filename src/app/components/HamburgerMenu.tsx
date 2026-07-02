"use client";

import Link from "next/link";
import { useState } from "react";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

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
          <Link href="/" style={menuLinkStyle}>
            Home
          </Link>

          <Link href="/market-intelligence" style={menuLinkStyle}>
            Market Intelligence
          </Link>

          <Link href="/market-intelligence/active-listings" style={menuLinkStyle}>
            Active Listings
          </Link>
        </div>
      )}
    </div>
  );
}

const menuButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: "1.5rem",
  fontWeight: 800,
  cursor: "pointer",
  color: "#17211b",
  padding: "4px 6px",
};

const menuPanelStyle: React.CSSProperties = {
  position: "absolute",
  top: "36px",
  right: 0,
  zIndex: 50,
  minWidth: "220px",
  padding: "10px",
  borderRadius: "14px",
  border: "1px solid #d7e3dc",
  background: "#ffffff",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
};

const menuLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "10px",
  color: "#17211b",
  textDecoration: "none",
  fontWeight: 700,
};