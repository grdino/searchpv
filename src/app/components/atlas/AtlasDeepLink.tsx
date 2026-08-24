"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  useAtlasState,
  type AtlasEntity,
  type AtlasPopularArea,
} from "@/lib/atlas/state/AtlasState";

type AtlasSearchCandidate = {
  entityKey: number;
  entityType: string;
  canonicalName: string;
  matchedVariant: string | null;
  identifier: string;
  confidence: number;

  hierarchy?: {
    zone?: {
      entityKey: number;
      identifier: string;
      name: string;
    };

    area?: {
      entityKey: number;
      identifier: string;
      name: string;
    };

    community?: {
      entityKey: number;
      identifier: string;
      name: string;
    };
  };
};

type AtlasSearchResponse = {
  candidates?: AtlasSearchCandidate[];
};

type PopularAreasResponse = {
  areas?: AtlasPopularArea[];
};

type AtlasEntityDetail = {
  entity: {
    entity_ky: number;
    entity_type_cd: string;
    longitude_nb?: number;
    latitude_nb?: number;
  };

  canonical?: {
    entity_variant_nm?: string;
  } | null;

  parent?: {
    canonical_nm?: string;
  } | null;

  variants?: Array<{
    language_cd: string;
    variant_type_cd: string;
    entity_variant_nm: string;
  }>;

  boundary?: AtlasEntity["boundary"];
};

type GeographyLevel =
  | "development"
  | "community"
  | "area"
  | "zone";

type GeographyRequest = {
  level: GeographyLevel;
  name: string;
  expectedEntityType: string;
};

function normalizeName(
  value?: string | null,
) {
  return (value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim();
}

function namesMatch(
  left?: string | null,
  right?: string | null,
) {
  const normalizedLeft =
    normalizeName(left);

  const normalizedRight =
    normalizeName(right);

  return Boolean(
    normalizedLeft &&
      normalizedRight &&
      normalizedLeft ===
        normalizedRight,
  );
}

function scoreCandidate(
  candidate: AtlasSearchCandidate,
  request: GeographyRequest,
  zoneName: string,
  areaName: string,
  communityName: string,
) {
  let score = 0;

  if (
    candidate.entityType ===
    request.expectedEntityType
  ) {
    score += 100;
  }

  if (
    namesMatch(
      candidate.canonicalName,
      request.name,
    )
  ) {
    score += 100;
  }

  if (
    namesMatch(
      candidate.matchedVariant,
      request.name,
    )
  ) {
    score += 90;
  }

  if (
    namesMatch(
      candidate.hierarchy?.zone?.name,
      zoneName,
    )
  ) {
    score += 30;
  }

  if (
    namesMatch(
      candidate.hierarchy?.area?.name,
      areaName,
    )
  ) {
    score += 45;
  }

  if (
    namesMatch(
      candidate.hierarchy?.community?.name,
      communityName,
    )
  ) {
    score += 60;
  }

  score += Math.min(
    candidate.confidence ?? 0,
    10,
  );

  return score;
}

async function searchCandidates(
  query: string,
) {
  const response = await fetch(
    `/api/atlas/search?q=${encodeURIComponent(
      query,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to search Atlas geography.",
    );
  }

  const data =
    (await response.json()) as
      AtlasSearchResponse;

  return data.candidates ?? [];
}

async function loadPopularAreas() {
  const response = await fetch(
    "/api/atlas/popular-areas",
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Atlas Areas.",
    );
  }

  const data =
    (await response.json()) as
      PopularAreasResponse;

  return data.areas ?? [];
}

async function loadEntity(
  entityKey: number,
) {
  const response = await fetch(
    `/api/atlas/entity/${entityKey}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Atlas entity.",
    );
  }

  return (await response.json()) as
    AtlasEntityDetail;
}

function toAtlasEntity(
  detail: AtlasEntityDetail,
  candidate: AtlasSearchCandidate,
): AtlasEntity {
  const zonaRomanticaDisplayName =
    detail.variants?.find(
      (variant) =>
        variant.language_cd === "ES" &&
        variant.variant_type_cd === "CO",
    )?.entity_variant_nm;

  const canonicalName =
    detail.canonical
      ?.entity_variant_nm ??
    candidate.canonicalName;

  return {
    entityKy:
      detail.entity.entity_ky,

    entityType:
      detail.entity
        .entity_type_cd,

    canonicalName,

    displayName:
      zonaRomanticaDisplayName ??
      candidate.matchedVariant ??
      canonicalName,

    longitude:
      detail.entity.longitude_nb,

    latitude:
      detail.entity.latitude_nb,

    parentName:
      detail.parent?.canonical_nm,

    boundary:
      detail.boundary ?? null,
  };
}

