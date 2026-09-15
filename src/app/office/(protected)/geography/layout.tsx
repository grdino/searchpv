import { requireOfficeAppAccess } from "@/lib/office-auth";

export default async function GeographyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOfficeAppAccess("geography");
  return <>{children}</>;
}
