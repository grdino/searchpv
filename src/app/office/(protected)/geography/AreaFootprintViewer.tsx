"use client";

import BoundaryReviewMap from "./BoundaryReviewMap";
import type { Geometry } from "geojson";

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

export default function AreaFootprintViewer({
  data,
}: {
  data: BoundaryMapData;
}) {
  const selectedBoundaryKys =
    data.boundaries.map(
      (boundary) => boundary.boundaryKy,
    );

  return (
    <section className="rounded-xl bg-white p-5 shadow md:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
        Effective Area Footprint
      </p>

      <h2 className="mt-1 text-2xl font-bold text-slate-950">
        MLS Area Boundary
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        This footprint is derived from government
        boundaries mapped to the MLS Communities contained
        within this Area. Manage individual boundary
        assignments at the Community level.
      </p>

      <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
        <div className="text-base font-bold text-slate-900">
          {data.entity?.areaName ?? "Area"}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {data.entity?.zoneName ?? "—"}
        </div>

        <div className="mt-3 text-sm font-semibold text-violet-700">
          {data.boundaries.length.toLocaleString()} mapped
          government boundaries
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {data.propertyPoints.length.toLocaleString()} MLS
          observations represented
        </div>
      </div>

      <div className="mt-5">
        {data.boundaries.length > 0 ? (
          <BoundaryReviewMap
            data={data}
            selectedBoundaryKys={
              selectedBoundaryKys
            }
            onBoundaryToggle={() => {
              /*
               * Read-only Area footprint.
               *
               * Boundary assignments are maintained
               * at the child Community level.
               */
            }}
          />
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
            None of this Area&apos;s MLS Communities
            currently have mapped government boundaries.
          </div>
        )}
      </div>
    </section>
  );
}