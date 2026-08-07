import AtlasMap from "./AtlasMap";

export default function AtlasShell() {
  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <AtlasMap />
    </main>
  );
}