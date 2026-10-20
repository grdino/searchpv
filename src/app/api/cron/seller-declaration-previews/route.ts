import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET } from "@/lib/seller-declarations/model";
import { cleanupPreviewPdfs } from "@/lib/seller-declarations/preview-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const expected = "Bearer " + secret;
  if (!secret || Buffer.byteLength(authorization) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(authorization), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = createAdminClient();
    const result = await cleanupPreviewPdfs({
      candidates: async () => {
        const { data, error } = await db.rpc("expired_seller_declaration_previews");
        if (error) throw Error("Preview candidate query failed.");
        return data as { path: string }[];
      },
      referenced: async paths => {
        const { data, error } = await db.from("seller_declaration").select("pdf_path").in("pdf_path", paths);
        if (error) throw Error("Final PDF reference check failed.");
        return (data ?? []).map(row => row.pdf_path as string);
      },
      remove: async paths => {
        const { error } = await db.storage.from(BUCKET).remove(paths);
        if (error) throw Error("Preview removal failed.");
      },
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Seller declaration preview cleanup:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Preview cleanup failed. Check server logs." }, { status: 500 });
  }
}
