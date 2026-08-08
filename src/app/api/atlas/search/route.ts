import { NextRequest, NextResponse } from "next/server";
import { resolveGeography } from "@/lib/ask-searchpv/services/geography";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({
      candidates: [],
    });
  }

  try {
    const result = await resolveGeography(query, {
      limit: 8,
    });

    return NextResponse.json({
      candidates: result.candidates.map((candidate) => ({
        entityKey: candidate.entityKey,
        entityType: candidate.entityType,
        canonicalName: candidate.canonicalName,
        matchedVariant: candidate.matchedVariant ?? null,
        identifier: candidate.identifier,
        confidence: candidate.confidence,
        hierarchy: candidate.hierarchy,
      })),
    });
  } catch (error) {
    console.error("Atlas geography search failed:", error);

    return NextResponse.json(
      {
        candidates: [],
        error: "Unable to search geography.",
      },
      { status: 500 }
    );
  }
}