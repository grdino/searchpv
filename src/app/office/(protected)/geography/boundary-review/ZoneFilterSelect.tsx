"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ZoneFilterSelectProps = {
  selectedZone: string;
  zones: readonly string[];
  unassignedValue: string;
};

export default function ZoneFilterSelect({
  selectedZone,
  zones,
  unassignedValue,
}: ZoneFilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleZoneChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const zone = event.target.value;

    if (zone) {
      params.set("zone", zone);
    } else {
      params.delete("zone");
    }

    // Changing zone should always return to page 1.
    params.delete("page");

    router.push(
      params.toString()
        ? `/office/geography/boundary-review?${params.toString()}`
        : "/office/geography/boundary-review",
    );
  }

  return (
    <select
      id="zone"
      name="zone"
      value={selectedZone}
      onChange={handleZoneChange}
      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
    >
      <option value="">All zones</option>

      {zones.map((zoneName) => (
        <option key={zoneName} value={zoneName}>
          {zoneName}
        </option>
      ))}

      <option value={unassignedValue}>
        Unassigned / No SearchPV Zone
      </option>
    </select>
  );
}