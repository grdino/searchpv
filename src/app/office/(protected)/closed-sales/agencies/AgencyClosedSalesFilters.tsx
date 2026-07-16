"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  buildReportHref,
  type AgencySortKey,
  type MarketSegment,
  type PropertyTypeSegment,
  type RangeKey,
  type SortDir,
} from "./agency-report-utils";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";

export default function AgencyClosedSalesFilters({
  selectedMarket,
  selectedPropertyType,
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
  selectedRange,
  selectedStartDate,
  selectedEndDate,
  selectedSort,
  selectedDir,
  zones,
  areas,
  communities,
  developments,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
  selectedRange: RangeKey;
  selectedStartDate: string;
  selectedEndDate: string;
  selectedSort: AgencySortKey;
  selectedDir: SortDir;
  zones: string[];
  areas: string[];
  communities: string[];
  developments: string[];
}) {
  return (
    <div className="mt-5">
      <div style={rowStyle}>
        <FilterLink href={href({ market: "all" })} selected={selectedMarket === "all"}>All</FilterLink>
        <FilterLink href={href({ market: "pre_construction" })} selected={selectedMarket === "pre_construction"}>Pre-Con</FilterLink>
        <FilterLink href={href({ market: "resale" })} selected={selectedMarket === "resale"}>Resale</FilterLink>
      </div>

      <div style={{ ...rowStyle, marginTop: "10px" }}>
        <FilterLink href={href({ propertyType: "all" })} selected={selectedPropertyType === "all"}>All</FilterLink>
        <FilterLink href={href({ propertyType: "condos" })} selected={selectedPropertyType === "condos"}>Condos</FilterLink>
        <FilterLink href={href({ propertyType: "houses" })} selected={selectedPropertyType === "houses"}>Houses</FilterLink>
      </div>

      <div style={selectGridStyle}>
        <select value={selectedZone} onChange={(e) => go({ zone: e.target.value, area: "all", community: "all", development: "all" })} style={selectStyle}>
          <option value={DEFAULT_ZONE_NAME}>{DEFAULT_ZONE_NAME}</option>
          <option value="all">All Zones</option>
          {zones.filter((z) => z !== DEFAULT_ZONE_NAME).map((z) => <option key={z} value={z}>{z}</option>)}
        </select>

        <select value={selectedArea} onChange={(e) => go({ area: e.target.value, community: "all", development: "all" })} style={selectStyle} disabled={selectedZone === "all"}>
          <option value="all">{selectedZone === "all" ? "Choose Zone First" : "All Areas"}</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={selectedCommunity} onChange={(e) => go({ community: e.target.value, development: "all" })} style={selectStyle} disabled={selectedArea === "all"}>
          <option value="all">{selectedArea === "all" ? "Choose Area First" : "All Communities"}</option>
          {communities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={selectedDevelopment} onChange={(e) => go({ development: e.target.value })} style={selectStyle} disabled={selectedCommunity === "all"}>
          <option value="all">{selectedCommunity === "all" ? "Choose Community First" : "All Developments"}</option>
          {developments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="mt-4 max-w-[620px]">
        <div style={sectionLabelStyle}>Closed Sale Date</div>

        <div className="grid grid-cols-2 gap-2">
          <label style={dateLabelStyle}>
            From
            <DatePicker selected={parseUrlDate(selectedStartDate)} onChange={(date: Date | null) => goDate(date ? formatDateForUrl(date) : "", selectedEndDate)} dateFormat="MMM d, yyyy" placeholderText="From" className="date-picker-input" popperClassName="searchpv-date-picker-popper" showPopperArrow={false} popperPlacement="bottom-start" />
          </label>

          <label style={dateLabelStyle}>
            Through
            <DatePicker selected={parseUrlDate(selectedEndDate)} onChange={(date: Date | null) => goDate(selectedStartDate, date ? formatDateForUrl(date) : "")} dateFormat="MMM d, yyyy" placeholderText="Through" className="date-picker-input" popperClassName="searchpv-date-picker-popper" showPopperArrow={false} popperPlacement="bottom-end" />
          </label>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <FilterLink href={href({ range: "this_year", startDate: "", endDate: "" })} selected={selectedRange === "this_year"}>This Year</FilterLink>
          <FilterLink href={href({ range: "last_year", startDate: "", endDate: "" })} selected={selectedRange === "last_year"}>Last Year</FilterLink>
          <FilterLink href={href({ range: "this_month", startDate: "", endDate: "" })} selected={selectedRange === "this_month"}>This Month</FilterLink>
          <FilterLink href={href({ range: "last_year_month", startDate: "", endDate: "" })} selected={selectedRange === "last_year_month"}>LY Month</FilterLink>
          <FilterLink href={href({ range: "all", startDate: "", endDate: "" })} selected={selectedRange === "all"}>All Time</FilterLink>
        </div>
      </div>
    </div>
  );

  function href(changes: Partial<{ market: MarketSegment; propertyType: PropertyTypeSegment; zone: string; area: string; community: string; development: string; range: RangeKey; startDate: string; endDate: string; }>) {
    return buildReportHref({
      market: changes.market ?? selectedMarket,
      propertyType: changes.propertyType ?? selectedPropertyType,
      zone: changes.zone ?? selectedZone,
      area: changes.area ?? selectedArea,
      community: changes.community ?? selectedCommunity,
      development: changes.development ?? selectedDevelopment,
      range: changes.range ?? selectedRange,
      startDate: changes.startDate ?? selectedStartDate,
      endDate: changes.endDate ?? selectedEndDate,
      sort: selectedSort,
      dir: selectedDir,
    });
  }

  function go(changes: Partial<{ zone: string; area: string; community: string; development: string; }>) {
    window.location.href = href(changes);
  }

  function goDate(startDate: string, endDate: string) {
    window.location.href = href({ range: "custom", startDate, endDate });
  }
}

function FilterLink({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) {
  return <a href={href} style={selected ? selectedStyle : unselectedStyle}>{children}</a>;
}

function formatDateForUrl(date: Date) {
  const y = date.getFullYear();
  if (y < 2000 || y > 2100) return "";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseUrlDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

const baseStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "6px", borderRadius: "999px", border: "1px solid #94a3b8", fontSize: "11px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };
const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", width: "100%", maxWidth: "360px" };
const selectGridStyle: React.CSSProperties = { marginTop: "10px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", width: "100%", maxWidth: "620px" };
const selectedStyle: React.CSSProperties = { ...baseStyle, backgroundColor: "#ffffff", color: "#020617", borderColor: "#ffffff" };
const unselectedStyle: React.CSSProperties = { ...baseStyle, backgroundColor: "transparent", color: "#ffffff" };
const selectStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: "999px", border: "1px solid #94a3b8", background: "#020617", color: "#ffffff", fontSize: "12px", fontWeight: 700 };
const sectionLabelStyle: React.CSSProperties = { marginBottom: "6px", fontSize: "11px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#cbd5e1" };
const dateLabelStyle: React.CSSProperties = { color: "#cbd5e1", fontSize: "11px", fontWeight: 700 };
