"use client";

type MarketSegment = "all" | "pre_construction" | "resale";
type PropertyTypeSegment = "all" | "condos" | "houses";
type BedroomSegment = "all" | "0br" | "1br" | "2br" | "3br_plus";

type SortKey =
  | "mls"
  | "development_name"
  | "unit_id"
  | "community_name"
  | "beds"
  | "current_price"
  | "price_per_sqft"
  | "dom";

type SortDir = "asc" | "desc";

const DEFAULT_ZONE_NAME = "Puerto Vallarta";
const BASE_PATH = "/market-intelligence/active-listings";

export default function MarketListingFilters({
  selectedMarket,
  selectedPropertyType,
  selectedBedrooms,
  selectedSort,
  selectedDir,
  selectedZone,
  selectedArea,
  selectedCommunity,
  selectedDevelopment,
  zones,
  areas,
  communities,
  developments,
}: {
  selectedMarket: MarketSegment;
  selectedPropertyType: PropertyTypeSegment;
  selectedBedrooms: BedroomSegment;
  selectedSort: SortKey;
  selectedDir: SortDir;
  selectedZone: string;
  selectedArea: string;
  selectedCommunity: string;
  selectedDevelopment: string;
  zones: string[];
  areas: string[];
  communities: string[];
  developments: string[];
}) {
  return (
    <div className="mt-[18px]">
      <div>
        <div style={sectionLabelStyle}>Market</div>

        <div style={threeColumnRowStyle}>
          <FilterLink
            href={buildHref({ market: "all" })}
            selected={selectedMarket === "all"}
          >
            All
          </FilterLink>

          <FilterLink
            href={buildHref({ market: "pre_construction" })}
            selected={selectedMarket === "pre_construction"}
          >
            Pre-Con
          </FilterLink>

          <FilterLink
            href={buildHref({ market: "resale" })}
            selected={selectedMarket === "resale"}
          >
            Resale
          </FilterLink>
        </div>
      </div>

      <div className="mt-[10px]">
        <div style={sectionLabelStyle}>Property Type</div>

        <div style={threeColumnRowStyle}>
          <FilterLink
            href={buildHref({ propertyType: "all" })}
            selected={selectedPropertyType === "all"}
          >
            All
          </FilterLink>

          <FilterLink
            href={buildHref({ propertyType: "condos" })}
            selected={selectedPropertyType === "condos"}
          >
            Condos
          </FilterLink>

          <FilterLink
            href={buildHref({ propertyType: "houses" })}
            selected={selectedPropertyType === "houses"}
          >
            Houses
          </FilterLink>
        </div>
      </div>

      <div className="mt-[10px]">
        <div style={sectionLabelStyle}>Bedrooms</div>

        <div style={bedroomRowStyle}>
          <FilterLink
            href={buildHref({ bedrooms: "all" })}
            selected={selectedBedrooms === "all"}
          >
            All
          </FilterLink>

          <FilterLink
            href={buildHref({ bedrooms: "0br" })}
            selected={selectedBedrooms === "0br"}
          >
            Studio
          </FilterLink>

          <FilterLink
            href={buildHref({ bedrooms: "1br" })}
            selected={selectedBedrooms === "1br"}
          >
            1 BR
          </FilterLink>

          <FilterLink
            href={buildHref({ bedrooms: "2br" })}
            selected={selectedBedrooms === "2br"}
          >
            2 BR
          </FilterLink>

          <FilterLink
            href={buildHref({ bedrooms: "3br_plus" })}
            selected={selectedBedrooms === "3br_plus"}
          >
            3+ BR
          </FilterLink>
        </div>
      </div>

      <div style={selectGridStyle}>
        <select
          aria-label="Zone"
          value={selectedZone}
          onChange={(event) =>
            go({
              zone: event.target.value,
              area: "all",
              community: "all",
              development: "all",
            })
          }
          style={selectStyle}
        >
          <option value={DEFAULT_ZONE_NAME}>{DEFAULT_ZONE_NAME}</option>
          <option value="all">All Zones</option>

          {zones
            .filter((zone) => zone !== DEFAULT_ZONE_NAME)
            .map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
        </select>

        <select
          aria-label="Area"
          value={selectedArea}
          onChange={(event) =>
            go({
              area: event.target.value,
              community: "all",
              development: "all",
            })
          }
          style={selectStyle}
          disabled={selectedZone === "all"}
        >
          <option value="all">
            {selectedZone === "all" ? "Choose Zone First" : "All Areas"}
          </option>

          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <select
          aria-label="Community"
          value={selectedCommunity}
          onChange={(event) =>
            go({
              community: event.target.value,
              development: "all",
            })
          }
          style={selectStyle}
          disabled={selectedArea === "all"}
        >
          <option value="all">
            {selectedArea === "all"
              ? "Choose Area First"
              : "All Communities"}
          </option>

          {communities.map((community) => (
            <option key={community} value={community}>
              {community}
            </option>
          ))}
        </select>

        <select
          aria-label="Development"
          value={selectedDevelopment}
          onChange={(event) =>
            go({
              development: event.target.value,
            })
          }
          style={selectStyle}
          disabled={selectedCommunity === "all"}
        >
          <option value="all">
            {selectedCommunity === "all"
              ? "Choose Community First"
              : "All Developments"}
          </option>

          {developments.map((development) => (
            <option key={development} value={development}>
              {development}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-[10px]">
        <div style={sectionLabelStyle}>Sort Listings</div>

        <div style={sortGridStyle}>
          <select
            aria-label="Sort listings by"
            value={selectedSort}
            onChange={(event) =>
              go({
                sort: event.target.value as SortKey,
              })
            }
            style={selectStyle}
          >
            <option value="current_price">List Price</option>
            <option value="dom">Days on Market</option>
            <option value="price_per_sqft">Price per ft²</option>
            <option value="beds">Bedrooms</option>
            <option value="development_name">Development</option>
            <option value="community_name">Community</option>
            <option value="unit_id">Unit</option>
            <option value="mls">MLS</option>
          </select>

          <select
            aria-label="Sort direction"
            value={selectedDir}
            onChange={(event) =>
              go({
                dir: event.target.value as SortDir,
              })
            }
            style={selectStyle}
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );

  function buildHref(
    updates: Partial<{
      market: MarketSegment;
      propertyType: PropertyTypeSegment;
      bedrooms: BedroomSegment;
      sort: SortKey;
      dir: SortDir;
      zone: string;
      area: string;
      community: string;
      development: string;
    }>
  ) {
    const nextValues = {
      market: selectedMarket,
      propertyType: selectedPropertyType,
      bedrooms: selectedBedrooms,
      sort: selectedSort,
      dir: selectedDir,
      zone: selectedZone,
      area: selectedArea,
      community: selectedCommunity,
      development: selectedDevelopment,
      ...updates,
    };

    const params = new URLSearchParams();

    if (nextValues.market !== "all") {
      params.set("market", nextValues.market);
    }

    if (nextValues.propertyType !== "all") {
      params.set("propertyType", nextValues.propertyType);
    }

    if (nextValues.bedrooms !== "all") {
      params.set("bedrooms", nextValues.bedrooms);
    }

    if (nextValues.sort !== "current_price") {
      params.set("sort", nextValues.sort);
    }

    if (
      !(
        nextValues.sort === "current_price" &&
        nextValues.dir === "desc"
      )
    ) {
      params.set("dir", nextValues.dir);
    }

    if (nextValues.zone !== DEFAULT_ZONE_NAME) {
      params.set("zone", nextValues.zone);
    }

    if (nextValues.area !== "all") {
      params.set("area", nextValues.area);
    }

    if (nextValues.community !== "all") {
      params.set("community", nextValues.community);
    }

    if (nextValues.development !== "all") {
      params.set("development", nextValues.development);
    }

    const queryString = params.toString();

    return queryString
      ? `${BASE_PATH}?${queryString}`
      : BASE_PATH;
  }

  function go(
    updates: Partial<{
      market: MarketSegment;
      propertyType: PropertyTypeSegment;
      bedrooms: BedroomSegment;
      sort: SortKey;
      dir: SortDir;
      zone: string;
      area: string;
      community: string;
      development: string;
    }>
  ) {
    window.location.href = buildHref(updates);
  }
}

function FilterLink({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={selected ? selectedStyle : unselectedStyle}
    >
      {children}
    </a>
  );
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "6px",
  borderRadius: "999px",
  border: "1px solid #94a3b8",
  fontSize: "11px",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const threeColumnRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "360px",
};

const bedroomRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "520px",
};

const selectGridStyle: React.CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "520px",
};

const sortGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
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
  opacity: 1,
};

const sectionLabelStyle: React.CSSProperties = {
  marginBottom: "6px",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#cbd5e1",
};