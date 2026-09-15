import { requireOfficeAppAccess } from "@/lib/office-auth";

export default async function AgencyRankingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOfficeAppAccess("agency_rankings");
  return <>{children}</>;
}
