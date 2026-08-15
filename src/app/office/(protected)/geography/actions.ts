"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const GEOGRAPHY_PATH = "/office/geography";

function requiredText(
  formData: FormData,
  fieldName: string,
  label: string,
) {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${text}`);
  }

  return parsed;
}

function redirectToEntity(
  entityKy: number,
  formData: FormData,
) {
  const params = new URLSearchParams();

  const q = String(formData.get("return_q") ?? "").trim();
  const type = String(formData.get("return_type") ?? "").trim();
  const sort = String(formData.get("return_sort") ?? "").trim();
  const dir = String(formData.get("return_dir") ?? "").trim();

  if (q) params.set("q", q);
  if (type) params.set("type", type);
  if (sort) params.set("sort", sort);
  if (dir) params.set("dir", dir);

  params.set("entity", String(entityKy));

  redirect(
    `${GEOGRAPHY_PATH}?${params.toString()}#entity-${entityKy}`,
  );
}

export async function saveEntity(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "geography_entity_save",
    {
      p_entity_ky: optionalNumber(formData.get("entity_ky")),
      p_entity_identifier_cd: requiredText(
        formData,
        "entity_identifier_cd",
        "Entity identifier",
      ),
      p_entity_type_cd: requiredText(
        formData,
        "entity_type_cd",
        "Entity type",
      ),
      p_canonical_nm: requiredText(
        formData,
        "canonical_nm",
        "Canonical name",
      ),
      p_longitude_nb: optionalNumber(
        formData.get("longitude_nb"),
      ),
      p_latitude_nb: optionalNumber(
        formData.get("latitude_nb"),
      ),
      p_entity_source_cd: requiredText(
        formData,
        "entity_source_cd",
        "Entity source",
      ),
      p_language_cd: requiredText(
        formData,
        "canonical_language_cd",
        "Canonical language",
      ),
      p_parent_entity_ky: optionalNumber(
        formData.get("parent_entity_ky"),
      ),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(GEOGRAPHY_PATH);
  redirectToEntity(Number(data), formData);
}

export async function saveVariant(formData: FormData) {
  const entityKy = optionalNumber(formData.get("entity_ky"));

  if (entityKy === null) {
    throw new Error("Entity key is required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "geography_variant_save",
    {
      p_entity_variant_ky: optionalNumber(
        formData.get("entity_variant_ky"),
      ),
      p_entity_ky: entityKy,
      p_variant_type_cd: requiredText(
        formData,
        "variant_type_cd",
        "Variant type",
      ),
      p_entity_variant_nm: requiredText(
        formData,
        "entity_variant_nm",
        "Variant name",
      ),
      p_language_cd: requiredText(
        formData,
        "variant_language_cd",
        "Variant language",
      ),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(GEOGRAPHY_PATH);
  redirectToEntity(entityKy, formData);
}

export async function deleteVariant(formData: FormData) {
  const entityKy = optionalNumber(formData.get("entity_ky"));
  const entityVariantKy = optionalNumber(
    formData.get("entity_variant_ky"),
  );

  if (entityKy === null || entityVariantKy === null) {
    throw new Error("Entity and variant keys are required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "geography_variant_delete",
    {
      p_entity_variant_ky: entityVariantKy,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(GEOGRAPHY_PATH);
  redirectToEntity(entityKy, formData);
}

export async function deleteEntity(formData: FormData) {
  const entityKy = optionalNumber(formData.get("entity_ky"));

  if (entityKy === null) {
    throw new Error("Entity key is required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "geography_entity_delete",
    {
      p_entity_ky: entityKy,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(GEOGRAPHY_PATH);
  redirect(GEOGRAPHY_PATH);
}

export async function saveBoundaryFootprint(
  formData: FormData,
) {
  const entityKy = optionalNumber(
    formData.get("entity_ky"),
  );

  if (entityKy === null) {
    throw new Error("Entity key is required.");
  }

  const boundaryKys = formData
    .getAll("boundary_ky")
    .map((value) => Number(value))
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value > 0,
    );

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "geography_entity_boundary_save",
    {
      p_entity_ky: entityKy,
      p_boundary_kys: boundaryKys,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(GEOGRAPHY_PATH);
  redirectToEntity(entityKy, formData);
}