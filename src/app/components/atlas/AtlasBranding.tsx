"use client";

import HamburgerMenu from "@/app/components/HamburgerMenu";

export default function AtlasBranding() {
  return (
    <>
      {/* =====================================================
          SEARCHPV BRAND
          ===================================================== */}

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 20,
          zIndex: 40,

          display: "flex",
          alignItems: "center",
          gap: 7,

          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            fontSize: "clamp(25px, 5vw, 34px)",
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            color: "#0f172a",

            textShadow:
              "0 1px 4px rgba(255,255,255,0.9)",
          }}
        >
          SearchPV
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            width: 29,
            height: 29,

            borderRadius: "50%",

            background: "rgba(255,255,248,0.96)",

            color: "#0f172a",

            fontSize: 10,
            fontWeight: 900,

            boxShadow:
              "0 3px 10px rgba(15,23,42,0.16)",
          }}
        >
          SPV
        </div>
      </div>

      {/* =====================================================
          HAMBURGER
          ===================================================== */}

      <div
        style={{
          position: "absolute",
          top: 14,
          right: 18,
          zIndex: 50,

          pointerEvents: "auto",
        }}
      >
        <HamburgerMenu />
      </div>
    </>
  );
}