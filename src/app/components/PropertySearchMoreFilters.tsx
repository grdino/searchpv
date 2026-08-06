"use client";

import { useMemo, useState } from "react";

import {
  buildPropertySearchUrl,
  hasAdvancedPropertyFilters,
  type PropertySearchFilters,
} from "@/lib/property-search/filters";

type SortKey =
  | "name"
  | "active_count"
  | "pending_count"
  | "median_list_price"
  | "median_list_price_per_sqft"
  | "median_active_dom";

type SortDir = "asc" | "desc";

const MIN_BED_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Studio", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5+", value: "5" },
];

const MAX_BED_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Studio", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

const MIN_BATH_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1", value: "1" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
  { label: "3.5", value: "3.5" },
  { label: "4", value: "4" },
  { label: "4.5", value: "4.5" },
  { label: "5+", value: "5" },
];

const MAX_BATH_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1", value: "1" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
  { label: "3.5", value: "3.5" },
  { label: "4", value: "4" },
  { label: "4.5", value: "4.5" },
  { label: "5", value: "5" },
];

export default function PropertySearchMoreFilters({
  filters,
  selectedSort,
  selectedDir,
}: {
  filters: PropertySearchFilters;
  selectedSort: SortKey;
  selectedDir: SortDir;
}) {
  const [isOpen, setIsOpen] = useState(
    hasAdvancedPropertyFilters(filters)
  );

  const [minBeds, setMinBeds] = useState(toInputValue(filters.minBeds));
  const [maxBeds, setMaxBeds] = useState(toInputValue(filters.maxBeds));

  const [minBaths, setMinBaths] = useState(toInputValue(filters.minBaths));
  const [maxBaths, setMaxBaths] = useState(toInputValue(filters.maxBaths));

  const [minPrice, setMinPrice] = useState(toInputValue(filters.minPrice));
  const [maxPrice, setMaxPrice] = useState(toInputValue(filters.maxPrice));

  const [waterfront, setWaterfront] = useState(filters.waterfront);
  const [oceanView, setOceanView] = useState(filters.oceanView);
  const [petFriendly, setPetFriendly] = useState(filters.petFriendly);
  const [pool, setPool] = useState(filters.pool);
  const [parking, setParking] = useState(filters.parking);
  const [furnished, setFurnished] = useState(filters.furnished);

  const [minHoa, setMinHoa] = useState(toInputValue(filters.minHoa));
  const [maxHoa, setMaxHoa] = useState(toInputValue(filters.maxHoa));

  const activeCount = useMemo(() => {
    return [
      minBeds !== "",
      maxBeds !== "",
      minBaths !== "",
      maxBaths !== "",
      minPrice.trim() !== "",
      maxPrice.trim() !== "",
      waterfront,
      oceanView,
      petFriendly,
      pool,
      parking,
      furnished,
      minHoa.trim() !== "",
      maxHoa.trim() !== "",
    ].filter(Boolean).length;
  }, [
    minBeds,
    maxBeds,
    minBaths,
    maxBaths,
    minPrice,
    maxPrice,
    waterfront,
    oceanView,
    petFriendly,
    pool,
    parking,
    furnished,
    minHoa,
    maxHoa,
  ]);

  function applyFilters() {
    const nextFilters: PropertySearchFilters = {
      ...filters,

      minBeds: parseNullableNumber(minBeds),
      maxBeds: parseNullableNumber(maxBeds),

      minBaths: parseNullableNumber(minBaths),
      maxBaths: parseNullableNumber(maxBaths),

      minPrice: parseNullableNumber(minPrice),
      maxPrice: parseNullableNumber(maxPrice),

      waterfront,
      oceanView,
      petFriendly,
      pool,
      parking,
      furnished,

      minHoa: parseNullableNumber(minHoa),
      maxHoa: parseNullableNumber(maxHoa),
    };

    const safeFilters = normalizeRanges(nextFilters);

    window.location.href = appendSort(
      buildPropertySearchUrl(
        safeFilters,
        "/search-properties",
        "market-explorer"
      ),
      selectedSort,
      selectedDir
    );
  }

  function clearFilters() {
    const cleared: PropertySearchFilters = {
      ...filters,

      minBeds: null,
      maxBeds: null,

      minBaths: null,
      maxBaths: null,

      minPrice: null,
      maxPrice: null,

      waterfront: false,
      oceanView: false,
      petFriendly: false,
      pool: false,
      parking: false,
      furnished: false,

      minHoa: null,
      maxHoa: null,
    };

    window.location.href = appendSort(
      buildPropertySearchUrl(
        cleared,
        "/search-properties",
        "market-explorer"
      ),
      selectedSort,
      selectedDir
    );
  }

  return (
    <div
      style={{
        marginTop: "10px",
        width: "100%",
        maxWidth: "360px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "999px",
          border: "1px solid #94a3b8",
          background: isOpen ? "#ffffff" : "transparent",
          color: isOpen ? "#020617" : "#ffffff",
          fontSize: "12px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        More Filters
        {activeCount > 0 ? ` (${activeCount})` : ""}
        {isOpen ? " ▲" : " ▼"}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: "10px",
            borderRadius: "16px",
            border: "1px solid #334155",
            background: "#0f172a",
            padding: "14px",
          }}
        >
          <div style={sectionLabelStyle}>Bedrooms</div>

          <div style={twoColumnGridStyle}>
            <SelectField
              label="Minimum"
              value={minBeds}
              onChange={setMinBeds}
              options={MIN_BED_OPTIONS}
            />

            <SelectField
              label="Maximum"
              value={maxBeds}
              onChange={setMaxBeds}
              options={MAX_BED_OPTIONS}
            />
          </div>

          <div style={{ ...sectionLabelStyle, marginTop: "14px" }}>
            Bathrooms
          </div>

          <div style={twoColumnGridStyle}>
            <SelectField
              label="Minimum"
              value={minBaths}
              onChange={setMinBaths}
              options={MIN_BATH_OPTIONS}
            />

            <SelectField
              label="Maximum"
              value={maxBaths}
              onChange={setMaxBaths}
              options={MAX_BATH_OPTIONS}
            />
          </div>

          <div style={{ ...sectionLabelStyle, marginTop: "14px" }}>
            Price (USD)
          </div>

          <div style={twoColumnGridStyle}>
            <NumberField
              label="Minimum"
              value={minPrice}
              onChange={setMinPrice}
              min={0}
              step={10000}
              placeholder="Any"
            />

            <NumberField
              label="Maximum"
              value={maxPrice}
              onChange={setMaxPrice}
              min={0}
              step={10000}
              placeholder="Any"
            />
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "9px 12px",
            }}
          >
            <CheckboxField
              label="Waterfront / Beachfront"
              checked={waterfront}
              onChange={setWaterfront}
            />

            <CheckboxField
              label="Ocean View"
              checked={oceanView}
              onChange={setOceanView}
            />

            <CheckboxField
              label="Pet Friendly"
              checked={petFriendly}
              onChange={setPetFriendly}
            />

            <CheckboxField
              label="Pool"
              checked={pool}
              onChange={setPool}
            />

            <CheckboxField
              label="Parking"
              checked={parking}
              onChange={setParking}
            />

            <CheckboxField
              label="Furnished"
              checked={furnished}
              onChange={setFurnished}
            />
          </div>

          <div style={{ ...sectionLabelStyle, marginTop: "14px" }}>
            Monthly HOA (MXN)
          </div>

          <div style={twoColumnGridStyle}>
            <NumberField
              label="Minimum"
              value={minHoa}
              onChange={setMinHoa}
              min={0}
              step={100}
              placeholder="Any"
            />

            <NumberField
              label="Maximum"
              value={maxHoa}
              onChange={setMaxHoa}
              min={0}
              step={100}
              placeholder="Any"
            />
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={applyFilters}
              style={primaryButtonStyle}
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={clearFilters}
              style={secondaryButtonStyle}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label style={fieldLabelStyle}>
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  step: number;
  placeholder?: string;
}) {
  return (
    <label style={fieldLabelStyle}>
      <span>{label}</span>

      <input
        type="number"
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        color: "#e2e8f0",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span>{label}</span>
    </label>
  );
}

