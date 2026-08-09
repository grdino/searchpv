import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "atlas_government_boundaries"
  );

  if (error) {
    console.error(
      "Unable to load Atlas government boundaries:",
      error
    );

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}