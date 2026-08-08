import type { ReactNode } from "react";

type AtlasOverlayProps = {
  children: ReactNode;
};

export default function AtlasOverlay({
  children,
}: AtlasOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}