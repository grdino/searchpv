"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOfficeAppAccess } from "@/lib/office-auth";
import { createOfficeClient } from "@/lib/supabase/office-server";

const DEVELOPMENTS_PATH = "/office/developments";

function optionalInteger(
  formData: FormData,
  fieldName: string,
): number | null {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }

  return number;
}

function optionalText(
  formData: FormData,
  fieldName: string,
): string | null {
  const value = String(formData.get(fieldName) ?? "").trim();
  return value || null;
}

export async function saveBuildingFacts(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_building",
    {
      p_development_profile_id: developmentId,
      p_num_units: optionalInteger(formData, "num_units"),
      p_num_buildings: optionalInteger(formData, "num_buildings"),
      p_floors: optionalInteger(formData, "floors"),
      p_completion_year: optionalInteger(
        formData,
        "completion_year",
      ),
      p_developer: optionalText(formData, "developer"),
      p_units_studio: optionalInteger(formData, "units_studio"),
      p_units_1br: optionalInteger(formData, "units_1br"),
      p_units_2br: optionalInteger(formData, "units_2br"),
      p_units_3br: optionalInteger(formData, "units_3br"),
      p_units_4br_plus: optionalInteger(
        formData,
        "units_4br_plus",
      ),
      p_unit_mix_notes: optionalText(
        formData,
        "unit_mix_notes",
      ),
      p_unit_mix_source: optionalText(
        formData,
        "unit_mix_source",
      ),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#selected-development`,
  );
}

export async function saveDevelopmentContent(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_content",
    {
      p_development_profile_id: developmentId,
      p_description: optionalText(formData, "description"),
      p_overview: optionalText(formData, "overview"),
      p_building_facts: optionalText(formData, "building_facts"),
      p_location_description: optionalText(
        formData,
        "location_description",
      ),
      p_lifestyle: optionalText(formData, "lifestyle"),
      p_searchpv_insights: optionalText(
        formData,
        "searchpv_insights",
      ),
      p_buyer_notes: optionalText(formData, "buyer_notes"),
      p_investor_notes: optionalText(formData, "investor_notes"),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    content_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-content`,
  );
}

const AMENITY_FIELDS = [
  "has_pool",
  "has_gym",
  "has_security",
  "has_elevator",
  "has_parking",
  "has_rooftop",
  "has_jacuzzi",
  "has_bbq",
  "has_concierge",
  "has_coworking",
  "has_steam_room",
  "has_sauna",
  "has_spa",
  "has_storage",
  "has_lockoff_units",
  "has_lobby",
  "has_restaurant_retail",
] as const;

const POLICY_FIELDS = [
  "pet_policy",
  "rental_policy",
  "parking",
  "hoa_notes",
] as const;

export async function saveDevelopmentAmenities(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const amenities: Record<string, boolean | string | null> = {};

  for (const field of AMENITY_FIELDS) {
    const value = formData.get(field);

    if (value === "yes") {
      amenities[field] = true;
    } else if (value === "no") {
      amenities[field] = false;
    } else if (value === "unknown") {
      amenities[field] = null;
    } else {
      throw new Error(`Invalid or missing amenity: ${field}`);
    }
  }

  for (const field of POLICY_FIELDS) {
    if (!formData.has(field)) {
      throw new Error(`Missing policy field: ${field}`);
    }

    amenities[field] = optionalText(formData, field);
  }

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_amenities",
    {
      p_development_profile_id: developmentId,
      p_amenities: amenities,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    amenities_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-amenities`,
  );
}

function optionalDecimal(
  formData: FormData,
  fieldName: string,
): number | null {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (value === "") return null;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return number;
}

export async function saveDevelopmentDetails(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const details = {
    official_name: optionalText(formData, "official_name"),
    profile_title: optionalText(formData, "profile_title"),
    address: optionalText(formData, "address"),
    cross_streets: optionalText(formData, "cross_streets"),
    neighborhood_label: optionalText(formData, "neighborhood_label"),
    latitude: optionalDecimal(formData, "latitude"),
    longitude: optionalDecimal(formData, "longitude"),
    year_built: optionalInteger(formData, "year_built"),
    completion_status: optionalText(formData, "completion_status"),
    stories: optionalInteger(formData, "stories"),
    residences: optionalInteger(formData, "residences"),
    construction_type: optionalText(formData, "construction_type"),
    architect: optionalText(formData, "architect"),
    beach_access: optionalText(formData, "beach_access"),
    walkability_notes: optionalText(formData, "walkability_notes"),
  };

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_details",
    {
      p_development_profile_id: developmentId,
      p_details: details,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    details_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-details`,
  );
}

export async function saveDevelopmentNearby(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const integerFields = [
    "nearby_restaurants_count",
    "nearby_bars_count",
    "nearby_galleries_count",
    "nearby_cafes_count",
    "nearby_beach_minutes",
    "nearby_grocery_minutes",
  ] as const;

  const textFields = [
    "nearby_summary",
    "nearby_notes",
  ] as const;

  const nearby: Record<string, number | string | null> = {};

  for (const field of integerFields) {
    if (!formData.has(field)) {
      throw new Error(`Missing field: ${field}`);
    }

    const value = optionalInteger(formData, field);

    if (value !== null && value < 0) {
      throw new Error(`${field} cannot be negative.`);
    }

    nearby[field] = value;
  }

  for (const field of textFields) {
    if (!formData.has(field)) {
      throw new Error(`Missing field: ${field}`);
    }

    nearby[field] = optionalText(formData, field);
  }

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_nearby",
    {
      p_development_profile_id: developmentId,
      p_nearby: nearby,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    nearby_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-nearby`,
  );
}

