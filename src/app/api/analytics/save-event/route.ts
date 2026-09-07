import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const VALID_EVENT_TYPES = new Set(["save", "remove"]);
const VALID_ITEM_TYPES = new Set([
  "area",
  "property",
  "search",
]);

const VALID_DEVICE_TYPES = new Set([
  "mobile",
  "tablet",
  "desktop",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SaveEventBody = {
  anonymousVisitorId?: unknown;
  eventType?: unknown;
  itemType?: unknown;
  referenceId?: unknown;
  itemTitle?: unknown;
  sourcePath?: unknown;
  deviceType?: unknown;
};

function cleanRequiredText(
  value: unknown,
  maximumLength: number,
) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim().slice(0, maximumLength);

  return cleaned || null;
}

function cleanOptionalText(
  value: unknown,
  maximumLength: number,
) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim().slice(0, maximumLength);

  return cleaned || null;
}

export async function POST(request: Request) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const suppliedOrigin = request.headers.get("origin");

    if (
      suppliedOrigin &&
      suppliedOrigin !== requestOrigin
    ) {
      return NextResponse.json(
        { success: false },
        { status: 403 },
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") || "0",
    );

    if (contentLength > 10_000) {
      return NextResponse.json(
        { success: false },
        { status: 413 },
      );
    }

    const body = (await request.json()) as SaveEventBody;

    const anonymousVisitorId =
      cleanRequiredText(
        body.anonymousVisitorId,
        36,
      );

    const eventType = cleanRequiredText(
      body.eventType,
      20,
    );

    const itemType = cleanRequiredText(
      body.itemType,
      30,
    );

    const referenceId = cleanRequiredText(
      body.referenceId,
      500,
    );

    const itemTitle = cleanOptionalText(
      body.itemTitle,
      300,
    );

    const sourcePath = cleanOptionalText(
      body.sourcePath,
      500,
    );

    const deviceType = cleanOptionalText(
      body.deviceType,
      20,
    );

    if (
      !anonymousVisitorId ||
      !UUID_PATTERN.test(anonymousVisitorId) ||
      !eventType ||
      !VALID_EVENT_TYPES.has(eventType) ||
      !itemType ||
      !VALID_ITEM_TYPES.has(itemType) ||
      !referenceId ||
      (deviceType &&
        !VALID_DEVICE_TYPES.has(deviceType))
    ) {
      return NextResponse.json(
        { success: false },
        { status: 400 },
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error(
        "Save analytics configuration is missing.",
      );

      return NextResponse.json(
        { success: false },
        { status: 503 },
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { error } = await supabaseAdmin
      .from("saved_item_event")
      .insert({
        anonymous_visitor_id:
          anonymousVisitorId,
        event_type: eventType,
        item_type: itemType,
        reference_id: referenceId,
        item_title: itemTitle,
        source_path: sourcePath,
        device_type: deviceType,
      });

    if (error) {
      console.error(
        "Save analytics insert failed:",
        error,
      );

      return NextResponse.json(
        { success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Save analytics request failed:",
      error,
    );

    return NextResponse.json(
      { success: false },
      { status: 500 },
    );
  }
}