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
  ] = useState<number[]>(
    boundaryReviewRows
      .filter(
        (row) =>
          row.selected_fl,
      )
      .map(
        (row) =>
          row.boundary_ky,
      ),
  );

  const selectedSet = useMemo(
    () =>
      new Set(
        selectedBoundaryKys,
      ),
    [selectedBoundaryKys],
  );

  /*
   * ----------------------------------------------------------
   * Live selected coverage
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
        database only when you save.
      </p>

      {/* =====================================================
          DESKTOP:
          340px selection panel + remaining width map

          MOBILE:
          stacked automatically
          ===================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 md:items-start">
        {/* ===================================================
            LEFT — SELECTION PANEL
            =================================================== */}

        <div className="min-w-0">
          {boundaryReviewRows.length >
          0 ? (
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

              {/* Community summary */}

              <div className="mb-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="text-base font-bold text-slate-900">
                  {
                    boundaryReviewRows[0]
                      .community_nm
                  }
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {
                    boundaryReviewRows[0]
                      .area_nm
                  }

                  {" • "}

                  {
                    boundaryReviewRows[0]
                      .zone_nm
                  }
                </div>

                <div className="mt-3 text-xs font-semibold text-slate-600">
                  {Number(
                    boundaryReviewRows[0]
                      .total_listing_ct,
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
              </div>

              {/* Boundary choices */}

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
                                name="boundary_ky"
                                value={
                                  row.boundary_ky
                                }
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
                                <div className="mt-0.5 text-xs leading-4 text-slate-500">
                                  {row.boundary_type_cd}
                                  {" • "}
                                  {Number(row.listing_ct).toLocaleString()}{" "}
                                  listings
                                </div>

                                <div
                                  className={`mt-1 text-[11px] font-bold ${
                                    row.evidence_cd === "SPATIAL + NAME"
                                      ? "text-emerald-700"
                                      : row.evidence_cd === "NAME"
                                        ? "text-amber-700"
                                        : "text-sky-700"
                                  }`}
                                >
                                  {row.evidence_cd}
                                </div>
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

              {/* Save */}

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Save Boundary Footprint
              </button>
            </form>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No government-boundary evidence is
              available for this community.
            </p>
          )}
        </div>

        {/* ===================================================
            RIGHT — MAP
            =================================================== */}

        <div className="min-w-0">
          {boundaryMapData &&
          boundaryMapData.boundaries
            .length > 0 ? (
            <BoundaryReviewMap
              data={
                boundaryMapData
              }
              selectedBoundaryKys={
                selectedBoundaryKys
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