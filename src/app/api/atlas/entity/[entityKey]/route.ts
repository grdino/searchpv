import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityKey: string }> }
) {
  const { entityKey } = await params;

  const entityKy = Number(entityKey);

  if (!Number.isFinite(entityKy)) {
    return NextResponse.json(
      { error: "Invalid entity key." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "geography_entity_detail",
    {
      p_entity_ky: entityKy,
    }
  );

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const {
    data: boundary,
    error: boundaryError,
  } = await supabase.rpc("atlas_entity_boundary", {
    p_entity_ky: entityKy,
  });

  if (boundaryError) {
    console.error(
      "Unable to load Atlas boundary:",
      boundaryError
    );
  }

  return NextResponse.json({
    ...(data as Record<string, unknown>),
    boundary: boundaryError ? null : boundary,
  });
}