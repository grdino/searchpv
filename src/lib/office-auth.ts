import { redirect } from "next/navigation";

import { createOfficeClient } from "@/lib/supabase/office-server";

export const OFFICE_APP_KEYS = [
  "listing_comparison",
  "agency_rankings",
  "agent_rankings",
  "geography",
  "saved_analytics",
] as const;

export type OfficeAppKey = (typeof OFFICE_APP_KEYS)[number];

export type OfficeUser = {
  user_id: string;
  email: string;
  display_name: string | null;
  active: boolean;
  is_admin: boolean;
};

export type OfficeApp = {
  app_key: OfficeAppKey;
  name: string;
  href: string;
  active: boolean;
  sort_order: number;
};

export async function getOfficeUser(): Promise<OfficeUser | null> {
  const supabase = await createOfficeClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  const userId =
    typeof claimsData?.claims?.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (!userId) return null;

  const { data, error } = await supabase
    .from("office_user")
    .select("user_id,email,display_name,active,is_admin")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as OfficeUser;
}

export async function requireOfficeUser(): Promise<OfficeUser> {
  const supabase = await createOfficeClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/office/login");
  }

  const officeUser = await getOfficeUser();
  if (!officeUser) redirect("/");

  return officeUser;
}

export async function getOfficeApps(): Promise<OfficeApp[]> {
  const officeUser = await requireOfficeUser();
  const supabase = await createOfficeClient();

  const { data: assignments, error: assignmentError } = await supabase
    .from("office_user_app")
    .select("app_key")
    .eq("user_id", officeUser.user_id);

  if (assignmentError) return [];

  const appKeys = (assignments ?? [])
    .map((row) => row.app_key)
    .filter((value): value is OfficeAppKey =>
      OFFICE_APP_KEYS.includes(value as OfficeAppKey),
    );

  if (appKeys.length === 0) return [];

  const { data: apps, error: appError } = await supabase
    .from("office_app")
    .select("app_key,name,href,active,sort_order")
    .in("app_key", appKeys)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (appError) return [];
  return (apps ?? []) as OfficeApp[];
}

export async function requireOfficeAppAccess(
  appKey: OfficeAppKey,
): Promise<OfficeUser> {
  const officeUser = await requireOfficeUser();
  const supabase = await createOfficeClient();

  const { data, error } = await supabase.rpc(
    "current_user_has_office_app",
    { p_app_key: appKey },
  );

  if (error || data !== true) {
    redirect("/office?denied=1");
  }

  return officeUser;
}
