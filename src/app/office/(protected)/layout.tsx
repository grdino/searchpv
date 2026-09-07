import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Office",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

const OFFICE_EMAILS = new Set(["gerry@ronmorgan.net"]);

export default async function ProtectedOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const email =
    typeof data?.claims?.email === "string"
      ? data.claims.email.toLowerCase()
      : null;

  if (!email) redirect("/office/login");
  if (!OFFICE_EMAILS.has(email)) redirect("/");

  return <>{children}</>;
}
