import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const entityKyText =
    request.nextUrl.searchParams.get("entityKy");

  const entityKy = Number(entityKyText);

  if (
    !Number.isInteger(entityKy) ||
    entityKy <= 0
  ) {
    return NextResponse.json(
      {
        error: "A valid entityKy is required.",
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "geography_entity_geometry",
    {
      p_entity_ky: entityKy,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas entity geometry:",
      error,
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(data);
}