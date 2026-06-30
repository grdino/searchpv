"use client";

import Link from "next/link";
import { useState } from "react";
import SPVBranding from "./SPVBranding";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Reports", href: "/reports" },
    { label: "About", href: "/about" },
  ];

  return (
    <header style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <SPVBranding />

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.45)",
            color: "inherit",
            borderRadius: "10px",
            padding: "8px 10px",
            fontSize: "1.4rem",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <nav
          style={{
            marginTop: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "inherit",
                textDecoration: "none",
                fontWeight: 600,
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}