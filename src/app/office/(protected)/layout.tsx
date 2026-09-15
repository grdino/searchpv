import type { Metadata } from "next";

import { requireOfficeUser } from "@/lib/office-auth";

export const metadata: Metadata = {
  title: "Office",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

export default async function ProtectedOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireOfficeUser();
  return <>{children}</>;
}
