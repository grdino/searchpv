"use client";

import Link from "next/link";
import { Compass, Map, X } from "lucide-react";
import { useState } from "react";

type Tier = "more" | "some" | "limited";

type BearingArea = {
  name: string;
  areaName: string | null;
  zoneName: string | null;
  totalChoices: number;
  tier: Tier;
  longitude: number | null;
  latitude: number | null;
};

const TIER = {
  more: { label: "Most options", dot: "bg-emerald-500", ring: "ring-emerald-200", fill: "#10b981" },
  some: { label: "Some options", dot: "bg-amber-400", ring: "ring-amber-200", fill: "#f59e0b" },
  limited: { label: "Limited, but possible", dot: "bg-blue-500", ring: "ring-blue-200", fill: "#3b82f6" },
} as const;

export default function BearingsDialog({ areas }: { areas: BearingArea[] }) {
  const [open, setOpen] = useState(false);
  const plotted = areas.filter((area) => area.longitude !== null && area.latitude !== null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black text-sky-800 transition hover:bg-sky-100">
        <Compass size={16} /> Show me where
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bearings-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] bg-white shadow-2xl sm:max-w-5xl sm:rounded-[30px]">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">SearchPV orientation</p>
                <h2 id="bearings-title" className="mt-1 text-2xl font-black tracking-[-0.03em]">Where are these areas?</h2>
                <p className="mt-1 text-sm text-slate-600">See where the communities surfaced by this search sit around the Bay.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close"><X size={22} /></button>
            </div>

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <BayDiagram areas={plotted} />
                <p className="mt-2 text-xs leading-5 text-slate-500">Approximate orientation only — not geographic boundaries. Marker positions use SearchPV representative geography points.</p>
              </div>

              <div className="space-y-5">
                {(["more", "some", "limited"] as Tier[]).map((tier) => {
                  const rows = areas.filter((area) => area.tier === tier);
                  if (!rows.length) return null;
                  return <div key={tier}>
                    <h3 className="flex items-center gap-2 text-sm font-black"><span className={`h-3 w-3 rounded-full ring-4 ${TIER[tier].dot} ${TIER[tier].ring}`} />{TIER[tier].label}</h3>
                    <div className="mt-2 grid gap-1.5">
                      {rows.map((area) => (
                        <div key={`${tier}-${area.name}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate font-bold" title={area.name}>{area.name}</span>
                          <span className="shrink-0 text-xs font-bold text-slate-500">{area.totalChoices} {area.totalChoices === 1 ? "option" : "options"}</span>
                          <Link
                            href={`/atlas?q=${encodeURIComponent(area.name)}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                            aria-label={`Open ${area.name} in Atlas`}
                            title={`Find ${area.name} in Atlas`}
                          >
                            <Map size={12} /> Atlas ↗
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>;
                })}

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BayDiagram({ areas }: { areas: BearingArea[] }) {
  // One geographic projection for coastline, reference anchors, and SearchPV markers.
  const west = -105.56, east = -105.08, south = 20.48, north = 20.86;
  const left = 26, right = 494, top = 28, bottom = 562;
  const x = (lng: number) => left + ((lng - west) / (east - west)) * (right - left);
  const y = (lat: number) => bottom - ((lat - south) / (north - south)) * (bottom - top);

  const coast: Array<[number, number]> = [
    [-105.55, 20.79], [-105.47, 20.76], [-105.40, 20.75], [-105.34, 20.74],
    [-105.30, 20.70], [-105.27, 20.67], [-105.25, 20.65], [-105.235, 20.62],
    [-105.235, 20.60], [-105.25, 20.58], [-105.28, 20.55], [-105.29, 20.53], [-105.30, 20.49],
  ];
  const coastPath = coast.map(([lng, lat], i) => `${i === 0 ? "M" : "L"} ${x(lng).toFixed(1)} ${y(lat).toFixed(1)}`).join(" ");
  const landPath = `${coastPath} L ${right} ${bottom} L ${right} ${top} L ${left} ${top} Z`;

  // Quiet orientation anchors. Punta de Mita is intentionally placed just landward
  // of the simplified shoreline; these anchors are visual references, not result data.
  const anchors = [
    { name: "Punta de Mita", lng: -105.505, lat: 20.782, dx: 7, dy: -7 },
    { name: "Airport", lng: -105.246, lat: 20.681, dx: 10, dy: -8 },
    { name: "Puerto Vallarta", lng: -105.230, lat: 20.635, dx: 10, dy: -8 },
    { name: "South Shore", lng: -105.255, lat: 20.548, dx: 10, dy: 16 },
  ];

  // Label the most useful result markers directly. V8 labels the visible "Most"
  // communities first, then adds a few Some/Limited markers only when there is room.
  // A simple collision pass keeps labels readable without changing actual marker positions.
  type LabelBox = { x: number; y: number; w: number; h: number };
  const boxes: LabelBox[] = [];
  const overlaps = (a: LabelBox, b: LabelBox) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  const tierOrder: Record<string, number> = {
  more: 0,
  some: 1,
  limited: 2,
};

const labelCandidates = [...areas]
  .sort((a, b) => {
    const tierDifference = tierOrder[a.tier] - tierOrder[b.tier];

    if (tierDifference !== 0) {
      return tierDifference;
    }

    return b.totalChoices - a.totalChoices;
  })
  .slice(0, 12);

  const labels = labelCandidates.flatMap((area) => {
    const cx = x(area.longitude!); const cy = y(area.latitude!);
    const width = Math.min(128, Math.max(54, area.name.length * 6.1 + 14));
    const height = 20;
    const attempts = [
      { bx: cx + 12, by: cy - 25, tx: cx + 18, ty: cy - 11 },
      { bx: cx + 12, by: cy + 7, tx: cx + 18, ty: cy + 21 },
      { bx: cx - width - 12, by: cy - 25, tx: cx - width - 6, ty: cy - 11 },
      { bx: cx - width - 12, by: cy + 7, tx: cx - width - 6, ty: cy + 21 },
    ];
    for (const a of attempts) {
      const box = { x: a.bx, y: a.by, w: width, h: height };
      if (box.x < 5 || box.x + box.w > 515 || box.y < 5 || box.y + box.h > 585) continue;
      if (boxes.some((other) => overlaps(box, other))) continue;
      boxes.push(box);
      return [{ area, cx, cy, ...a, width }];
    }
    return [];
  });

  return (
    <div className="overflow-hidden rounded-[26px] border border-sky-100 bg-[linear-gradient(145deg,#e9f8fb,#f8fcfb)]">
      <svg viewBox="0 0 520 590" className="block h-auto w-full" aria-label="Simplified Banderas Bay orientation diagram">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dff5f8"/><stop offset="1" stopColor="#c8ebf1"/></linearGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f7f4e9"/><stop offset="1" stopColor="#e9f3df"/></linearGradient>
        </defs>
        <rect width="520" height="590" fill="url(#sea)"/>
        <path d={landPath} fill="url(#land)" opacity=".98"/>
        <path d={coastPath} fill="none" stroke="#65a9b4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="68" y="345" fill="#5f9eaa" fontSize="22" fontWeight="700" opacity=".52" transform="rotate(-15 68 345)">Banderas Bay</text>

        {anchors.map((anchor) => {
          const cx = x(anchor.lng), cy = y(anchor.lat);
          return <g key={anchor.name} opacity=".48">
            <circle cx={cx} cy={cy} r="2.2" fill="#64748b"/>
            <text x={cx + anchor.dx} y={cy + anchor.dy} fill="#64748b" fontSize="8.5" fontWeight="700">{anchor.name}</text>
          </g>;
        })}

        {areas.map((area, index) => {
          const cx = x(area.longitude!); const cy = y(area.latitude!);
          const inFrame = cx >= left - 8 && cx <= right + 8 && cy >= top - 8 && cy <= bottom + 8;
          if (!inFrame) return null;
          return <g key={`${area.tier}-${area.name}-${index}`}>
            <circle cx={cx} cy={cy} r="10" fill="white" opacity=".94"/>
            <circle cx={cx} cy={cy} r="6" fill={TIER[area.tier].fill} stroke="white" strokeWidth="2"/>
            <title>{area.name} — {area.totalChoices} {area.totalChoices === 1 ? "option" : "options"}</title>
          </g>;
        })}

        {labels.map(({ area, cx, cy, bx, by, tx, ty, width }) => {
          const lineX = bx > cx ? bx : bx + width;
          const lineY = by + 10;
          return <g key={`label-${area.tier}-${area.name}`}>
            <path d={`M ${cx} ${cy} L ${lineX} ${lineY}`} stroke={TIER[area.tier].fill} strokeWidth="1.4" opacity=".72"/>
            <rect x={bx} y={by} width={width} height="20" rx="9" fill="white" opacity=".94" stroke={TIER[area.tier].fill} strokeWidth="1"/>
            <text x={tx} y={ty} fill="#0f172a" fontSize="9" fontWeight="800">{area.name.length > 19 ? `${area.name.slice(0, 18)}…` : area.name}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}
