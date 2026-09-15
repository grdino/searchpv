"use server";

import { redirect } from "next/navigation";

import { createOfficeClient } from "@/lib/supabase/office-server";

export async function logout() {
  const supabase = await createOfficeClient();

  await supabase.auth.signOut({
    scope: "local",
  });

  redirect("/office/login");
}