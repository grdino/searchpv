import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  approveBoundaryMatch,
  markBoundaryNonCommunity,
} from "../actions";

export const dynamic = "force-dynamic";

const QUEUE_PAGE_SIZE = 50;

const UNASSIGNED_ZONE_VALUE = "__UNASSIGNED__";

type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][][];
};

type BoundaryReviewRecord = {
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

type BoundaryRecord = {
  boundaryKy: number;
  boundaryName: string;
  boundaryType: string | null;
  geometry: GeoJsonMultiPolygon | null;
};

type CandidateRankRecord = {
  candidateRankNb?: number;
  candidate_rank_nb?: number;

  candidateEntityKy?: number;
  candidate_entity_ky?: number;

  candidateEntityIdentifierCd?: string;
  candidate_entity_identifier_cd?: string;

  candidateCommunityName?: string;
  candidate_community_nm?: string;

  candidateAreaName?: string;
  candidate_area_nm?: string;

  candidateZoneName?: string;
  candidate_zone_nm?: string;

  candidatePropertyCount?: number;
  candidate_property_count?: number;

  totalPropertyCount?: number;
  total_property_count?: number;

  spatialConfidenceNb?: number | string;
  spatial_confidence_nb?: number | string;

  normalizedNameExactFg?: boolean;
  normalized_name_exact_fg?: boolean;
};

type PropertyPointRecord = {
  propertyKy: number;
  latitude: number | null;
  longitude: number | null;

  zoneName: string | null;
  areaName: string | null;
  communityName: string | null;
  developmentName: string | null;
};

type BoundaryReviewDetail = {
  review: BoundaryReviewRecord | null;
  boundary: BoundaryRecord | null;
  candidateRanks?: CandidateRankRecord[];
  propertyPoints?: PropertyPointRecord[];
};

type PageProps = {
  params: Promise<{
    boundaryKy: string;
  }>;

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

function parseNumericValue(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatConfidence(
  value: number | string | null | undefined,
  fractionDigits = 1,
): string {
  const parsedValue = parseNumericValue(value);

  if (parsedValue === null) {
    return "—";
  }

  return `${(parsedValue * 100).toFixed(fractionDigits)}%`;
}

function formatCount(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
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

function buildQueueHref({
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

function buildDetailHref({
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

function getCandidateRank(
  candidate: CandidateRankRecord,
  index: number,
): number {
  return (
    candidate.candidateRankNb ??
    candidate.candidate_rank_nb ??
    index + 1
  );
}

function getCandidateEntityKy(
  candidate: CandidateRankRecord,
): number | null {
  return (
    candidate.candidateEntityKy ??
    candidate.candidate_entity_ky ??
    null
  );
}

function getCandidateIdentifier(
  candidate: CandidateRankRecord,
): string | null {
  return (
    candidate.candidateEntityIdentifierCd ??
    candidate.candidate_entity_identifier_cd ??
    null
  );
}

function getCandidateCommunity(
  candidate: CandidateRankRecord,
): string | null {
  return (
    candidate.candidateCommunityName ??
    candidate.candidate_community_nm ??
    null
  );
}

function getCandidateArea(
  candidate: CandidateRankRecord,
): string | null {
  return (
    candidate.candidateAreaName ??
    candidate.candidate_area_nm ??
    null
  );
}

function getCandidateZone(
  candidate: CandidateRankRecord,
): string | null {
  return (
    candidate.candidateZoneName ??
    candidate.candidate_zone_nm ??
    null
  );
}

function getCandidatePropertyCount(
  candidate: CandidateRankRecord,
): number {
  return Number(
    candidate.candidatePropertyCount ??
      candidate.candidate_property_count ??
      0,
  );
}

function getCandidateTotalPropertyCount(
  candidate: CandidateRankRecord,
): number {
  return Number(
    candidate.totalPropertyCount ??
      candidate.total_property_count ??
      0,
  );
}

function getCandidateConfidence(
  candidate: CandidateRankRecord,
): number | string | null {
  return (
    candidate.spatialConfidenceNb ??
    candidate.spatial_confidence_nb ??
    null
  );
}

function getCandidateExactName(
  candidate: CandidateRankRecord,
): boolean {
  return Boolean(
    candidate.normalizedNameExactFg ??
      candidate.normalized_name_exact_fg ??
      false,
  );
}

export default async function BoundaryReviewDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { boundaryKy: boundaryKyParam } = await params;
  const queueParams = await searchParams;

  const boundaryKy = Number.parseInt(boundaryKyParam, 10);

  if (!Number.isFinite(boundaryKy) || boundaryKy <= 0) {
    notFound();
  }

  const selectedZone =
    queueParams.zone?.trim() ?? "";

  const selectedRecommendation =
    queueParams.recommendation?.trim() ?? "";

  const searchText =
    queueParams.search?.trim() ?? "";

  const requestedQueuePage = Number.parseInt(
    queueParams.page ?? "1",
    10,
  );

  const queuePage =
    Number.isFinite(requestedQueuePage) &&
    requestedQueuePage > 0
      ? requestedQueuePage
      : 1;

  const supabase = await createClient();

  const { data, error } = await supabase
    .schema("geo")
    .rpc("get_boundary_review_detail", {
      p_boundary_ky: boundaryKy,
    });

  if (error) {
    throw new Error(
      `Unable to load boundary review detail: ${JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        boundaryKy,
      })}`,
    );
  }

  if (!data || typeof data !== "object") {
    notFound();
  }

  const detail = data as BoundaryReviewDetail;

  if (!detail.review || !detail.boundary) {
    notFound();
  }

  let navigationQuery = supabase
    .schema("geo")
    .from("v_boundary_review_queue")
    .select(
      "boundary_ky, boundary_nm, recommendation_cd, candidate_zone_nm",
    );

  if (selectedZone === UNASSIGNED_ZONE_VALUE) {
    navigationQuery = navigationQuery.is(
      "candidate_zone_nm",
      null,
    );
  } else if (selectedZone) {
    navigationQuery = navigationQuery.eq(
      "candidate_zone_nm",
      selectedZone,
    );
  }

  if (selectedRecommendation) {
    navigationQuery = navigationQuery.eq(
      "recommendation_cd",
      selectedRecommendation,
    );
  }

  if (searchText) {
    navigationQuery = navigationQuery.ilike(
      "boundary_nm",
      `%${searchText}%`,
    );
  }

  const {
    data: navigationData,
    error: navigationError,
  } = await navigationQuery
    .order("recommendation_cd")
    .order("boundary_nm");

  if (navigationError) {
    throw new Error(
      `Unable to load boundary review navigation: ${JSON.stringify({
        message: navigationError.message,
        code: navigationError.code,
        details: navigationError.details,
        hint: navigationError.hint,
        boundaryKy,
      })}`,
    );
  }

  const navigationRows =
    (navigationData ?? []) as Array<{
      boundary_ky: number;
      boundary_nm: string;
      recommendation_cd: string;
      candidate_zone_nm: string | null;
    }>;

  const currentNavigationIndex =
    navigationRows.findIndex(
      (row) => row.boundary_ky === boundaryKy,
    );

  const previousBoundary =
    currentNavigationIndex > 0
      ? navigationRows[currentNavigationIndex - 1]
      : null;

  const nextBoundary =
    currentNavigationIndex >= 0 &&
    currentNavigationIndex < navigationRows.length - 1
      ? navigationRows[currentNavigationIndex + 1]
      : null;

  const previousQueuePage =
    currentNavigationIndex > 0
      ? Math.floor(
          (currentNavigationIndex - 1) / QUEUE_PAGE_SIZE,
        ) + 1
      : 1;

  const nextQueuePage =
    currentNavigationIndex >= 0
      ? Math.floor(
          (currentNavigationIndex + 1) / QUEUE_PAGE_SIZE,
        ) + 1
      : queuePage;

  const queueHref = buildQueueHref({
    zone: selectedZone,
    recommendation: selectedRecommendation,
    search: searchText,
    page: queuePage,
  });

  const previousHref = previousBoundary
    ? buildDetailHref({
        boundaryKy: previousBoundary.boundary_ky,
        zone: selectedZone,
        recommendation: selectedRecommendation,
        search: searchText,
        page: previousQueuePage,
      })
    : null;

  const nextHref = nextBoundary
    ? buildDetailHref({
        boundaryKy: nextBoundary.boundary_ky,
        zone: selectedZone,
        recommendation: selectedRecommendation,
        search: searchText,
        page: nextQueuePage,
      })
    : null;

  const review = detail.review;
  const boundary = detail.boundary;
  const propertyPoints = detail.propertyPoints ?? [];

  const candidateRanks =
    detail.candidateRanks && detail.candidateRanks.length > 0
      ? detail.candidateRanks
      : [];

  const bestCandidateHierarchy = [
    review.candidate_zone_nm,
    review.candidate_area_nm,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
          <Link
            href="/office/geography"
            className="transition hover:text-slate-900"
          >
            Geography
          </Link>

          <span>/</span>

          <Link
            href={queueHref}
            className="transition hover:text-slate-900"
          >
            Boundary Review
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            Boundary #{boundary.boundaryKy}
          </span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {boundary.boundaryName}
              </h1>

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {boundary.boundaryType ?? "Boundary"}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Municipal boundary #{boundary.boundaryKy}
            </p>
          </div>

          <Link
            href={queueHref}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back to Review Queue
          </Link>
        </div>
      </div>

      <section className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {currentNavigationIndex >= 0 ? (
            <>
              Boundary{" "}
              <span className="font-semibold text-slate-900">
                {currentNavigationIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {navigationRows.length}
              </span>
              {selectedZone ? (
                <>
                  {" "}
                  in{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedZone === UNASSIGNED_ZONE_VALUE
                      ? "Unassigned / No SearchPV Zone"
                      : selectedZone}
                  </span>
                </>
              ) : null}

              {selectedRecommendation ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-slate-900">
                    {formatRecommendation(
                      selectedRecommendation,
                    )}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            "This boundary is not in the current filtered queue."
          )}
        </div>

        <div className="flex items-center gap-2">
          {previousHref ? (
            <Link
              href={previousHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Previous
            </Link>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
              ← Previous
            </span>
          )}

          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Next →
            </Link>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg bg-slate-300 px-4 text-sm font-medium text-white">
              Next →
            </span>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recommendation
            </div>

            <div className="mt-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${recommendationBadgeClasses(
                  review.recommendation_cd,
                )}`}
              >
                {formatRecommendation(review.recommendation_cd)}
              </span>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {review.recommendation_tx}
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confidence
              </div>

              <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
                {formatConfidence(review.spatial_confidence_nb, 2)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                MLS evidence
              </div>

              <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
                {formatCount(review.candidate_property_count)}
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / {formatCount(review.total_property_count)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Best Candidate Match
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                The strongest canonical SearchPV community match based on
                contained MLS property points.
              </p>
            </div>

            <div className="p-5">
              {review.candidate_community_nm ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Recommended canonical community
                      </div>

                      <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                        {review.candidate_community_nm}
                      </h3>

                      {bestCandidateHierarchy ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {bestCandidateHierarchy}
                        </p>
                      ) : null}

                      <div className="mt-4 space-y-1 text-xs text-slate-500">
                        <div>
                          Entity key:{" "}
                          <span className="font-medium text-slate-700">
                            {review.candidate_entity_ky ?? "Not found"}
                          </span>
                        </div>

                        <div className="break-all">
                          Identifier:{" "}
                          <span className="font-medium text-slate-700">
                            {review.candidate_entity_identifier_cd ?? "—"}
                          </span>
                        </div>

                        <div>
                          Entity type:{" "}
                          <span className="font-medium text-slate-700">
                            {review.candidate_entity_type_cd ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                      <div className="rounded-lg border border-blue-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-500">
                          Properties
                        </div>

                        <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                          {formatCount(review.candidate_property_count)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-500">
                          Confidence
                        </div>

                        <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                          {formatConfidence(
                            review.spatial_confidence_nb,
                            2,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-blue-200 pt-4 text-sm">
                    {review.normalized_name_exact_fg ? (
                      <span className="font-medium text-emerald-700">
                        The normalized municipal and MLS community names
                        match.
                      </span>
                    ) : (
                      <span className="font-medium text-blue-800">
                        The spatial evidence is strong, but the municipal
                        and MLS names differ.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-900">
                    No canonical community candidate
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This boundary does not currently have a spatially
                    supported SearchPV community match.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Candidate Rankings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Alternative canonical communities found within this
                municipal polygon.
              </p>
            </div>

            {candidateRanks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {candidateRanks.map((candidate, index) => {
                  const rank = getCandidateRank(candidate, index);
                  const entityKy = getCandidateEntityKy(candidate);
                  const identifier = getCandidateIdentifier(candidate);
                  const community = getCandidateCommunity(candidate);
                  const area = getCandidateArea(candidate);
                  const zone = getCandidateZone(candidate);
                  const propertyCount =
                    getCandidatePropertyCount(candidate);
                  const totalPropertyCount =
                    getCandidateTotalPropertyCount(candidate);
                  const confidence =
                    getCandidateConfidence(candidate);
                  const exactName =
                    getCandidateExactName(candidate);

                  return (
                    <div
                      key={`${entityKy ?? "candidate"}-${rank}`}
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {rank}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-slate-950">
                              {community ?? "Unknown community"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {[zone, area].filter(Boolean).join(" · ") ||
                                "Hierarchy unavailable"}
                            </p>

                            <div className="mt-2 break-all text-xs text-slate-400">
                              {identifier ?? `Entity ${entityKy ?? "—"}`}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
                          <div className="rounded-lg bg-slate-50 p-3 text-right">
                            <div className="text-xs text-slate-500">
                              Evidence
                            </div>

                            <div className="mt-1 font-semibold tabular-nums text-slate-900">
                              {formatCount(propertyCount)}
                              {totalPropertyCount > 0
                                ? ` / ${formatCount(totalPropertyCount)}`
                                : ""}
                            </div>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3 text-right">
                            <div className="text-xs text-slate-500">
                              Confidence
                            </div>

                            <div className="mt-1 font-semibold tabular-nums text-slate-900">
                              {formatConfidence(confidence, 2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pl-0 text-xs sm:pl-13">
                        {exactName ? (
                          <span className="font-medium text-emerald-700">
                            Exact normalized name
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Municipal and MLS names differ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Ranked candidate list not returned
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The detail function returned the best match, but it did
                    not include a candidateRanks array. The page can still
                    be reviewed using the best-candidate section above.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Contained MLS Properties
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  MLS property coordinates located inside the municipal
                  polygon.
                </p>
              </div>

              <div className="text-sm font-medium tabular-nums text-slate-600">
                {propertyPoints.length.toLocaleString("en-US")} properties
              </div>
            </div>

            {propertyPoints.length > 0 ? (
              <div className="max-h-[620px] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Property
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Development
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        MLS hierarchy
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Coordinates
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {propertyPoints.map((property) => (
                      <tr
                        key={property.propertyKy}
                        className="align-top hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            #{property.propertyKy}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="max-w-xs font-medium text-slate-900">
                            {property.developmentName ||
                              "No development name"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {property.communityName ||
                              "No community name"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {[
                              property.zoneName,
                              property.areaName,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Hierarchy unavailable"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">
                          {property.latitude !== null &&
                          property.longitude !== null ? (
                            <>
                              <div>{property.latitude.toFixed(6)}</div>
                              <div>{property.longitude.toFixed(6)}</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <h3 className="font-semibold text-slate-900">
                  No contained property points
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No MLS property coordinates were returned for this
                  polygon.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Review Actions
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Approve the suggested entity or classify this polygon as non-community.
            </p>

            <div className="mt-5 space-y-3">

              {review.candidate_entity_ky ? (
                <form action={approveBoundaryMatch}>
                  <input
                    type="hidden"
                    name="boundaryKy"
                    value={boundary.boundaryKy}
                  />

                  <input
                    type="hidden"
                    name="entityKy"
                    value={review.candidate_entity_ky}
                  />

                  <input
                    type="hidden"
                    name="matchedName"
                    value={review.candidate_community_nm ?? ""}
                  />

                  <input
                    type="hidden"
                    name="confidence"
                    value={review.spatial_confidence_nb ?? 0}
                  />

                  <input
                    type="hidden"
                    name="candidateRank"
                    value="1"
                  />

                  <input
                    type="hidden"
                    name="nextHref"
                    value={nextHref ?? queueHref}
                  />


                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                    }}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition hover:opacity-90"
                  >
                    ✓ Approve Best Candidate
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 px-4 text-sm font-semibold text-slate-500"
                >
                  No Candidate Available
                </button>
              )}

              <form action={markBoundaryNonCommunity}>

                <input
                  type="hidden"
                  name="boundaryKy"
                  value={boundary.boundaryKy}
                />

                <input
                  type="hidden"
                  name="nextHref"
                  value={nextHref ?? queueHref}
                />

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Mark Non-Community
                </button>

              </form>

            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Map Preview
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              The boundary geometry has loaded successfully. Mapbox will be
              added after this first page is confirmed.
            </p>

            <div className="mt-4 flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <div className="text-sm font-semibold text-slate-700">
                  Polygon available
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  GeoJSON type:{" "}
                  {boundary.geometry?.type ?? "Not returned"}
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  This area will become the interactive boundary and MLS
                  property map.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Boundary Information
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Boundary key</dt>
                <dd className="font-medium text-slate-900">
                  {boundary.boundaryKy}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Boundary type</dt>
                <dd className="font-medium text-slate-900">
                  {boundary.boundaryType ?? "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Candidate entity</dt>
                <dd className="font-medium text-slate-900">
                  {review.candidate_entity_ky ?? "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Contained points</dt>
                <dd className="font-medium text-slate-900">
                  {propertyPoints.length.toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}