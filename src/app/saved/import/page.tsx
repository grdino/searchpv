import type { Metadata } from "next";

import Header from "@/app/components/Header";
import SavedPropertyImport from "./SavedPropertyImport";

export const metadata: Metadata = {
  title: "Save Property | SearchPV",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedPropertyImportPage() {
  return (
    <main className="min-h-screen bg-[#edf7f8] px-5 pb-12 pt-8 text-slate-950 md:px-8 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <Header />
        <SavedPropertyImport />
      </div>
    </main>
  );
}
