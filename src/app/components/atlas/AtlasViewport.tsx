import AtlasMap from "./AtlasMap";

export default function AtlasViewport({
  discoveryMode = false,
}: {
  discoveryMode?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <AtlasMap discoveryMode={discoveryMode} />
    </div>
  );
}
