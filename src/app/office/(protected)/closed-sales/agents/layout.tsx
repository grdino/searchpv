import { requireOfficeAppAccess } from "@/lib/office-auth";

export default async function AgentRankingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOfficeAppAccess("agent_rankings");
  return <>{children}</>;
}
