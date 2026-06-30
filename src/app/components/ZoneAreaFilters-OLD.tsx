"use client";

import { useRouter } from "next/navigation";
import AreaGuideModal from "@/app/components/AreaGuideModal";

type Props = {
  selectedMarket: string;
  selectedPropertyType: string;
  selectedSort: string;
  selectedDir: string;
  selectedZone: string;
  selectedArea: string;
  zones: string[];
  areas: string[];
};

export default function ZoneAreaFilters({
  selectedMarket,
  selectedPropertyType,
  selectedSort,
  selectedDir,
  selectedZone,
  selectedArea,
  zones,
  areas,
}: Props) {
  const router = useRouter();

  function updateFilters(nextZone: string, nextArea: string) {
    const params = new URLSearchParams();

    if (selectedMarket !== "all") params.set("market", selectedMarket);
    if (selectedPropertyType !== "all")
      params.set("propertyType", selectedPropertyType);
    if (selectedSort !== "sales_12mo") params.set("sort", selectedSort);

    if (!(selectedSort === "sales_12mo" && selectedDir === "desc")) {
      params.set("dir", selectedDir);
    }

    if (nextZone !== "all") params.set("zone", nextZone);
    if (nextArea !== "all") params.set("area", nextArea);

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: "30px",
    borderRadius: "999px",
    border: "1px solid #94a3b8",
    backgroundColor: "transparent",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "0 10px",
  };

  const optionStyle: React.CSSProperties = {
    color: "#020617",
    backgroundColor: "#ffffff",
  };

  return (
    <div
      style={{
        marginTop: "10px",
        width: "100%",
        maxWidth: "360px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        <select
          value={selectedZone}
          onChange={(e) => updateFilters(e.target.value, "all")}
          style={selectStyle}
        >
          <option value="all" style={optionStyle}>
            All Zones
          </option>

          {zones.map((zone) => (
            <option key={zone} value={zone} style={optionStyle}>
              {zone}
            </option>
          ))}
        </select>

        <select
          value={selectedArea}
          onChange={(e) => updateFilters(selectedZone, e.target.value)}
          disabled={selectedZone === "all"}
          style={{
            ...selectStyle,
            opacity: selectedZone === "all" ? 0.6 : 1,
          }}
        >
          <option value="all" style={optionStyle}>
            All Areas
          </option>

          {areas.map((area) => (
            <option key={area} value={area} style={optionStyle}>
              {area}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          marginTop: "6px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <AreaGuideModal />
      </div>
    </div>
  );
}