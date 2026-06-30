"use client";

import AreaGuideModal from "@/app/components/AreaGuideModal";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type SortKey =
  | "name"
  | "active_count"
  | "pending_count"
  | "sales_12mo"
  | "median_sold_price"
  | "avg_sold_price_ft2"
  | "sold_avg_dom_12mo"
  | "months_inventory";
type SortDir = "asc" | "desc";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export default function ZoneAreaFilters({
  selectedMarket,
  selectedPropertyType,
  selectedSort,
  selectedDir,
  selectedZone,
  selectedArea,
  zones,
  areas,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedZone: string;
  selectedArea: string;
  zones: string[];
  areas: string[];
}) {
  const cleanedZones = zones.filter((zone) => zone !== "all" && zone.trim() !== "");

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
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        <select
          value={selectedZone === "all" ? DEFAULT_ZONE_NAME : selectedZone}
          onChange={(e) => {
            window.location.href = homeHref(
              selectedMarket,
              selectedPropertyType,
              selectedSort,
              selectedDir,
              e.target.value,
              "all"
            );
          }}
          style={selectStyle}
        >
          {cleanedZones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "4px",
          }}
        >
          <select
            value={selectedArea}
            onChange={(e) => {
              window.location.href = homeHref(
                selectedMarket,
                selectedPropertyType,
                selectedSort,
                selectedDir,
                selectedZone === "all" ? DEFAULT_ZONE_NAME : selectedZone,
                e.target.value
              );
            }}
            style={selectStyle}
          >
            <option value="all">All Areas</option>

            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <AreaGuideModal />
        </div>
       </div>
    </div>
  );
}

function homeHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir,
  zone: string,
  area: string
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);
  if (sort !== "active_count") params.set("sort", sort);
  if (!(sort === "active_count" && dir === "desc")) params.set("dir", dir);
  if (zone !== DEFAULT_ZONE_NAME) params.set("zone", zone);
  if (area !== "all") params.set("area", area);

  const queryString = params.toString();

  return queryString ? `/?${queryString}` : "/";
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  border: "1px solid #94a3b8",
  background: "#020617",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 700,
};
