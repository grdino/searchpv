"use client";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type SortKey =
  | "mls"
  | "development_name"
  | "community_name"
  | "beds"
  | "sold_price"
  | "final_list_price"
  | "sold_to_final_list_pct"
  | "sold_price_per_sqft"
  | "days_on_market"
  | "sold_date";
type SortDir = "asc" | "desc";
type RangeKey = "90d" | "6mo" | "12mo" | "all" | "custom";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export default function ClosedListingFilters({
  selectedMarket,
  selectedPropertyType,
  selectedSort,
  selectedDir,
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
  selectedRange,
  selectedStartDate,
  selectedEndDate,
  zones,
  areas,
  communities,
  developments,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
  selectedRange: RangeKey;
  selectedStartDate: string;
  selectedEndDate: string;
  zones: string[];
  areas: string[];
  communities: string[];
  developments: string[];
}) {
  return (
    <div style={{ marginTop: "18px" }}>
      <div style={rowStyle}>
        <FilterLink href={href("all", selectedPropertyType)} selected={selectedMarket === "all"}>All</FilterLink>
        <FilterLink href={href("pre_construction", selectedPropertyType)} selected={selectedMarket === "pre_construction"}>Pre-Con</FilterLink>
        <FilterLink href={href("resale", selectedPropertyType)} selected={selectedMarket === "resale"}>Resale</FilterLink>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <FilterLink href={href(selectedMarket, "all")} selected={selectedPropertyType === "all"}>All</FilterLink>
        <FilterLink href={href(selectedMarket, "condos")} selected={selectedPropertyType === "condos"}>Condos</FilterLink>
        <FilterLink href={href(selectedMarket, "houses")} selected={selectedPropertyType === "houses"}>Houses</FilterLink>
      </div>

      <div style={selectGridStyle}>
        <select value={selectedZone} onChange={(e) => go(e.target.value, "all", "all", "all")} style={selectStyle}>
          <option value={DEFAULT_ZONE_NAME}>{DEFAULT_ZONE_NAME}</option>
          <option value="all">All Zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>

        <select value={selectedArea} onChange={(e) => go(selectedZone, e.target.value, "all", "all")} style={selectStyle}>
          <option value="all">All Areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={selectedCommunity} onChange={(e) => go(selectedZone, selectedArea, e.target.value, "all")} style={selectStyle}>
          <option value="all">All Communities</option>
          {communities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={selectedDevelopment} onChange={(e) => go(selectedZone, selectedArea, selectedCommunity, e.target.value)} style={selectStyle}>
          <option value="all">All Developments</option>
          {developments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ marginTop: "14px", maxWidth: "520px" }}>
        <div style={sectionLabelStyle}>Closed Sale Date</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
          <label style={dateLabelStyle}>
            From
            <input type="date" value={selectedStartDate} onChange={(e) => goDate(e.target.value, selectedEndDate)} style={{ ...selectStyle, marginTop: "4px" }} />
          </label>

          <label style={dateLabelStyle}>
            Through
            <input type="date" value={selectedEndDate} onChange={(e) => goDate(selectedStartDate, e.target.value)} style={{ ...selectStyle, marginTop: "4px" }} />
          </label>
        </div>

        <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
          <FilterLink href={rangeHref("90d")} selected={selectedRange === "90d"}>90 Days</FilterLink>
          <FilterLink href={rangeHref("6mo")} selected={selectedRange === "6mo"}>6 Months</FilterLink>
          <FilterLink href={rangeHref("12mo")} selected={selectedRange === "12mo"}>12 Months</FilterLink>
          <FilterLink href={rangeHref("all")} selected={selectedRange === "all"}>All Time</FilterLink>
        </div>
      </div>
    </div>
  );

  function href(market: MarketSegment, propertyType: PropertyTypeSegment) {
    return closedSalesHref(market, propertyType, selectedSort, selectedDir, selectedZone, selectedArea, selectedCommunity, selectedDevelopment, selectedRange, selectedStartDate, selectedEndDate);
  }

  function go(zone: string, area: string, community: string, development: string) {
    window.location.href = closedSalesHref(selectedMarket, selectedPropertyType, selectedSort, selectedDir, zone, area, community, development, selectedRange, selectedStartDate, selectedEndDate);
  }

  function goDate(startDate: string, endDate: string) {
    window.location.href = closedSalesHref(selectedMarket, selectedPropertyType, selectedSort, selectedDir, selectedZone, selectedArea, selectedCommunity, selectedDevelopment, "custom", startDate, endDate);
  }

  function rangeHref(range: RangeKey) {
    return closedSalesHref(selectedMarket, selectedPropertyType, selectedSort, selectedDir, selectedZone, selectedArea, selectedCommunity, selectedDevelopment, range, "", "");
  }
}

function FilterLink({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) {
  return <a href={href} style={selected ? selectedStyle : unselectedStyle}>{children}</a>;
}

function closedSalesHref(
  market: MarketSegment,
  propertyType: PropertyTypeSegment,
  sort: SortKey,
  dir: SortDir,
  zone: string,
  area: string,
  community: string,
  development: string,
  range: RangeKey,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams();

  if (market !== "all") params.set("market", market);
  if (propertyType !== "all") params.set("propertyType", propertyType);
  if (sort !== "sold_date") params.set("sort", sort);
  if (!(sort === "sold_date" && dir === "desc")) params.set("dir", dir);
  if (zone !== DEFAULT_ZONE_NAME) params.set("zone", zone);
  if (area !== "all") params.set("area", area);
  if (community !== "all") params.set("community", community);
  if (development !== "all") params.set("development", development);
  if (range !== "12mo") params.set("range", range);

  if (range === "custom") {
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
  }

  const queryString = params.toString();
  return queryString ? `/closed-sales?${queryString}` : "/closed-sales";
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "6px 6px",
  borderRadius: "999px",
  border: "1px solid #94a3b8",
  fontSize: "11px",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "360px",
};

const selectGridStyle: React.CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "520px",
};

const selectedStyle: React.CSSProperties = {
  ...baseStyle,
  backgroundColor: "#ffffff",
  color: "#020617",
  borderColor: "#ffffff",
};

const unselectedStyle: React.CSSProperties = {
  ...baseStyle,
  backgroundColor: "transparent",
  color: "#ffffff",
};

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

const sectionLabelStyle: React.CSSProperties = {
  marginBottom: "6px",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#cbd5e1",
};

const dateLabelStyle: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 700,
};

