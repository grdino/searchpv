"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { LookupOption } from "./types";

export default function GeographyFilters({
  selectedSearch,
  selectedType,
  entityTypes,
}: {
  selectedSearch: string;
  selectedType: string;
  entityTypes: LookupOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(selectedSearch);
  const [entityType, setEntityType] = useState(selectedType);

  function applyFilters() {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("q", search.trim());
    }

    if (entityType) {
      params.set("type", entityType);
    }

    const query = params.toString();

    router.push(
      query
        ? `/office/geography?${query}`
        : "/office/geography",
    );
  }

  return (
    <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            applyFilters();
          }
        }}
        placeholder="Search name, alias, or identifier"
        className="rounded-full border border-slate-500 bg-slate-950 px-4 py-2 text-sm text-white placeholder:text-slate-400"
      />

      <select
        value={entityType}
        onChange={(event) => setEntityType(event.target.value)}
        className="rounded-full border border-slate-500 bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
      >
        <option value="">All Entity Types</option>

        {entityTypes.map((type) => (
          <option key={type.code} value={type.code}>
            {type.name ?? type.code}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={applyFilters}
        className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
      >
        Apply
      </button>

      <button
        type="button"
        onClick={() => router.push("/office/geography")}
        className="rounded-full border border-slate-500 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
      >
        Clear
      </button>
    </div>
  );
}
