import Link from "next/link";

import type { SupabaseClient } from "@supabase/supabase-js";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";
import { createClient } from "@/lib/supabase/server";

import EntityEditor from "./EntityEditor";
import GeographyFilters from "./GeographyFilters";
import {
  buildGeographyHref,
  getSortDir,
  getSortKey,
  parseEntityKey,
  sortEntities,
  type GeographySortKey,
  type SortDir,
} from "./geography-utils";
import type {
  GeographyEntityDetail,
  GeographyEntityListRow,
  GeographyLookupData,
  GeographyParentOption,
  GeographySummaryRow,
} from "./types";

export const dynamic = "force-dynamic";

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    entity?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const selectedSearch = params.q?.trim() ?? "";
  const selectedType = params.type?.trim() ?? "";
  const selectedEntityKy = parseEntityKey(params.entity);
  const selectedSort = getSortKey(params.sort);
  const selectedDir = getSortDir(params.dir);

  const [
    summaryResponse,
    lookupResponse,
    listResponse,
  ] = await Promise.all([
    supabase.rpc("geography_summary"),
    supabase.rpc("geography_lookup_data"),
    supabase.rpc("geography_entity_list", {
      p_search: selectedSearch || null,
      p_entity_type_cd: selectedType || null,
      p_limit: 250,
      p_offset: 0,
    }),
  ]);

  const initialError =
    summaryResponse.error ||
    lookupResponse.error ||
    listResponse.error;

  if (initialError) {
    return <GeographyError error={initialError.message} />;
  }

  const summaries =
    (summaryResponse.data ?? []) as GeographySummaryRow[];

  const lookups =
    lookupResponse.data as GeographyLookupData;

  const entities = sortEntities(
    (listResponse.data ?? []) as GeographyEntityListRow[],
    selectedSort,
    selectedDir,
  );

  let detail: GeographyEntityDetail | null = null;

  if (selectedEntityKy !== null) {
    const detailResponse = await supabase.rpc(
      "geography_entity_detail",
      {
        p_entity_ky: selectedEntityKy,
      },
    );

    if (detailResponse.error) {
      return <GeographyError error={detailResponse.error.message} />;
    }

    detail =
      detailResponse.data as GeographyEntityDetail;

    if (!detail?.entity) {
      detail = null;
    }
  }

  const editorType =
    detail?.entity?.entity_type_cd ||
    selectedType ||
    "DV";

  const parentOptionsResponse =
    await supabase.rpc(
      "geography_parent_options",
      {
        p_child_entity_type_cd: editorType,
        p_search: null,
        p_limit: 1000,
      },
    );

  if (parentOptionsResponse.error) {
    return (
      <GeographyError error={parentOptionsResponse.error.message} />
    );
  }

  const parentOptions =
    (parentOptionsResponse.data ?? []) as GeographyParentOption[];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Header />

            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Office Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Geography Maintenance
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Maintain geographic entities, canonical names, aliases,
            coordinates, sources, and immediate parent relationships.
          </p>

          <GeographyFilters
            selectedSearch={selectedSearch}
            selectedType={selectedType}
            entityTypes={lookups.entity_types}
          />
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-700 px-4 py-3">
        <div className="mx-auto max-w-7xl text-center text-sm font-bold text-white">
          <Link
            href="/"
            className="underline hover:text-sky-200"
          >
            SearchPV
          </Link>

          {" > "}

          <Link
            href="/office"
            className="underline hover:text-sky-200"
          >
            Office
          </Link>

          {" > "}

          <span>Geography Maintenance</span>

          <div className="mt-1 text-xs font-semibold text-slate-200">
            {selectedType
              ? lookups.entity_types.find(
                  (option) => option.code === selectedType,
                )?.name ?? selectedType
              : "All Entity Types"}

            {selectedSearch
              ? ` • Search: ${selectedSearch}`
              : ""}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <SummaryGrid rows={summaries} />

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(440px,0.8fr)]">
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  Geographic Entities
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {entities.length.toLocaleString()} records shown.
                  Search results are limited to the first 250 matches.
                </p>
              </div>

              <Link
                href={buildGeographyHref({
                  q: selectedSearch,
                  type: selectedType,
                  sort: selectedSort,
                  dir: selectedDir,
                })}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                New Entity
              </Link>
            </div>

            <div className="max-h-[72vh] overflow-auto rounded-xl bg-white shadow">
              <table className="min-w-[950px] border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <SortableHeading
                      label="Name"
                      sortKey="canonical_nm"
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      q={selectedSearch}
                      type={selectedType}
                      entity={selectedEntityKy}
                      stickyLeft
                    />

                    <SortableHeading
                      label="Type"
                      sortKey="entity_type_cd"
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      q={selectedSearch}
                      type={selectedType}
                      entity={selectedEntityKy}
                    />

                    <SortableHeading
                      label="Parent"
                      sortKey="parent_nm"
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      q={selectedSearch}
                      type={selectedType}
                      entity={selectedEntityKy}
                    />

                    <th className="sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold">
                      Coordinates
                    </th>

                    <SortableHeading
                      label="Names"
                      sortKey="variant_ct"
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      q={selectedSearch}
                      type={selectedType}
                      entity={selectedEntityKy}
                    />

                    <SortableHeading
                      label="Children"
                      sortKey="child_ct"
                      currentSort={selectedSort}
                      currentDir={selectedDir}
                      q={selectedSearch}
                      type={selectedType}
                      entity={selectedEntityKy}
                    />
                  </tr>
                </thead>

                <tbody>
                  {entities.map((entity) => {
                    const selected =
                      selectedEntityKy === entity.entity_ky;

                    return (
                      <tr key={entity.entity_ky}>
                        <td
                          className={`sticky left-0 z-10 whitespace-nowrap border-t border-slate-100 px-4 py-3 shadow-[2px_0_0_#e2e8f0] ${
                            selected
                              ? "bg-sky-50"
                              : "bg-white"
                          }`}
                        >
                          <Link
                            href={buildGeographyHref({
                              q: selectedSearch,
                              type: selectedType,
                              entity: entity.entity_ky,
                              sort: selectedSort,
                              dir: selectedDir,
                            })}
                            className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                          >
                            {entity.canonical_nm}
                          </Link>

                          <div className="mt-1 max-w-[320px] truncate font-mono text-xs text-slate-500">
                            {entity.entity_identifier_cd}
                          </div>
                        </td>

                        <td className="whitespace-nowrap border-t border-slate-100 bg-white px-4 py-3">
                          {entity.entity_type_nm ??
                            entity.entity_type_cd}
                        </td>

                        <td className="whitespace-nowrap border-t border-slate-100 bg-white px-4 py-3">
                          {entity.parent_nm ?? "—"}
                        </td>

                        <td className="whitespace-nowrap border-t border-slate-100 bg-white px-4 py-3">
                          {entity.latitude_nb !== null &&
                          entity.longitude_nb !== null
                            ? `${entity.latitude_nb}, ${entity.longitude_nb}`
                            : "Missing"}
                        </td>

                        <td className="whitespace-nowrap border-t border-slate-100 bg-white px-4 py-3">
                          {Number(entity.variant_ct).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap border-t border-slate-100 bg-white px-4 py-3">
                          {Number(entity.child_ct).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {entities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No entities match the selected filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <EntityEditor
            key={selectedEntityKy ?? "new"}
            detail={detail}
            lookups={lookups}
            parentOptions={parentOptions}
            q={selectedSearch}
            type={selectedType}
            sort={selectedSort}
            dir={selectedDir}
          />
        </div>
      </section>
    </main>
  );
}

function SummaryGrid({
  rows,
}: {
  rows: GeographySummaryRow[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {rows.map((row) => (
        <div
          key={row.entity_type_cd}
          className="rounded-xl bg-white p-4 shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {row.entity_type_nm ?? row.entity_type_cd}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {Number(row.entity_ct).toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {Number(row.missing_coordinate_ct).toLocaleString()} missing
            coordinates
          </p>

          {row.entity_type_cd !== "ZN" ? (
            <p className="mt-1 text-xs text-slate-500">
              {Number(row.missing_parent_ct).toLocaleString()} missing
              parent
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SortableHeading({
  label,
  sortKey,
  currentSort,
  currentDir,
  q,
  type,
  entity,
  stickyLeft = false,
}: {
  label: string;
  sortKey: GeographySortKey;
  currentSort: GeographySortKey;
  currentDir: SortDir;
  q: string;
  type: string;
  entity: number | null;
  stickyLeft?: boolean;
}) {
  const selected = currentSort === sortKey;

  const nextDir: SortDir =
    selected && currentDir === "asc" ? "desc" : "asc";

  return (
    <th
      className={`sticky top-0 z-20 whitespace-nowrap bg-slate-100 px-4 py-3 text-left font-semibold ${
        stickyLeft
          ? "left-0 z-40 shadow-[2px_0_0_#e2e8f0]"
          : ""
      }`}
    >
      <Link
        href={buildGeographyHref({
          q,
          type,
          entity,
          sort: sortKey,
          dir: nextDir,
        })}
        className="hover:underline"
      >
        {label}

        {selected
          ? currentDir === "asc"
            ? " ▲"
            : " ▼"
          : ""}
      </Link>
    </th>
  );
}

function GeographyError({
  error,
}: {
  error: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold">
        Geography Maintenance
      </h1>

      <p className="mt-4 text-red-600">
        Error loading the Geography module.
      </p>

      <pre className="mt-4 whitespace-pre-wrap text-sm">
        {error}
      </pre>
    </main>
  );
}
