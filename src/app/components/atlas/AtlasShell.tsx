import { Suspense } from "react";

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
        <Suspense fallback={null}>
          <AtlasDeepLink />
        </Suspense>

        <AtlasViewport discoveryMode={discoveryMode} />

        <AtlasOverlay>
          {discoveryMode ? <AtlasDiscoverScene /> : null}

          <AtlasBranding />
          {!discoveryMode ? <AtlasSearch /> : null}
          <AtlasBottomSheet discoveryMode={discoveryMode} />
        </AtlasOverlay>
      </AtlasStateProvider>
    </main>
  );
}
