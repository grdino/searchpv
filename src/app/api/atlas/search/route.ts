import {
  NextRequest,
  NextResponse,
} from "next/server";

import { resolveGeography } from "@/lib/ask-searchpv/services/geography";
import { createClient } from "@/lib/supabase/server";

const ATLAS_RESULT_LIMIT = 8;
const RESOLVER_CANDIDATE_LIMIT = 32;

type EligibleDevelopmentRow = {
  entity_ky: number;
};

export async function GET(
  request: NextRequest,
) {
  const query =
    request.nextUrl.searchParams
      .get("q")
      ?.trim();

  if (!query) {
    return NextResponse.json({
      candidates: [],
    });
  }

  try {
    /*
     * Request more candidates than Atlas displays because inactive
     * Development candidates will be removed below.
     *
     * The shared geography resolver remains unchanged so Ask SearchPV
     * can continue resolving the complete geographic catalog.
     */
    const result =
      await resolveGeography(
        query,
        {
          limit:
            RESOLVER_CANDIDATE_LIMIT,
        },
      );

    const developmentEntityKeys =
      result.candidates
        .filter(
          (candidate) =>
            candidate.entityType ===
            "development",
        )
        .map(
          (candidate) =>
            candidate.entityKey,
        );

    let eligibleDevelopmentKeys =
      new Set<number>();

    if (
      developmentEntityKeys.length >
      0
    ) {
      const supabase =
        await createClient();

      const {
        data,
        error,
      } = await supabase.rpc(
        "atlas_development_entities_with_snapshot",
        {
          p_entity_kys:
            developmentEntityKeys,
        },
      );

      if (error) {
        throw new Error(
          `Unable to filter Atlas developments: ${error.message}`,
        );
      }

      eligibleDevelopmentKeys =
        new Set(
          (
            (data ??
              []) as EligibleDevelopmentRow[]
          ).map(
            (row) =>
              Number(
                row.entity_ky,
              ),
          ),
        );
    }

    const candidates =
      result.candidates
        .filter(
          (candidate) =>
            candidate.entityType !==
              "development" ||
            eligibleDevelopmentKeys.has(
              candidate.entityKey,
            ),
        )
        .slice(
          0,
          ATLAS_RESULT_LIMIT,
        )
        .map(
          (candidate) => ({
            entityKey:
              candidate.entityKey,

            entityType:
              candidate.entityType,

            canonicalName:
              candidate.canonicalName,

            matchedVariant:
              candidate.matchedVariant ??
              null,

            identifier:
              candidate.identifier,

            confidence:
              candidate.confidence,

            hierarchy:
              candidate.hierarchy,
          }),
        );

    return NextResponse.json({
      candidates,
    });
  } catch (error) {
    console.error(
      "Atlas geography search failed:",
      error,
    );

    return NextResponse.json(
      {
        candidates: [],
        error:
          "Unable to search geography.",
      },
      {
        status: 500,
      },
    );
  }
}