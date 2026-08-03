import type { GeographyEntityListRow } from "./types";

export type GeographySortKey =
  | "canonical_nm"
  | "entity_type_cd"
  | "parent_nm"
  | "variant_ct"
  | "child_ct";

export type SortDir = "asc" | "desc";

const VALID_SORT_KEYS: GeographySortKey[] = [
  "canonical_nm",
  "entity_type_cd",
  "parent_nm",
  "variant_ct",
  "child_ct",
];

export function getSortKey(value?: string): GeographySortKey {
  return VALID_SORT_KEYS.includes(value as GeographySortKey)
    ? (value as GeographySortKey)
    : "canonical_nm";
}

export function getSortDir(value?: string): SortDir {
  return value === "desc" ? "desc" : "asc";
}

export function sortEntities(
  rows: GeographyEntityListRow[],
  sortKey: GeographySortKey,
  sortDir: SortDir,
) {
  return [...rows].sort((left, right) => {
    const a = left[sortKey];
    const b = right[sortKey];

    let comparison = 0;

    if (typeof a === "number" && typeof b === "number") {
      comparison = a - b;
    } else {
      comparison = String(a ?? "").localeCompare(
        String(b ?? ""),
        "en",
        {
          sensitivity: "base",
          numeric: true,
        },
      );
    }

    if (comparison === 0) {
      comparison = left.canonical_nm.localeCompare(
        right.canonical_nm,
        "en",
        {
          sensitivity: "base",
          numeric: true,
        },
      );
    }

    return sortDir === "asc" ? comparison : -comparison;
  });
}

export function buildGeographyHref({
  q,
  type,
  entity,
  sort,
  dir,
}: {
  q?: string;
  type?: string;
  entity?: number | null;
  sort?: GeographySortKey;
  dir?: SortDir;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (type) {
    params.set("type", type);
  }

  if (entity) {
    params.set("entity", String(entity));
  }

  if (sort) {
    params.set("sort", sort);
  }

  if (dir) {
    params.set("dir", dir);
  }

  const query = params.toString();

  return query
    ? `/office/geography?${query}`
    : "/office/geography";
}

export function parseEntityKey(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}
