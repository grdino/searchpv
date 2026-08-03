import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import ZoneFilterSelect from "./ZoneFilterSelect";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const UNASSIGNED_ZONE_VALUE = "__UNASSIGNED__";

const ALL_ZONES_SUMMARY_VALUE = "__ALL__";

const SEARCHPV_ZONE_OPTIONS = [
  "Puerto Vallarta",
  "Riviera Nayarit",
  "Other",
] as const;

type BoundaryReviewSummaryRow = {
  recommendation_cd: string;
  boundary_count: number;
  zone_filter_cd: string;
};

type BoundaryReviewQueueRow = {
  boundary_ky: number;
  boundary_nm: string;
  boundary_type_cd: string | null;

  candidate_entity_ky: number | null;
  candidate_entity_identifier_cd: string | null;
  candidate_entity_type_cd: string | null;

  candidate_zone_nm: string | null;
  candidate_area_nm: string | null;
  candidate_community_nm: string | null;

  candidate_property_count: number;
  total_property_count: number;

  spatial_confidence_nb: number | string | null;
  normalized_name_exact_fg: boolean | null;

  recommendation_cd: string;
  recommendation_tx: string;
};

type PageProps = {
  searchParams: Promise<{
    zone?: string;
    recommendation?: string;
    search?: string;
    page?: string;
  }>;
};

function formatRecommendation(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatConfidence(value: number | string | null): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (!Number.isFinite(parsedValue)) {
    return "—";
  }

  return `${(parsedValue * 100).toFixed(1)}%`;
}