export async function saveDevelopmentSeo(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const textFields = [
    "seo_title",
    "seo_description",
    "seo_keywords",
    "meta_description",
    "website",
  ] as const;

  const seo: Record<string, string | string[] | null> = {};

  for (const field of textFields) {
    if (!formData.has(field)) {
      throw new Error(`Missing SEO field: ${field}`);
    }

    seo[field] = optionalText(formData, field);
  }

  if (!formData.has("source_urls")) {
    throw new Error("Missing source URLs field.");
  }

  const sourceUrls = String(
    formData.get("source_urls") ?? "",
  )
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);

  for (const url of sourceUrls) {
    if (!/^https?:\/\/\S+$/i.test(url)) {
      throw new Error(
        `Invalid source URL: ${url}. Use a complete http:// or https:// URL.`,
      );
    }
  }

  seo.source_urls = sourceUrls;

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_seo",
    {
      p_development_profile_id: developmentId,
      p_seo: seo,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(formData.get("return_q") ?? "").trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    seo_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-seo`,
  );
}

export async function saveDevelopmentReview(formData: FormData) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const priority = optionalInteger(
    formData,
    "profile_priority",
  );

  if (priority === null || ![1, 2, 3].includes(priority)) {
    throw new Error("Profile priority must be 1, 2, or 3.");
  }

  const textFields = [
    "priority_reason",
    "notes",
    "source_notes",
    "reviewed_by",
  ] as const;

  const review: Record<string, string | number | null> = {
    profile_priority: priority,
  };

  for (const field of textFields) {
    if (!formData.has(field)) {
      throw new Error(`Missing review field: ${field}`);
    }

    review[field] = optionalText(formData, field);
  }

  if (!formData.has("last_reviewed")) {
    throw new Error("Missing last reviewed field.");
  }

  const lastReviewed = optionalText(
    formData,
    "last_reviewed",
  );

  if (
    lastReviewed !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(lastReviewed)
  ) {
    throw new Error("Invalid last reviewed date.");
  }

  review.last_reviewed = lastReviewed;

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_save_review",
    {
      p_development_profile_id: developmentId,
      p_review: review,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(
    formData.get("return_q") ?? "",
  ).trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    review_saved: "1",
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-review`,
  );
}

