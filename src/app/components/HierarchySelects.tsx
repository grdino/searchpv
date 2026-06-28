"use client";

type Option = {
  label: string;
  href: string;
  value?: string;
};

export default function HierarchySelects({
  communityOptions,
  developmentOptions = [],
  selectedCommunityLabel,
  selectedDevelopmentLabel,
}: {
  communityOptions: Option[];
  developmentOptions?: Option[];
  selectedCommunityLabel?: string;
  selectedDevelopmentLabel?: string;
}) {
  const selectedCommunityValue =
    communityOptions.find((option) => option.label === selectedCommunityLabel)
      ?.href ?? "placeholder";

  const selectedDevelopmentValue =
    developmentOptions.find((option) => option.label === selectedDevelopmentLabel)
      ?.href ?? "placeholder";

  return (
    <div
      style={{
        marginTop: "10px",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "8px",
        width: "100%",
        maxWidth: "360px",
      }}
    >
      <select
        value={selectedCommunityValue}
        disabled={communityOptions.length === 0}
        onChange={(e) => {
          if (e.target.value !== "placeholder") {
            window.location.href = e.target.value;
          }
        }}
        style={selectStyle}
      >
        <option value="placeholder">
          {communityOptions.length === 0
            ? "Choose Area First"
            : "Choose Community"}
        </option>

        {communityOptions.map((option) => (
          <option key={option.href} value={option.href}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={selectedDevelopmentValue}
        disabled={developmentOptions.length === 0}
        onChange={(e) => {
          if (e.target.value !== "placeholder") {
            window.location.href = e.target.value;
          }
        }}
        style={selectStyle}
      >
        <option value="placeholder">
          {developmentOptions.length === 0
            ? "Choose Community First"
            : "Choose Development"}
        </option>

        {developmentOptions.map((option) => (
          <option key={option.href} value={option.href}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
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