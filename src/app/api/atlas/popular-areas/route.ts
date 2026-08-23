import {
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

type PopularAreaRow = {
  footprint_key: string;
  display_name: string;
  boundary_kys: number[];
  sales_count: number;
};

export async function GET() {
  const supabase =
    await createClient();

  /*
   * Popular Areas definition:
   *
   * - trailing 6 months
   * - top 3
   * - resale only
   * - Condos + Houses
   *
   * The resale/property-type logic lives inside
   * public.atlas_popular_areas().
   */
  const {
    data,
    error,
  } = await supabase.rpc(
    "atlas_popular_areas",
    {
      p_months: 6,
      p_limit: 3,
    },
  );

  if (error) {
    console.error(
      "Unable to load Atlas Popular Areas:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      },
    );
  }

  const rows =
    (data ?? []) as PopularAreaRow[];

  /*
   * Convert database naming to the camelCase shape
   * expected by the Atlas UI.
   */
  return NextResponse.json({
    areas: rows.map(
      (row) => ({
        footprintKey:
          row.footprint_key,

        displayName:
          row.display_name,

        boundaryKys:
          row.boundary_kys.map(
            Number,
          ),

        salesCount:
          Number(
            row.sales_count,
          ),
      }),
    ),
  });
}