import type { AtlasPopularArea } from "@/lib/atlas/state/AtlasState";

export type AtlasDiscoverSceneConfig = {
  id: string;
  popularArea: AtlasPopularArea;
  image: string;
  copy: {
    title: string;
    lines: string[];
    detail: string;
  };
  camera: {
    zoom: number;
    pitch: number;
    bearing: number;
    curve: number;
    duration: number;
  };
  timing: {
    artworkDelay: number;
    selectionDelay: number;
    messageDelay: number;
    artworkFadeDelay: number;
    messageFadeDelay: number;
    sheetRevealDelay: number;
    nextSceneDelay: number | null;
  };
};

export const ATLAS_DISCOVER_SEQUENCE: AtlasDiscoverSceneConfig[] = [
  {
    id: "zona-romantica",
    popularArea: {
      footprintKey: "lifestyle-emiliano-zapata-zr",
      displayName: "Emiliano Zapata / Zona Romántica",
      boundaryKys: [437],
    },
    image: "/atlas/discover/zona-romantica.png",
    copy: {
      title: "Zona Romántica",
      lines: ["Beach days.", "Walkable streets.", "Late nights."],
      detail: "Easy walk to Los Muertos Beach.",
    },
    camera: {
      zoom: 13.5,
      pitch: 30,
      bearing: -8,
      curve: 1.55,
      duration: 5000,
    },
    timing: {
      artworkDelay: 1100,
      selectionDelay: 450,
      messageDelay: 1850,
      artworkFadeDelay: 4300,
      messageFadeDelay: 5350,
      sheetRevealDelay: 3850,
      nextSceneDelay: 8500,
    },
  },
  {
    id: "marina-vallarta",
    popularArea: {
      footprintKey: "lifestyle-marina-vallarta",
      displayName: "Marina Vallarta",
      boundaryKys: [349],
    },
    image: "/atlas/discover/marina-vallarta.png",
    copy: {
      title: "Marina Vallarta",
      lines: ["Yachts.", "Golf.", "Waterfront dining."],
      detail: "Stroll the marina promenade.",
    },
    camera: {
      zoom: 13.15,
      pitch: 38,
      bearing: 12,
      curve: 1.55,
      duration: 5000,
    },
    timing: {
      artworkDelay: 0,
      selectionDelay: 200,
      messageDelay: 700,
      artworkFadeDelay: 3800,
      messageFadeDelay: 4800,
      sheetRevealDelay: 3650,
      nextSceneDelay: 7300,
    },
  },
  {
    id: "nuevo-nayarit",
    popularArea: {
      footprintKey: "lifestyle-nuevo-nayarit",
      displayName: "Nuevo Vallarta / Nuevo Nayarit",
      boundaryKys: [626],
    },
    image: "/atlas/discover/nuevo-nayarit.png",
    copy: {
      title: "Nuevo Vallarta / Nuevo Nayarit",
      lines: ["Wide beaches.", "Golf.", "Room to breathe."],
      detail: "Marina, resorts, dining and beach clubs.",
    },
    camera: {
      zoom: 12.75,
      pitch: 36,
      bearing: -10,
      curve: 1.6,
      duration: 5200,
    },
    timing: {
      artworkDelay: 0,
      selectionDelay: 200,
      messageDelay: 700,
      artworkFadeDelay: 4000,
      messageFadeDelay: 5000,
      sheetRevealDelay: 3850,
      nextSceneDelay: 7600,
    },
  },

  {
    id: "conchas-chinas",

    popularArea: {
      footprintKey: "lifestyle-conchas-chinas",
      displayName: "Conchas Chinas",
      boundaryKys: [475],
    },

    image: "/atlas/discover/conchas-chinas.png",

    copy: {
      title: "Conchas Chinas",

      lines: [
        "Hidden coves.",
        "Hillside villas.",
        "Endless views.",
      ],

      detail: "Minutes from Zona Romántica. Privacy above the bay.",
    },

    camera: {
      zoom: 14.5,
      pitch: 42,
      bearing: -16,
      curve: 1.65,
      duration: 5800,
    },

    timing: {
      artworkDelay: 0,
      selectionDelay: 200,
      messageDelay: 700,
      artworkFadeDelay: 4400,
      messageFadeDelay: 5400,
      sheetRevealDelay: 4250,

      // Conchas Chinas is the final scene.
      nextSceneDelay: null,
    },
  },
];

export function getAtlasDiscoverScene(
  footprintKey: string | null | undefined,
) {
  if (!footprintKey) return null;

  return (
    ATLAS_DISCOVER_SEQUENCE.find(
      (scene) => scene.popularArea.footprintKey === footprintKey,
    ) ?? null
  );
}