export default function AtlasDeepLink() {
  const {
    selectEntity,
    selectPopularArea,
  } = useAtlasState();

  const startedRef =
    useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const zoneName =
      params.get("mlsZone")?.trim() ??
      "";

    const areaName =
      params.get("mlsArea")?.trim() ??
      "";

    const communityName =
      params
        .get("mlsCommunity")
        ?.trim() ?? "";

    const developmentName =
      params
        .get("development")
        ?.trim() ?? "";

    if (
      !developmentName &&
      !zoneName &&
      !areaName &&
      !communityName
    ) {
      return;
    }

    startedRef.current = true;

    async function resolveDeepLink() {
      /*
       * A requested Development takes priority over its broader
       * Atlas Area. Without a Development, first try to match the
       * MLS Community or Area to an exact mapped Atlas Area.
       */
      if (!developmentName) {
        try {
          const popularAreas =
            await loadPopularAreas();

          const atlasAreaNames = [
            communityName,
            areaName,
          ].filter(Boolean);

          for (
            const atlasAreaName of
              atlasAreaNames
          ) {
            const atlasArea =
              popularAreas.find(
                (area) =>
                  namesMatch(
                    area.displayName,
                    atlasAreaName,
                  ),
              );

            if (atlasArea) {
              selectPopularArea(atlasArea);
              return;
            }
          }
        } catch (error) {
          console.error(
            "Atlas Area deep-link resolution failed:",
            error,
          );
        }
      }

      const requests: GeographyRequest[] =
        [];

      if (developmentName) {
        requests.push({
          level: "development",
          name: developmentName,
          expectedEntityType: "DV",
        });
      }

      if (communityName) {
        requests.push({
          level: "community",
          name: communityName,
          expectedEntityType: "CM",
        });
      }

      if (areaName) {
        requests.push({
          level: "area",
          name: areaName,
          expectedEntityType: "AR",
        });
      }

      if (zoneName) {
        requests.push({
          level: "zone",
          name: zoneName,
          expectedEntityType: "ZN",
        });
      }

      for (
        let index = 0;
        index < requests.length;
        index += 1
      ) {
        const request =
          requests[index];

        try {
          const candidates =
            await searchCandidates(
              request.name,
            );

          const rankedCandidates =
            [...candidates].sort(
              (left, right) =>
                scoreCandidate(
                  right,
                  request,
                  zoneName,
                  areaName,
                  communityName,
                ) -
                scoreCandidate(
                  left,
                  request,
                  zoneName,
                  areaName,
                  communityName,
                ),
            );

          for (
            const candidate of
              rankedCandidates
          ) {
            const candidateScore =
              scoreCandidate(
                candidate,
                request,
                zoneName,
                areaName,
                communityName,
              );

            if (candidateScore < 100) {
              continue;
            }

            const detail =
              await loadEntity(
                candidate.entityKey,
              );

            const isLastFallback =
              index ===
              requests.length - 1;

            const allowPointOnlyEntity =
              request.level ===
                "development" ||
              isLastFallback;

            /*
             * Developments commonly use a mapped point instead
             * of a boundary. Other hierarchy levels prefer an
             * actual footprint until the final fallback.
             */
            if (
              !detail.boundary &&
              !allowPointOnlyEntity
            ) {
              continue;
            }

            selectEntity(
              toAtlasEntity(
                detail,
                candidate,
              ),
            );

            return;
          }
        } catch (error) {
          console.error(
            `Atlas ${request.level} deep-link resolution failed:`,
            error,
          );
        }
      }

      console.warn(
        "Atlas could not resolve the IDX geography.",
        {
          developmentName,
          zoneName,
          areaName,
          communityName,
        },
      );
    }

    void resolveDeepLink();
  }, [
    selectEntity,
    selectPopularArea,
  ]);

  return null;
}