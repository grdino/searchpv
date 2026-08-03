import type { Metadata } from "next";

import AskSearchPVClient from "./AskSearchPVClient";

export const metadata: Metadata = {
  title: "Ask SearchPV",
  description:
    "Ask SearchPV about Puerto Vallarta real estate, neighborhoods, listings, developments, and market activity.",
};

export default async function AskSearchPVPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const question = params.q?.trim() ?? "";

  return (
    <AskSearchPVClient
      initialQuestion={question}
    />
  );
}