function recommendationBadgeClasses(recommendation: string): string {
  switch (recommendation) {
    case "AUTO_APPROVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "MANUAL_ALIAS":
      return "border-blue-200 bg-blue-50 text-blue-800";

    case "MANUAL_SPATIAL":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";

    case "NEW_COMMUNITY":
      return "border-purple-200 bg-purple-50 text-purple-800";

    case "NON_COMMUNITY":
      return "border-slate-300 bg-slate-100 text-slate-700";

    case "INSUFFICIENT_SPATIAL_DATA":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "NO_MATCH":
      return "border-rose-200 bg-rose-50 text-rose-800";

    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

function buildPageHref({
  zone,
  recommendation,
  search,
  page,
}: {
  zone: string;
  recommendation: string;
  search: string;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (zone) {
    params.set("zone", zone);
  }

  if (recommendation) {
    params.set("recommendation", recommendation);
  }

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString
    ? `/office/geography/boundary-review?${queryString}`
    : "/office/geography/boundary-review";
}

function buildReviewHref({
  boundaryKy,
  zone,
  recommendation,
  search,
  page,
}: {
  boundaryKy: number;
  zone: string;
  recommendation: string;
  search: string;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (zone) {
    params.set("zone", zone);
  }

  if (recommendation) {
    params.set("recommendation", recommendation);
  }

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  const pathname =
    `/office/geography/boundary-review/${boundaryKy}`;

  return queryString
    ? `${pathname}?${queryString}`
    : pathname;
}

export default async function BoundaryReviewPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const selectedZone = params.zone?.trim() ?? "";
  const summaryZoneFilter =
    selectedZone || ALL_ZONES_SUMMARY_VALUE;
  const selectedRecommendation = params.recommendation?.trim() ?? "";
  const searchText = params.search?.trim() ?? "";

  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const rangeStart = (currentPage - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: summaryData, error: summaryError } = await supabase
    .schema("geo")
    .from("v_boundary_review_summary")
    .select(
      "recommendation_cd, boundary_count, zone_filter_cd",
    )
    .eq("zone_filter_cd", summaryZoneFilter)
    .order("recommendation_cd");

  let queueQuery = supabase
    .schema("geo")
    .from("v_boundary_review_queue")
    .select("*", {
      count: "exact",
    });

  if (selectedZone === UNASSIGNED_ZONE_VALUE) {
    queueQuery = queueQuery.is("candidate_zone_nm", null);
  } else if (selectedZone) {
    queueQuery = queueQuery.eq(
      "candidate_zone_nm",
      selectedZone,
    );
  }

  if (selectedRecommendation) {
    queueQuery = queueQuery.eq(
      "recommendation_cd",
      selectedRecommendation,
    );
  }

  if (searchText) {
    queueQuery = queueQuery.ilike(
      "boundary_nm",
      `%${searchText}%`,
    );
  }

  const {
    data: queueData,
    error: queueError,
    count,
  } = await queueQuery
    .order("recommendation_cd")
    .order("boundary_nm")
    .range(rangeStart, rangeEnd);

  if (summaryError) {
    throw new Error(
        `Unable to load boundary review summary: ${JSON.stringify({
        message: summaryError.message,
        code: summaryError.code,
        details: summaryError.details,
        hint: summaryError.hint,
        })}`,
    );
    }

    if (queueError) {
    throw new Error(
        `Unable to load boundary review queue: ${JSON.stringify({
        message: queueError.message,
        code: queueError.code,
        details: queueError.details,
        hint: queueError.hint,
        })}`,
    );
    }

  const summary =
    (summaryData ?? []) as BoundaryReviewSummaryRow[];

  const boundaries =
    (queueData ?? []) as BoundaryReviewQueueRow[];

  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const totalUnresolved = summary.reduce(
    (total, row) => total + Number(row.boundary_count),
    0,
  );

  const previousHref = buildPageHref({
    zone: selectedZone,
    recommendation: selectedRecommendation,
    search: searchText,
    page: Math.max(1, currentPage - 1),
  });

  const nextHref = buildPageHref({
    zone: selectedZone,
    recommendation: selectedRecommendation,
    search: searchText,
    page: Math.min(totalPages, currentPage + 1),
  });

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-500">
            <Link
              href="/office/geography"
              className="transition hover:text-slate-900"
            >
              Geography
            </Link>

            <span className="mx-2">/</span>

            <span>Boundary Review</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Municipal Boundary Review
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review unresolved municipal polygons against canonical SearchPV
            communities using spatial MLS evidence.
          </p>
        </div>

        <Link
          href="/office/geography"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to Geography
        </Link>
      </div>

      {summaryError || queueError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The boundary review data could not be loaded completely. Check the
          server console for the Supabase error.
        </div>
      ) : null}

      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Review Summary
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {selectedZone
              ? selectedZone === UNASSIGNED_ZONE_VALUE
                ? "Unassigned / No SearchPV Zone"
                : selectedZone
              : "All SearchPV zones"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href={buildPageHref({
              zone: selectedZone,
              recommendation: "",
              search: searchText,
              page: 1,
            })}
            className={`rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              selectedRecommendation === ""
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-950"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                selectedRecommendation === ""
                  ? "text-slate-300"
                  : "text-slate-500"
              }`}
            >
              All unresolved
            </div>

            <div className="mt-2 text-3xl font-semibold">
              {totalUnresolved.toLocaleString("en-US")}
            </div>
          </Link>

          {summary.map((row) => {
            const isSelected =
              selectedRecommendation === row.recommendation_cd;

            const href = buildPageHref({
              zone: selectedZone,
              recommendation: row.recommendation_cd,
              search: searchText,
              page: 1,
            });

            return (
              <Link
                key={row.recommendation_cd}
                href={href}
                className={`rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {formatRecommendation(row.recommendation_cd)}
                </div>

                <div className="mt-2 text-3xl font-semibold">
                  {Number(row.boundary_count).toLocaleString("en-US")}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <form
            method="get"
            className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_260px_auto_auto]"
          >
          <div>
            <label
              htmlFor="zone"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              SearchPV Zone
            </label>

            <ZoneFilterSelect
              selectedZone={selectedZone}
              zones={SEARCHPV_ZONE_OPTIONS}
              unassignedValue={UNASSIGNED_ZONE_VALUE}
            />
          </div>
            <div>
              <label
                htmlFor="search"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Boundary name
              </label>

              <input
                id="search"
                name="search"
                type="search"
                defaultValue={searchText}
                placeholder="Search municipal boundary..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="recommendation"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Recommendation
              </label>

              <select
                id="recommendation"
                name="recommendation"
                defaultValue={selectedRecommendation}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All recommendations</option>

                {summary.map((row) => (
                  <option
                    key={row.recommendation_cd}
                    value={row.recommendation_cd}
                  >
                    {formatRecommendation(row.recommendation_cd)} (
                    {row.boundary_count})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Apply filters
            </button>

            <Link
              href="/office/geography/boundary-review"
              className="mt-auto inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </form>
        </div>

        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {totalRows === 0 ? 0 : rangeStart + 1}
            </span>
            {"–"}
            <span className="font-semibold text-slate-900">
              {Math.min(rangeEnd + 1, totalRows)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {totalRows.toLocaleString("en-US")}
            </span>
          </div>

          <div>
            Page{" "}
            <span className="font-semibold text-slate-900">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {totalPages}
            </span>
          </div>
        </div>

        {boundaries.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No matching boundaries
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Try clearing the zone, search, or recommendation filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Boundary
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recommendation
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Candidate hierarchy
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evidence
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Confidence
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {boundaries.map((boundary) => (
                  <tr
                    key={boundary.boundary_ky}
                    className="align-top transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">
                        {boundary.boundary_nm}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Boundary #{boundary.boundary_ky}

                        {boundary.boundary_type_cd
                          ? ` · ${boundary.boundary_type_cd}`
                          : ""}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${recommendationBadgeClasses(
                          boundary.recommendation_cd,
                        )}`}
                      >
                        {formatRecommendation(
                          boundary.recommendation_cd,
                        )}
                      </span>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                        {boundary.recommendation_tx}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {boundary.candidate_community_nm ? (
                        <>
                          <div className="font-medium text-slate-900">
                            {boundary.candidate_community_nm}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {[
                              boundary.candidate_zone_nm,
                              boundary.candidate_area_nm,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>

                          {!boundary.candidate_entity_ky ? (
                            <div className="mt-1 text-xs font-medium text-rose-700">
                              No canonical entity found
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No spatial candidate
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="font-medium tabular-nums text-slate-900">
                        {Number(
                          boundary.candidate_property_count ?? 0,
                        ).toLocaleString("en-US")}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        of{" "}
                        {Number(
                          boundary.total_property_count ?? 0,
                        ).toLocaleString("en-US")}{" "}
                        properties
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="font-medium tabular-nums text-slate-900">
                        {formatConfidence(
                          boundary.spatial_confidence_nb,
                        )}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {boundary.normalized_name_exact_fg
                          ? "Exact normalized name"
                          : "Names differ"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={buildReviewHref({
                          boundaryKy: boundary.boundary_ky,
                          zone: selectedZone,
                          recommendation: selectedRecommendation,
                          search: searchText,
                          page: currentPage,
                        })}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-4 sm:px-5">
          {currentPage > 1 ? (
            <Link
              href={previousHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
              Previous
            </span>
          )}

          <span className="text-sm text-slate-500">
            {PAGE_SIZE} boundaries per page
          </span>

          {currentPage < totalPages ? (
            <Link
              href={nextHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
              Next
            </span>
          )}
        </div>
      </section>
    </main>
  );
}