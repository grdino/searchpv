import { requireOfficeAppAccess } from "@/lib/office-auth";

export default async function ListingComparisonLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOfficeAppAccess("listing_comparison");
  return <>{children}</>;
}
