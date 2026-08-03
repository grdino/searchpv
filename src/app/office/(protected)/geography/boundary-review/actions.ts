"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const QUEUE_PATH = "/office/geography/boundary-review";

function requiredText(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required field: ${fieldName}`);
  }

  return value.trim();
}

function requiredInteger(formData: FormData, fieldName: string): number {
  const value = Number(requiredText(formData, fieldName));

  if (!Number.isSafeInteger(value)) {
    throw new Error(`Invalid integer field: ${fieldName}`);
  }

  return value;
}

function requiredNumber(formData: FormData, fieldName: string): number {
  const value = Number(requiredText(formData, fieldName));

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric field: ${fieldName}`);
  }

  return value;
}

function optionalText(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/office/geography/boundary-review")
  ) {
    return value;
  }

  return QUEUE_PATH;
}

export async function approveBoundaryMatch(
  formData: FormData,
): Promise<never> {
  const boundaryKy = requiredInteger(formData, "boundaryKy");
  const entityKy = requiredInteger(formData, "entityKy");
  const matchedName = requiredText(formData, "matchedName");
  const confidence = requiredNumber(formData, "confidence");
  const candidateRank = requiredInteger(formData, "candidateRank");
  const reviewNote = optionalText(formData, "reviewNote");
  const nextHref = safeRedirectPath(formData.get("nextHref"));

  const supabase = await createClient();

  const { error } = await supabase.schema("geo").rpc(
    "approve_boundary_match",
    {
      p_boundary_ky: boundaryKy,
      p_entity_ky: entityKy,
      p_matched_name_tx: matchedName,
      p_confidence_nb: confidence,
      p_candidate_rank_nb: candidateRank,
      p_review_note_tx: reviewNote,
      p_reviewed_by_tx: "SEARCHPV_MANUAL_REVIEW",
    },
  );

  if (error) {
    throw new Error(`Unable to approve boundary: ${error.message}`);
  }

  revalidatePath(QUEUE_PATH);
  revalidatePath(`${QUEUE_PATH}/${boundaryKy}`);

  redirect(nextHref);
}

export async function markBoundaryNonCommunity(
  formData: FormData,
): Promise<never> {
  const boundaryKy = requiredInteger(formData, "boundaryKy");
  const reviewNote = optionalText(formData, "reviewNote");
  const nextHref = safeRedirectPath(formData.get("nextHref"));

  const supabase = await createClient();

  const { error } = await supabase.schema("geo").rpc(
    "mark_boundary_non_community",
    {
      p_boundary_ky: boundaryKy,
      p_review_note_tx: reviewNote,
      p_reviewed_by_tx: "SEARCHPV_MANUAL_REVIEW",
    },
  );

  if (error) {
    throw new Error(
      `Unable to mark boundary as non-community: ${error.message}`,
    );
  }

  revalidatePath(QUEUE_PATH);
  revalidatePath(`${QUEUE_PATH}/${boundaryKy}`);

  redirect(nextHref);
}