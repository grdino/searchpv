"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getSafeDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/office";
  }

  if (!value.startsWith("/office") || value.startsWith("//")) {
    return "/office";
  }

  return value;
}

export async function login(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const email =
    typeof emailValue === "string"
      ? emailValue.trim().toLowerCase()
      : "";

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  const destination = getSafeDestination(formData.get("next"));

  if (!email || !password) {
    redirect(
      `/office/login?error=${encodeURIComponent(
        "Email and password are required.",
      )}&next=${encodeURIComponent(destination)}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/office/login?error=${encodeURIComponent(
        "The email or password was not accepted.",
      )}&next=${encodeURIComponent(destination)}`,
    );
  }

  redirect(destination);
}