import AtlasViewport from "./AtlasViewport";
import AtlasOverlay from "./AtlasOverlay";
import AtlasSearch from "./AtlasSearch";
import AtlasBottomSheet from "./AtlasBottomSheet";

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
      <AtlasViewport />

      <AtlasOverlay>
        <AtlasSearch />
        <AtlasBottomSheet />
      </AtlasOverlay>
    </main>
  );
}