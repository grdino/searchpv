import AtlasViewport from "./AtlasViewport";
import AtlasOverlay from "./AtlasOverlay";
import AtlasSearch from "./AtlasSearch";
import AtlasBottomSheet from "./AtlasBottomSheet";
import AtlasDeepLink from "./AtlasDeepLink";
import AtlasBranding from "./AtlasBranding";
import AtlasDiscoverScene from "./AtlasDiscoverScene";

import { AtlasStateProvider } from "@/lib/atlas/state/AtlasState";

export default function AtlasShell({
  discoveryMode = false,
}: {
  discoveryMode?: boolean;
}) {
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
          {discoveryMode ? <AtlasDiscoverScene /> : null}

          <AtlasBranding />
          {!discoveryMode ? <AtlasSearch /> : null}
          <AtlasBottomSheet />
        </AtlasOverlay>
      </AtlasStateProvider>
    </main>
  );
}
