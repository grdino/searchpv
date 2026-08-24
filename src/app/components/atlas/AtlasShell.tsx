import AtlasViewport from "./AtlasViewport";
import AtlasOverlay from "./AtlasOverlay";
import AtlasSearch from "./AtlasSearch";
import AtlasBottomSheet from "./AtlasBottomSheet";
import AtlasDeepLink from "./AtlasDeepLink";

import {
  AtlasStateProvider,
} from "@/lib/atlas/state/AtlasState";

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
      <AtlasStateProvider>
        <AtlasDeepLink />

        <AtlasViewport />

        <AtlasOverlay>
          <AtlasSearch />
          <AtlasBottomSheet />
        </AtlasOverlay>
      </AtlasStateProvider>
    </main>
  );
}