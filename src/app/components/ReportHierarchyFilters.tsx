"use client";

type SearchParams = {
  zone?: string;
  area?: string;
  community?: string;
  development?: string;
  propertyType?: string;
  marketType?: string;
  beds?: string;
  sort?: string;
  dir?: "asc" | "desc";
};

export default function ReportHierarchyFilters({
  params,
  zones,
  areas,
  communities,
  developments,
}: {
  params: SearchParams;
  zones: string[];
  areas: string[];
  communities: string[];
  developments: string[];
}) {
  function updateFilter(key: keyof SearchParams, value: string) {
    const next = new URLSearchParams();

    Object.entries(params).forEach(([paramKey, paramValue]) => {
      if (paramValue) next.set(paramKey, String(paramValue));
    });

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key === "zone") {
      next.delete("area");
      next.delete("community");
      next.delete("development");
    }

    if (key === "area") {
      next.delete("community");
      next.delete("development");
    }

    if (key === "community") {
      next.delete("development");
    }

    const qs = next.toString();

    window.location.href = qs
      ? `/market-intelligence/active-listings?${qs}`
      : "/market-intelligence/active-listings";
  }

  return (
    <div style={locationRowStyle}>
      <FilterSelect
        label="Zone"
        value={params.zone ?? ""}
        options={zones}
        onChange={(value) => updateFilter("zone", value)}
      />

      <FilterSelect
        label="Area"
        value={params.area ?? ""}
        options={areas}
        disabled={!params.zone}
        placeholder={!params.zone ? "Choose Zone First" : "All"}
        onChange={(value) => updateFilter("area", value)}
      />

      <FilterSelect
        label="Community"
        value={params.community ?? ""}
        options={communities}
        disabled={!params.area}
        placeholder={!params.area ? "Choose Area First" : "All"}
        onChange={(value) => updateFilter("community", value)}
      />

      <FilterSelect
        label="Development"
        value={params.development ?? ""}
        options={developments}
        disabled={!params.community}
        placeholder={!params.community ? "Choose Community First" : "All"}
        onChange={(value) => updateFilter("development", value)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "All",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={filterTitleStyle}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...selectStyle,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const locationRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "14px",
  alignItems: "end",
  marginBottom: "0",
};

const filterTitleStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "2px",
  opacity: 0.7,
  textAlign: "center",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  border: "1px solid #c8d8d0",
  borderRadius: "999px",
  padding: "8px 12px",
  background: "#ffffff",
  color: "#17211b",
  fontSize: "0.85rem",
  fontWeight: 700,
};