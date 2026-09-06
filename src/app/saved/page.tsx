import type { Metadata } from "next";

import Header from "@/app/components/Header";
import SavedPageClient from "./SavedPageClient";

export const metadata: Metadata = {
  title: "Saved | SearchPV",
  description: "Your saved SearchPV properties, Atlas areas, and market searches.",
};

export default function SavedPage() {
  return (
    <main className="min-h-screen bg-[#edf7f8] px-5 pb-12 pt-8 text-slate-950 md:px-8 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <Header />
        <SavedPageClient />
      </div>
    </main>
  );
}
