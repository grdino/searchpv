"use client";

type SelectBoxProps = {
  label: string;
  value: string;
  options: { label: string; value: string; href: string }[];
};

export default function SelectBox({ label, value, options }: SelectBoxProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
        {label}
      </label>

      <select
        value={value}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
        onChange={(event) => {
          window.location.href = event.target.value;
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.href}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}