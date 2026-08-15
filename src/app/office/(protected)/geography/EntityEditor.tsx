import Link from "next/link";

import {
  deleteEntity,
  deleteVariant,
  saveBoundaryFootprint,
  saveEntity,
  saveVariant,
} from "./actions";
import { buildGeographyHref } from "./geography-utils";
import type {
  GeographyEntityBoundaryReviewRow,
  GeographyEntityDetail,
  GeographyLookupData,
  GeographyParentOption,
} from "./types";
import type {
  GeographySortKey,
  SortDir,
} from "./geography-utils";

type GeographyBoundaryMapData = {
  entity: {
    entityKy: number;
    zoneName: string;
    areaName: string;
    communityName: string;
  } | null;

  boundaries: Array<{
    boundaryKy: number;
    boundaryName: string;
    boundaryType: string;
    rank: number;
    listingCount: number;
    totalListingCount: number;
    listingPercent: number;
    cumulativeListingPercent: number;
    selected: boolean;
    geometry: GeoJSON.Geometry;
  }>;

  propertyPoints: Array<{
    listingKy: number;
    propertyKy: number;
    source: string;
    longitude: number;
    latitude: number;
  }>;
};

function parentLabel(entityTypeCd: string) {
  switch (entityTypeCd) {
    case "AR":
      return "Parent Zone";
    case "CM":
      return "Parent Area";
    case "DV":
      return "Parent Community";
    case "BD":
      return "Parent Development";
    case "NB":
      return "Parent Community";
    case "PL":
      return "Parent Community";
    default:
      return "Parent";
  }
}

function HiddenReturnFields({
  q,
  type,
  sort,
  dir,
}: {
  q: string;
  type: string;
  sort: GeographySortKey;
  dir: SortDir;
}) {
  return (
    <>
      <input type="hidden" name="return_q" value={q} />
      <input type="hidden" name="return_type" value={type} />
      <input type="hidden" name="return_sort" value={sort} />
      <input type="hidden" name="return_dir" value={dir} />
    </>
  );
}

export default function EntityEditor({
  detail,
  lookups,
  parentOptions,
  q,
  type,
  sort,
  dir,
}: {
  detail: GeographyEntityDetail | null;
  lookups: GeographyLookupData;
  parentOptions: GeographyParentOption[];
  q: string;
  type: string;
  sort: GeographySortKey;
  dir: SortDir;
}) {
  const entity = detail?.entity ?? null;
  const canonical = detail?.canonical ?? null;

  const selectedType =
    entity?.entity_type_cd ||
    type ||
    lookups.entity_types.find((option) => option.code === "DV")
      ?.code ||
    lookups.entity_types[0]?.code ||
    "DV";

  const nonCanonicalVariants =
    detail?.variants.filter(
      (variant) => variant.variant_type_cd !== "CA",
    ) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
              Entity Editor
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {entity
                ? canonical?.entity_variant_nm ||
                  entity.entity_identifier_cd
                : "New Entity"}
            </h2>

            {entity ? (
              <p className="mt-1 font-mono text-xs text-slate-500">
                Entity {entity.entity_ky}
              </p>
            ) : null}
          </div>

          {entity ? (
            <Link
              href={buildGeographyHref({
                q,
                type,
                sort,
                dir,
              })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Create New
            </Link>
          ) : null}
        </div>

        <form action={saveEntity} className="mt-6 grid gap-5 md:grid-cols-2">
          <HiddenReturnFields q={q} type={type} sort={sort} dir={dir} />

          <input
            type="hidden"
            name="entity_ky"
            value={entity?.entity_ky ?? ""}
          />

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Canonical Name
            </span>

            <input
              name="canonical_nm"
              defaultValue={canonical?.entity_variant_nm ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Entity Identifier
            </span>

            <input
              name="entity_identifier_cd"
              defaultValue={entity?.entity_identifier_cd ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder="dv__zone__area__community__development"
            />

            <span className="block text-xs text-slate-500">
              Treat this as a stable technical identifier after the
              entity is in use.
            </span>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Entity Type
            </span>

            <select
              name="entity_type_cd"
              defaultValue={selectedType}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {lookups.entity_types.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name ?? option.code}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Source
            </span>

            <select
              name="entity_source_cd"
              defaultValue={entity?.entity_source_cd ?? "ME"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {lookups.entity_sources.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name ?? option.code}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Longitude
            </span>

            <input
              name="longitude_nb"
              type="number"
              step="0.0000001"
              min="-180"
              max="180"
              defaultValue={entity?.longitude_nb ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Latitude
            </span>

            <input
              name="latitude_nb"
              type="number"
              step="0.0000001"
              min="-90"
              max="90"
              defaultValue={entity?.latitude_nb ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Canonical Language
            </span>

            <select
              name="canonical_language_cd"
              defaultValue={canonical?.language_cd ?? "EN"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {lookups.languages.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name ?? option.code}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              {parentLabel(selectedType)}
            </span>

            <select
              name="parent_entity_ky"
              defaultValue={detail?.parent?.entity_ky ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">No Parent</option>

              {parentOptions.map((option) => (
                <option
                  key={option.entity_ky}
                  value={option.entity_ky}
                >
                  {option.canonical_nm}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Save Entity
            </button>
          </div>
        </form>

        {entity ? (
          <form action={deleteEntity} className="mt-6 border-t pt-5">
            <HiddenReturnFields q={q} type={type} sort={sort} dir={dir} />
            <input
              type="hidden"
              name="entity_ky"
              value={entity.entity_ky}
            />

            <button
              type="submit"
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete Entity
            </button>

            <p className="mt-2 text-xs text-slate-500">
              This is blocked when the entity has child entities.
              Current child count: {detail?.child_count ?? 0}.
            </p>
          </form>
        ) : null}
      </section>

      {entity ? (
        <section className="rounded-xl bg-white p-5 shadow">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            Names and Aliases
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Alternate Names
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add MLS spellings, common names, abbreviations,
            translations, and other names that should resolve to this
            entity.
          </p>

          <form action={saveVariant} className="mt-5 space-y-4">
            <HiddenReturnFields
              q={q}
              type={type}
              sort={sort}
              dir={dir}
            />

            <input
              type="hidden"
              name="entity_ky"
              value={entity.entity_ky}
            />

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">
                Alternate Name
              </span>

              <input
                name="entity_variant_nm"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Variant Type
                </span>

                <select
                  name="variant_type_cd"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {lookups.variant_types
                    .filter((option) => option.code !== "CA")
                    .map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name ?? option.code}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Language
                </span>

                <select
                  name="variant_language_cd"
                  defaultValue="EN"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {lookups.languages.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name ?? option.code}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Add Alternate Name
            </button>
          </form>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {nonCanonicalVariants.map((variant) => (
                  <tr
                    key={variant.entity_variant_ky}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 font-medium">
                      {variant.entity_variant_nm}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {variant.variant_type_nm ??
                        variant.variant_type_cd}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {variant.language_cd ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <form action={deleteVariant}>
                        <HiddenReturnFields
                          q={q}
                          type={type}
                          sort={sort}
                          dir={dir}
                        />

                        <input
                          type="hidden"
                          name="entity_ky"
                          value={entity.entity_ky}
                        />

                        <input
                          type="hidden"
                          name="entity_variant_ky"
                          value={variant.entity_variant_ky}
                        />

                        <button
                          type="submit"
                          className="text-sm font-semibold text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}

                {nonCanonicalVariants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No alternate names have been added.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
