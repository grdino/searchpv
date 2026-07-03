"use client";


import { useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

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
          <Link href="/" onClick={() => setOpen(false)} style={menuLinkStyle}>
            Home
          </Link>

          <div>
            <div style={expandableRowStyle}>
              <Link
                href="/market-intelligence"
                onClick={() => setOpen(false)}
                style={expandableLinkStyle}
              >
                Market Intelligence
              </Link>

              <button
                type="button"
                onClick={() => setMarketOpen((value) => !value)}
                aria-label="Expand Market Intelligence menu"
                style={arrowButtonStyle}
              >
                {marketOpen ? "▾" : "▸"}
              </button>
            </div>

            {marketOpen && (
              <div style={subMenuStyle}>
                <Link
                  href="/market-intelligence/active-listings"
                  onClick={() => setOpen(false)}
                  style={subMenuLinkStyle}
                >
                  Active Listings
                </Link>
              </div>
            )}
          </div>

          <Link href="/about" onClick={() => setOpen(false)} style={menuLinkStyle}>
            About
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
  top: "36px",
  right: 0,
  zIndex: 1000,
  minWidth: "240px",
  padding: "10px",
  borderRadius: "14px",
  border: "1px solid #d7e3dc",
  background: "#ffffff",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
};

const menuLinkStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "10px",
  color: "#17211b",
  textDecoration: "none",
  fontWeight: 700,
};

const expandableRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderRadius: "10px",
};

const expandableLinkStyle: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  color: "#17211b",
  textDecoration: "none",
  fontWeight: 700,
};

const arrowButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "1rem",
  padding: "10px 12px",
  color: "#17211b",
};

const subMenuStyle: CSSProperties = {
  marginLeft: "14px",
  paddingLeft: "8px",
  borderLeft: "1px solid #d7e3dc",
};

const subMenuLinkStyle: CSSProperties = {
  display: "block",
  padding: "8px 12px",
  borderRadius: "10px",
  color: "#475569",
  textDecoration: "none",
  fontWeight: 600,
};