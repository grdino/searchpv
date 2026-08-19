import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const boundaryKy =
    request.nextUrl.searchParams.get("boundaryKy");

  if (!boundaryKy) {
    return NextResponse.json(
      { error: "boundaryKy is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "atlas_entity_for_boundary",
    {
      p_boundary_ky: Number(boundaryKy),
    },
  );

  if (error) {
    console.error(
      "Unable to resolve Atlas boundary entity:",
      error,
    );

    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}