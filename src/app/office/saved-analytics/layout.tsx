import type { Metadata } from "next";

import { requireOfficeAppAccess } from "@/lib/office-auth";

export const metadata: Metadata = {
  title: "Saved-Item Analytics | Office",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

export default async function SavedAnalyticsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOfficeAppAccess("saved_analytics");
  return <>{children}</>;
}
