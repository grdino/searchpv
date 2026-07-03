"use client";

import SPVBranding from "./SPVBranding";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
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
        <HamburgerMenu />
      </div>
    </header>
  );
}