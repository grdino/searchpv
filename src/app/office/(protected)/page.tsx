import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

export default async function OfficePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-slate-950 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              SearchPV
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Private Office
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Signed in as {user?.email ?? "authorized user"}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Sign Out
            </button>
          </form>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          <Link
            href="/office/closed-sales/agencies"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-slate-950">
              Closed Sales by Agency
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Internal sales participation and agency reporting.
            </p>
          </Link>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Property Inventory
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Mobile inventory and property-transfer packages.
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Coming next
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}