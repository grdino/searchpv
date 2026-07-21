"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const marketIntelligenceLinks = [
  {
    label: "Active Listings",
    href: "/market-intelligence/active-listings",
    exists: true,
  },
  {
    label: "Pending Sales",
    href: "/market-intelligence/pending-sales",
    exists: false,
  },
  {
    label: "Closed Sales",
    href: "/market-intelligence/closed-sales",
    exists: true,
  },
  {
    label: "Price Changes",
    href: "/market-intelligence/price-changes",
    exists: false,
  },
  {
    label: "New Listings",
    href: "/market-intelligence/new-listings",
    exists: false,
  },
];

const reportLinks = [
  {
    label: "Active Listings Report",
    href: "/reports/active-listings-report",
    exists: true,
  },
  {
    label: "Pending Sales Report",
    href: "/reports/pending-sales-report",
    exists: false,
  },
  {
    label: "Closed Sales Report",
    href: "/reports/closed-sales-report",
    exists: false,
  },
  {
    label: "Price Changes Report",
    href: "/reports/price-changes-report",
    exists: false,
  },
  {
    label: "New Listings Report",
    href: "/reports/new-listings-report",
    exists: false,
  },
];

type MenuSection =
  | "market-intelligence"
  | "reports"
  | null;

function getSectionFromPathname(
  pathname: string
): MenuSection {
  if (pathname.startsWith("/market-intelligence")) {
    return "market-intelligence";
  }

  if (pathname.startsWith("/reports")) {
    return "reports";
  }

  return null;
}

export default function HamburgerMenu() {
  const pathname = usePathname();
  const activeSection = getSectionFromPathname(pathname);

  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] =
    useState<MenuSection>(activeSection);

  useEffect(() => {
    if (open) {
      setExpandedSection(activeSection);
    }
  }, [activeSection, open]);

  const closeMenu = () => {
    setOpen(false);
  };

  const toggleMenu = () => {
    setOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        setExpandedSection(activeSection);
      }

      return nextOpen;
    });
  };

  const toggleSection = (section: MenuSection) => {
    setExpandedSection((current) =>
      current === section ? null : section
    );
  };

  const marketIntelligenceOpen =
    expandedSection === "market-intelligence";

  const reportsOpen =
    expandedSection === "reports";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={menuButtonStyle}
      >
        {open ? "×" : "☰"}
      </button>

      {open && (
        <div style={menuPanelStyle}>
          <Link
            href="/"
            onClick={closeMenu}
            style={menuLinkStyle}
          >
            Home
          </Link>

          <Link
            href="/#market-explorer"
            onClick={closeMenu}
            style={menuLinkStyle}
          >
            Explore Market
          </Link>

          <div style={sectionStyle}>
            <button
              type="button"
              onClick={() =>
                toggleSection("market-intelligence")
              }
              aria-expanded={marketIntelligenceOpen}
              style={{
                ...sectionButtonStyle,
                ...(activeSection ===
                "market-intelligence"
                  ? activeSectionButtonStyle
                  : {}),
              }}
            >
              <span>Market Intelligence</span>

              <span style={arrowStyle}>
                {marketIntelligenceOpen ? "−" : "+"}
              </span>
            </button>

            {marketIntelligenceOpen && (
              <div style={subMenuStyle}>
                <Link
                  href="/market-intelligence"
                  onClick={closeMenu}
                  style={{
                    ...sectionOverviewLinkStyle,
                    ...(pathname ===
                    "/market-intelligence"
                      ? activeLinkStyle
                      : {}),
                  }}
                >
                  Market Intelligence Overview
                </Link>

                {marketIntelligenceLinks.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={
                        isActive ? "page" : undefined
                      }
                      style={{
                        ...subMenuLinkStyle,
                        color: item.exists
                          ? "#15803d"
                          : "#ca8a04",
                        ...(isActive
                          ? activeLinkStyle
                          : {}),
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <button
              type="button"
              onClick={() =>
                toggleSection("reports")
              }
              aria-expanded={reportsOpen}
              style={{
                ...sectionButtonStyle,
                ...(activeSection === "reports"
                  ? activeSectionButtonStyle
                  : {}),
              }}
            >
              <span>Reports</span>

              <span style={arrowStyle}>
                {reportsOpen ? "−" : "+"}
              </span>
            </button>

            {reportsOpen && (
              <div style={subMenuStyle}>
                <Link
                  href="/reports"
                  onClick={closeMenu}
                  style={{
                    ...sectionOverviewLinkStyle,
                    ...(pathname === "/reports"
                      ? activeLinkStyle
                      : {}),
                  }}
                >
                  Reports Overview
                </Link>

                {reportLinks.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={
                        isActive ? "page" : undefined
                      }
                      style={{
                        ...subMenuLinkStyle,
                        color: item.exists
                          ? "#15803d"
                          : "#ca8a04",
                        ...(isActive
                          ? activeLinkStyle
                          : {}),
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/about"
            onClick={closeMenu}
            style={menuLinkStyle}
          >
            About SearchPV
          </Link>

          <Link
            href="/contact"
            onClick={closeMenu}
            style={menuLinkStyle}
          >
            Contact
          </Link>

          <Link
            href="/office"
            onClick={closeMenu}
            style={menuLinkStyle}
          >
            🔒 Office
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
  marginTop: "6px",
  marginBottom: "6px",
};

const menuLinkStyle: CSSProperties = {
  display: "block",
  padding: "10px 0",
  color: "#1e40af",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "1.12rem",
};

const sectionButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "10px 0",
  border: 0,
  background: "transparent",
  color: "#1e40af",
  fontWeight: 900,
  fontSize: "1.12rem",
  textAlign: "left",
  cursor: "pointer",
};

const activeSectionButtonStyle: CSSProperties = {
  color: "#1d4ed8",
};

const arrowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#1e40af",
  fontSize: "1.15rem",
  lineHeight: 1,
};

const subMenuStyle: CSSProperties = {
  marginTop: "2px",
  marginBottom: "8px",
  marginLeft: "20px",
  paddingLeft: "12px",
  borderLeft: "2px solid #dbeafe",
};

const sectionOverviewLinkStyle: CSSProperties = {
  display: "block",
  padding: "6px 0",
  color: "#1e40af",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "0.95rem",
};

const subMenuLinkStyle: CSSProperties = {
  display: "block",
  padding: "6px 0",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1rem",
};

const activeLinkStyle: CSSProperties = {
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  fontWeight: 900,
};