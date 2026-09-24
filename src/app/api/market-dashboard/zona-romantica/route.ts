import { NextRequest } from "next/server";
import { GET as getMarketDashboard } from "../[marketSlug]/route";

/** Existing API URL delegates to the generic market-dashboard handler. */
export function GET(request: NextRequest) {
  return getMarketDashboard(request, {
    params: Promise.resolve({ marketSlug: "zona-romantica" }),
  });
}