export async function setDevelopmentPublication(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const developmentId = optionalInteger(
    formData,
    "development_profile_id",
  );

  if (developmentId === null || developmentId <= 0) {
    throw new Error("A valid development ID is required.");
  }

  const action = String(
    formData.get("publication_action") ?? "",
  ).trim();

  if (
    !["mark_ready", "publish", "unpublish"].includes(action)
  ) {
    throw new Error("Invalid publication action.");
  }

  const supabase = await createOfficeClient();

  const { error } = await supabase.rpc(
    "development_management_set_publication",
    {
      p_development_profile_id: developmentId,
      p_action: action,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const search = String(
    formData.get("return_q") ?? "",
  ).trim();

  const params = new URLSearchParams({
    development: String(developmentId),
    publication_saved: action,
  });

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-publication`,
  );
}

export async function updateDevelopmentPhoto(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const photoId = Number(
    formData.get("development_photo_id"),
  );

  const developmentId = Number(
    formData.get("development_profile_id"),
  );

  if (
    !Number.isSafeInteger(photoId) ||
    photoId <= 0 ||
    !Number.isSafeInteger(developmentId) ||
    developmentId <= 0
  ) {
    throw new Error("Invalid development photo information.");
  }

  const supabase = await createOfficeClient();

  const { data: existingPhotos, error: lookupError } =
    await supabase.rpc("development_management_photos", {
      p_development_profile_id: developmentId,
    });

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (
    !(existingPhotos ?? []).some(
      (photo: { development_photo_id: number }) =>
        photo.development_photo_id === photoId,
    )
  ) {
    throw new Error("Photo does not belong to this development.");
  }

  const { error } = await supabase.rpc(
    "development_management_update_photo",
    {
      p_development_photo_id: photoId,
      p_caption: String(formData.get("caption") ?? ""),
      p_alt_text: String(formData.get("alt_text") ?? ""),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const params = new URLSearchParams({
    development: String(developmentId),
    photo_saved: "1",
  });

  const search = String(formData.get("return_q") ?? "").trim();

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-photos`,
  );
}

export async function setPrimaryDevelopmentPhoto(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const photoId = Number(
    formData.get("development_photo_id"),
  );

  const developmentId = Number(
    formData.get("development_profile_id"),
  );

  if (
    !Number.isSafeInteger(photoId) ||
    photoId <= 0 ||
    !Number.isSafeInteger(developmentId) ||
    developmentId <= 0
  ) {
    throw new Error("Invalid development photo information.");
  }

  const supabase = await createOfficeClient();

  const { data: existingPhotos, error: lookupError } =
    await supabase.rpc("development_management_photos", {
      p_development_profile_id: developmentId,
    });

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (
    !(existingPhotos ?? []).some(
      (photo: { development_photo_id: number }) =>
        photo.development_photo_id === photoId,
    )
  ) {
    throw new Error("Photo does not belong to this development.");
  }

  const { error } = await supabase.rpc(
    "development_management_set_primary_photo",
    {
      p_development_photo_id: photoId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const params = new URLSearchParams({
    development: String(developmentId),
    primary_saved: "1",
  });

  const search = String(formData.get("return_q") ?? "").trim();

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-photos`,
  );
}

export async function moveDevelopmentPhoto(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const photoId = Number(
    formData.get("development_photo_id"),
  );

  const developmentId = Number(
    formData.get("development_profile_id"),
  );

  const direction = String(
    formData.get("direction") ?? "",
  );

  if (
    !Number.isSafeInteger(photoId) ||
    photoId <= 0 ||
    !Number.isSafeInteger(developmentId) ||
    developmentId <= 0
  ) {
    throw new Error("Invalid development photo information.");
  }

  if (direction !== "left" && direction !== "right") {
    throw new Error("Invalid photo direction.");
  }

  const supabase = await createOfficeClient();

  const { data: existingPhotos, error: lookupError } =
    await supabase.rpc("development_management_photos", {
      p_development_profile_id: developmentId,
    });

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (
    !(existingPhotos ?? []).some(
      (photo: { development_photo_id: number }) =>
        photo.development_photo_id === photoId,
    )
  ) {
    throw new Error("Photo does not belong to this development.");
  }

  const { error } = await supabase.rpc(
    "development_management_move_photo",
    {
      p_development_photo_id: photoId,
      p_direction: direction,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const params = new URLSearchParams({
    development: String(developmentId),
    photo_moved: "1",
  });

  const search = String(formData.get("return_q") ?? "").trim();

  if (search) {
    params.set("q", search);
  }

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-photos`,
  );
}

export async function deleteDevelopmentPhoto(
  formData: FormData,
) {
  await requireOfficeAppAccess("development_management");

  const photoId = Number(formData.get("development_photo_id"));
  const developmentId = Number(
    formData.get("development_profile_id"),
  );

  if (
    !Number.isSafeInteger(photoId) ||
    photoId <= 0 ||
    !Number.isSafeInteger(developmentId) ||
    developmentId <= 0
  ) {
    throw new Error("Invalid development photo information.");
  }

  const supabase = await createOfficeClient();

  const { data: photos, error: lookupError } =
    await supabase.rpc("development_management_photos", {
      p_development_profile_id: developmentId,
    });

  if (lookupError) throw new Error(lookupError.message);

  const photo = (photos ?? []).find(
    (item: {
      development_photo_id: number;
      storage_path: string;
    }) => item.development_photo_id === photoId,
  );

  if (!photo) {
    throw new Error("Photo not found in this development.");
  }

  if (
    !photo.storage_path.startsWith(`${developmentId}/`) ||
    photo.storage_path.includes("..")
  ) {
    throw new Error("Invalid photo storage path.");
  }

  const { error: storageError } = await supabase.storage
    .from("development-photos")
    .remove([photo.storage_path]);

  if (storageError) {
    throw new Error(
      `Unable to delete image: ${storageError.message}`,
    );
  }

  const { error: dbError } = await supabase.rpc(
    "development_management_delete_photo",
    {
      p_development_photo_id: photoId,
    },
  );

  if (dbError) {
    throw new Error(
      `Image removed from Storage, but database deletion failed: ${dbError.message}`,
    );
  }

  revalidatePath(DEVELOPMENTS_PATH);

  const params = new URLSearchParams({
    development: String(developmentId),
    photo_deleted: "1",
  });

  const search = String(formData.get("return_q") ?? "").trim();

  if (search) params.set("q", search);

  redirect(
    `${DEVELOPMENTS_PATH}?${params.toString()}#development-photos`,
  );
}