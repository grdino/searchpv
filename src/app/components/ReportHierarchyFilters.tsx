"use client";

import AreaGuideModal from "@/app/components/AreaGuideModal";

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
  anchor = "active-listings-report",
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
    const basePath = window.location.pathname;

    window.location.href = qs
    ? `${basePath}?${qs}#${anchor}`
    : `${basePath}#${anchor}`;
    }

  return (
    <div style={locationRowStyle}>
      <FilterSelect
        label="Zone"
        value={params.zone ?? ""}
        options={zones}
        onChange={(value) => updateFilter("zone", value)}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "6px",
          alignItems: "end",
        }}
      >
        <FilterSelect
          label="Area"
          value={params.area ?? ""}
          options={areas}
          disabled={!params.zone}
          placeholder={!params.zone ? "Choose Zone First" : "All Areas"}
          onChange={(value) => updateFilter("area", value)}
        />


</div>

      <FilterSelect
        label="Community"
        value={params.community ?? ""}
        options={communities}
        disabled={!params.area}
        placeholder={!params.area ? "Choose Area First" : "All Communities"}
        onChange={(value) => updateFilter("community", value)}
      />

      <FilterSelect
        label="Development"
        value={params.development ?? ""}
        options={developments}
        disabled={!params.community}
        placeholder={!params.community ? "Choose Community First" : "All Developments"}
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
    <label style={labelStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={filterTitleStyle}>{label}</span>

        {label === "Area" && <AreaGuideModal />}
      </div>

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
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 190px))",
  justifyContent: "start",
  gap: "12px",
  marginBottom: "16px",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const filterTitleStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.7,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "1px solid #c8d8d0",
  borderRadius: "999px",
  padding: "8px 12px",
  background: "#ffffff",
  color: "#17211b",
  fontSize: "0.85rem",
  fontWeight: 700,
};