function normalizeRanges(
  filters: PropertySearchFilters
): PropertySearchFilters {
  return {
    ...filters,

    maxBeds:
      filters.minBeds !== null &&
      filters.maxBeds !== null &&
      filters.maxBeds < filters.minBeds
        ? filters.minBeds
        : filters.maxBeds,

    maxBaths:
      filters.minBaths !== null &&
      filters.maxBaths !== null &&
      filters.maxBaths < filters.minBaths
        ? filters.minBaths
        : filters.maxBaths,

    maxPrice:
      filters.minPrice !== null &&
      filters.maxPrice !== null &&
      filters.maxPrice < filters.minPrice
        ? filters.minPrice
        : filters.maxPrice,

    maxHoa:
      filters.minHoa !== null &&
      filters.maxHoa !== null &&
      filters.maxHoa < filters.minHoa
        ? filters.minHoa
        : filters.maxHoa,
  };
}

function appendSort(
  url: string,
  sort: SortKey,
  dir: SortDir
): string {
  const [beforeHash, hash = ""] = url.split("#");
  const [pathname, queryString = ""] = beforeHash.split("?");

  const params = new URLSearchParams(queryString);

  if (sort !== "active_count") {
    params.set("sort", sort);
  }

  if (!(sort === "active_count" && dir === "desc")) {
    params.set("dir", dir);
  }

  const query = params.toString();

  return `${pathname}${query ? `?${query}` : ""}${
    hash ? `#${hash}` : ""
  }`;
}

function parseNullableNumber(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function toInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}

const twoColumnGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const sectionLabelStyle: React.CSSProperties = {
  marginBottom: "7px",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "5px",
  color: "#e2e8f0",
  fontSize: "11px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  borderRadius: "8px",
  border: "1px solid #475569",
  background: "#020617",
  color: "#ffffff",
  padding: "8px",
  fontSize: "12px",
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "1px solid #ffffff",
  background: "#ffffff",
  color: "#020617",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "1px solid #94a3b8",
  background: "transparent",
  color: "#ffffff",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
};
