"use client";

import {
  useMemo,
  useState,
} from "react";

import BoundaryReviewMap from "./BoundaryReviewMap";
import { saveBoundaryFootprint } from "./actions";
import type { Geometry } from "geojson";

type BoundaryReviewRow = {
  entity_ky: number;

  zone_nm: string;
  area_nm: string;
  community_nm: string;

  boundary_rank_nb: number;

  boundary_ky: number;
  boundary_nm: string;
  boundary_type_cd: string;

  listing_ct: number;
  total_listing_ct: number;

  listing_pc: number;
  cumulative_listing_pc: number;

  selected_fl: boolean;

  name_score_nb: number;
  spatial_evidence_fl: boolean;
  name_evidence_fl: boolean;
  evidence_cd: string;
};

type BoundaryMapData = {
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

    geometry: Geometry;
  }>;

  nearbyBoundaries: Array<{
    boundaryKy: number;
    boundaryName: string;
    boundaryType: string;
    selected: boolean;

    geometry: Geometry;
  }>;

  propertyPoints: Array<{
    listingKy: number;
    propertyKy: number;

    source: string;

    longitude: number;
    latitude: number;
  }>;
};

export default function BoundaryFootprintEditor({
  entityKy,
  boundaryReviewRows,
  boundaryMapData,

  returnQ,
  returnType,
  returnSort,
  returnDir,
}: {
  entityKy: number;

  boundaryReviewRows:
    BoundaryReviewRow[];

  boundaryMapData:
    BoundaryMapData | null;

  returnQ: string;
  returnType: string;
  returnSort: string;
  returnDir: string;
}) {
  /*
   * ----------------------------------------------------------
   * Local working selection.
   *
   * Checking/unchecking polygons changes only this client-side
   * state until Save Boundary Footprint is pressed.
   * ----------------------------------------------------------
   */

  const [
    selectedBoundaryKys,
    setSelectedBoundaryKys,
  ] = useState<number[]>(() => {
    const selectedKys =
      new Set<number>();

    for (
      const boundary
      of boundaryMapData?.boundaries ?? []
    ) {
      if (boundary.selected) {
        selectedKys.add(
          boundary.boundaryKy,
        );
      }
    }

    for (
      const boundary
      of boundaryMapData?.nearbyBoundaries ?? []
    ) {
      if (boundary.selected) {
        selectedKys.add(
          boundary.boundaryKy,
        );
      }
    }

    return Array.from(
      selectedKys,
    );
  });

  const selectedSet = useMemo(
    () =>
      new Set(
        selectedBoundaryKys,
      ),
    [selectedBoundaryKys],
  );

  /*
   * ----------------------------------------------------------
   * Candidate boundary IDs.
   *
   * Used to distinguish algorithm-generated review candidates
   * from additional government boundaries selected directly
   * from the map.
   * ----------------------------------------------------------
   */

  const candidateBoundaryKySet =
    useMemo(
      () =>
        new Set(
          boundaryReviewRows.map(
            (row) =>
              row.boundary_ky,
          ),
        ),
      [boundaryReviewRows],
    );

  /*
   * ----------------------------------------------------------
   * Additional boundaries selected directly from the map.
   * ----------------------------------------------------------
   */

  const manualSelectedBoundaries =
    useMemo(
      () =>
        (
          boundaryMapData
            ?.nearbyBoundaries ??
          []
        ).filter(
          (boundary) =>
            selectedSet.has(
              boundary.boundaryKy,
            ) &&
            !candidateBoundaryKySet.has(
              boundary.boundaryKy,
            ),
        ),
      [
        boundaryMapData,
        candidateBoundaryKySet,
        selectedSet,
      ],
    );

  /*
   * ----------------------------------------------------------
   * Live selected coverage.
   *
   * Only review candidates have listing percentages, so manually
   * added government polygons do not artificially change this
   * calculated percentage.
   * ----------------------------------------------------------
   */

  const selectedCoverage =
    boundaryReviewRows
      .filter((row) =>
        selectedSet.has(
          row.boundary_ky,
        ),
      )
      .reduce(
        (total, row) =>
          total +
          Number(
            row.listing_pc,
          ),
        0,
      );

  function toggleBoundary(
    boundaryKy: number,
    checked: boolean,
  ) {
    setSelectedBoundaryKys(
      (current) => {
        if (checked) {
          return current.includes(
            boundaryKy,
          )
            ? current
            : [
                ...current,
                boundaryKy,
              ];
        }

        return current.filter(
          (value) =>
            value !== boundaryKy,
        );
      },
    );
  }

  const hasMapBoundaries =
    Boolean(
      boundaryMapData &&
      (
        boundaryMapData.boundaries.length > 0 ||
        boundaryMapData.nearbyBoundaries.length > 0
      ),
    );

  return (
    <section className="rounded-xl bg-white p-5 shadow md:p-6">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
        Spatial Definition
      </p>

      <h2 className="mt-1 text-2xl font-bold text-slate-950">
        MLS Boundary Footprint
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Select the government boundaries that best
        represent this MLS community. Changes appear on
        the map immediately and are written to the
        database only when you save. You can also select
        additional government boundaries directly from
        the map.
      </p>

      {/* =====================================================
          DESKTOP:
          selection panel + map

          MOBILE:
          stacked automatically
          ===================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 md:items-start">
        {/* ===================================================
            LEFT — SELECTION PANEL
            =================================================== */}

        <div className="min-w-0">
          <form
            action={
              saveBoundaryFootprint
            }
          >
            {/* Return navigation state */}

            <input
              type="hidden"
              name="return_q"
              value={returnQ}
            />

            <input
              type="hidden"
              name="return_type"
              value={returnType}
            />

            <input
              type="hidden"
              name="return_sort"
              value={returnSort}
            />

            <input
              type="hidden"
              name="return_dir"
              value={returnDir}
            />

            <input
              type="hidden"
              name="entity_ky"
              value={entityKy}
            />

            {/* =================================================
                Authoritative saved footprint selection.

                These hidden values are what get submitted.
                This allows map-selected boundaries to be saved
                even when they were not review candidates.
                ================================================= */}

            {selectedBoundaryKys.map(
              (boundaryKy) => (
                <input
                  key={boundaryKy}
                  type="hidden"
                  name="boundary_ky"
                  value={boundaryKy}
                />
              ),
            )}

            {/* Community summary */}

            <div className="mb-3 rounded-lg bg-slate-50 px-4 py-3">
              <div className="text-base font-bold text-slate-900">
                {boundaryReviewRows[0]
                  ?.community_nm ??
                  boundaryMapData
                    ?.entity
                    ?.communityName ??
                  "Community"}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {boundaryReviewRows[0]
                  ?.area_nm ??
                  boundaryMapData
                    ?.entity
                    ?.areaName ??
                  "—"}

                {" • "}

                {boundaryReviewRows[0]
                  ?.zone_nm ??
                  boundaryMapData
                    ?.entity
                    ?.zoneName ??
                  "—"}
              </div>

              <div className="mt-3 text-xs font-semibold text-slate-600">
                {Number(
                  boundaryReviewRows[0]
                    ?.total_listing_ct ??
                    boundaryMapData
                      ?.propertyPoints
                      ?.length ??
                    0,
                ).toLocaleString()}{" "}
                MLS observations analyzed
              </div>

              <div className="mt-2 text-sm font-bold text-sky-700">
                Selected coverage:{" "}
                {selectedCoverage.toFixed(
                  2,
                )}
                %
              </div>

              <div className="mt-1 text-xs font-semibold text-slate-500">
                Selected government boundaries:{" "}
                {selectedBoundaryKys.length.toLocaleString()}
              </div>
            </div>

            {/* =================================================
                REVIEW CANDIDATES
                ================================================= */}

            {boundaryReviewRows.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="w-10 px-2 py-3" />

                      <th className="px-2 py-3 font-semibold">
                        Government Boundary
                      </th>

                      <th className="px-2 py-3 text-right font-semibold">
                        %
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {boundaryReviewRows.map(
                      (row) => {
                        const checked =
                          selectedSet.has(
                            row.boundary_ky,
                          );

                        return (
                          <tr
                            key={
                              row.boundary_ky
                            }
                            className={
                              checked
                                ? "border-t border-slate-100 bg-sky-50"
                                : "border-t border-slate-100 bg-white"
                            }
                          >
                            <td className="px-2 py-3 text-center align-top">
                              <input
                                type="checkbox"
                                checked={
                                  checked
                                }
                                onChange={(
                                  event,
                                ) =>
                                  toggleBoundary(
                                    row.boundary_ky,
                                    event
                                      .target
                                      .checked,
                                  )
                                }
                                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                              />
                            </td>

                            <td className="px-2 py-3">
                              <div className="font-semibold leading-5 text-slate-900">
                                {
                                  row.boundary_nm
                                }
                              </div>

                              <div className="mt-0.5 text-xs leading-4 text-slate-500">
                                {row.boundary_type_cd}
                                {" • "}
                                {Number(
                                  row.listing_ct,
                                ).toLocaleString()}{" "}
                                listings
                              </div>

                              <div
                                className={`mt-1 text-[11px] font-bold ${
                                  row.evidence_cd ===
                                  "SPATIAL + NAME"
                                    ? "text-emerald-700"
                                    : row.evidence_cd ===
                                        "NAME"
                                      ? "text-amber-700"
                                      : "text-sky-700"
                                }`}
                              >
                                {row.evidence_cd}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-2 py-3 text-right align-top tabular-nums text-slate-700">
                              {Number(
                                row.listing_pc,
                              ).toFixed(
                                2,
                              )}
                              %
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No algorithm-generated boundary candidates are available for this community.
              </div>
            )}

            {/* =================================================
                ADDITIONAL MAP SELECTIONS
                ================================================= */}

            {manualSelectedBoundaries.length >
            0 ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-sky-200">
                <div className="bg-sky-50 px-4 py-3">
                  <div className="text-sm font-bold text-sky-900">
                    Additional Map Selections
                  </div>

                  <div className="mt-1 text-xs text-sky-700">
                    These government boundaries were selected directly from the map.
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {manualSelectedBoundaries.map(
                    (boundary) => (
                      <div
                        key={
                          boundary.boundaryKy
                        }
                        className="flex items-start gap-3 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked
                          onChange={() =>
                            toggleBoundary(
                              boundary.boundaryKy,
                              false,
                            )
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />

                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {
                              boundary.boundaryName
                            }
                          </div>

                          <div className="mt-0.5 text-xs text-slate-500">
                            {
                              boundary.boundaryType ??
                              "Government boundary"
                            }
                          </div>

                          <div className="mt-1 text-[11px] font-bold text-violet-700">
                            MANUAL MAP SELECTION
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {/* Save */}

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Save Boundary Footprint
            </button>
          </form>
        </div>

        {/* ===================================================
            RIGHT — MAP
            =================================================== */}

        <div className="min-w-0">
          {boundaryMapData &&
          hasMapBoundaries ? (
            <BoundaryReviewMap
              data={
                boundaryMapData
              }
              selectedBoundaryKys={
                selectedBoundaryKys
              }
              onBoundaryToggle={
                toggleBoundary
              }
            />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
              No boundary map data is
              available for this
              community.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}