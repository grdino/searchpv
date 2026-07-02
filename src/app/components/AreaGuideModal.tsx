"use client";

import { useEffect, useState } from "react";

type AreaGuide = {
  area: string;
  alsoKnownAs?: string;
  communities: string[];
};

const AREA_GUIDE: AreaGuide[] = [
  {
    area: "Centro South",
    alsoKnownAs: "Romantic Zone / Old Town area",
    communities: [
      "Emiliano Zapata — Romantic Zone",
      "Alta Vista",
      "Amapas",
      "Olas Altas",
      "El Caloso",
    ],
  },
  {
    area: "Centro North",
    alsoKnownAs: "Downtown / Malecón area",
    communities: [
      "Centro",
      "El Cerro",
      "Gringo Gulch",
      "5 de Diciembre",
      "Malecón area",
    ],
  },
    {
    area: "Francisco Villa West",
      communities: [
      "Versalles",
      "Fluvial",
    ],
  },
  {
    area: "Hotel Zone",
    communities: [
      "Hotel Zone North",
      "Hotel Zone South",
      "Las Glorias",
    ],
  },
  {
    area: "Marina Vallarta",
    communities: ["Marina Vallarta"],
  },
  {
    area: "South Shore",
    communities: [
      "Conchas Chinas",
      "Punta Negra",
      "Garza Blanca",
      "Mismaloya",
      "Boca de Tomatlán",
    ],
  },
  {
    area: "Nuevo Vallarta / Nuevo Nayarit",
    communities: [
      "Paradise Village",
      "El Tigre",
      "Canal",
      "Flamingos",
      "Nuevo Vallarta West",
    ],
  },
  {
    area: "Bucerías",
    communities: [
      "Zona Dorada",
      "Bucerías Centro",
      "Bucerías North",
      "Bucerías South",
    ],
  },
];

export default function AreaGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-sky-400 hover:text-sky-300"
        aria-label="Open area guide"
      >
        🗺️ Guide
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Puerto Vallarta Area Guide
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  MLS area names are not always intuitive. This guide shows the
                  communities and familiar local names inside each area.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:border-slate-400 hover:text-white"
                aria-label="Close area guide"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {AREA_GUIDE.map((item) => (
                <section
                  key={item.area}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                    {item.area}
                  </h3>

                  {item.alsoKnownAs && (
                    <p className="mt-1 text-xs text-slate-400">
                      Commonly searched as: {item.alsoKnownAs}
                    </p>
                  )}

                  <ul className="mt-3 space-y-1 text-sm text-slate-200">
                    {item.communities.map((community) => (
                      <li key={community}>• {community}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}