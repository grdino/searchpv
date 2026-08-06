"use client";

type NavigationOption = {
  label: string;
  href: string;
  value?: string;
};

export default function PropertySearchNavigationSelect({
  value,
  options,
  disabled = false,
  placeholder,
}: {
  value: string;
  options: NavigationOption[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const selectedValue = event.target.value;

        if (selectedValue === "placeholder") {
          return;
        }

        const selectedOption = options.find(
          (option) => (option.value ?? option.href) === selectedValue
        );

        if (selectedOption) {
          window.location.href = selectedOption.href;
        }
      }}
      style={selectStyle}
    >
      {placeholder && (
        <option value="placeholder">{placeholder}</option>
      )}

      {options.map((option) => (
        <option
          key={`${option.label}-${option.href}`}
          value={option.value ?? option.href}
        >
          {option.label}
        </option>
      ))}
    </select>
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