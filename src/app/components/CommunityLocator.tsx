type Props = {
  name: string;
  longitude: number;
  latitude: number;
};

export default function CommunityLocator({ name, longitude, latitude }: Props) {
  const west = -105.56, east = -105.08, south = 20.48, north = 20.86;
  const left = 26, right = 494, top = 28, bottom = 262;
  const x = (lng: number) => left + ((lng - west) / (east - west)) * (right - left);
  const y = (lat: number) => bottom - ((lat - south) / (north - south)) * (bottom - top);
  const coast: Array<[number, number]> = [
    [-105.55, 20.79], [-105.47, 20.76], [-105.40, 20.75], [-105.34, 20.74],
    [-105.30, 20.70], [-105.27, 20.67], [-105.25, 20.65], [-105.235, 20.62],
    [-105.235, 20.60], [-105.25, 20.58], [-105.28, 20.55], [-105.29, 20.53], [-105.30, 20.49],
  ];
  const coastPath = coast.map(([lng, lat], i) => `${i === 0 ? "M" : "L"} ${x(lng).toFixed(1)} ${y(lat).toFixed(1)}`).join(" ");
  const landPath = `${coastPath} L ${right} ${bottom} L ${right} ${top} L ${left} ${top} Z`;
  const cx = Math.max(left + 8, Math.min(right - 8, x(longitude)));
  const cy = Math.max(top + 8, Math.min(bottom - 8, y(latitude)));
  const labelOnLeft = cx > 325;
  const labelX = labelOnLeft ? cx - 14 : cx + 14;
  const anchor = labelOnLeft ? "end" : "start";

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-[linear-gradient(145deg,#e9f8fb,#f8fcfb)]">
      <svg viewBox="0 0 520 290" className="block h-auto w-full" role="img" aria-label={`Banderas Bay locator showing ${name}`}>
        <path d={landPath} fill="#f8fafc" />
        <path d={coastPath} fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        <text x="40" y="48" fontSize="11" fontWeight="700" fill="#94a3b8">BANDERAS BAY</text>
        <text x={x(-105.505)} y={y(20.782) - 8} fontSize="9" fontWeight="700" fill="#a1a1aa">Punta de Mita</text>
        <text x={x(-105.246) + 7} y={y(20.681) - 6} fontSize="9" fontWeight="700" fill="#a1a1aa">Airport</text>
        <text x={x(-105.218) + 8} y={y(20.606) + 15} fontSize="9" fontWeight="700" fill="#a1a1aa">Puerto Vallarta</text>
        <circle cx={cx} cy={cy} r="12" fill="#0f766e" fillOpacity="0.14" />
        <circle cx={cx} cy={cy} r="6" fill="#0f766e" stroke="white" strokeWidth="2.5" />
        <line x1={cx + (labelOnLeft ? -7 : 7)} y1={cy} x2={labelX + (labelOnLeft ? -4 : 4)} y2={cy} stroke="#0f766e" strokeWidth="1.4" />
        <text x={labelX} y={cy - 7} textAnchor={anchor} fontSize="12" fontWeight="900" fill="#0f172a">{name}</text>
        <text x={labelX} y={cy + 8} textAnchor={anchor} fontSize="9.5" fontWeight="700" fill="#0f766e">selected community</text>
      </svg>
    </div>
  );
}
