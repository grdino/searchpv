import type { Metadata } from "next";

import { login } from "./actions";

export const metadata: Metadata = {
  title: "Office Sign In",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type OfficeLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function OfficeLoginPage({
  searchParams,
}: OfficeLoginPageProps) {
  const params = await searchParams;

  const destination =
    params.next?.startsWith("/office") &&
    !params.next.startsWith("//")
      ? params.next
      : "/office";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            SearchPV
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Office Sign In
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Authorized users only
          </p>
        </div>

        {params.error ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {params.error}
          </div>
        ) : null}

        <form action={login} className="space-y-5">
          <input
            type="hidden"
            name="next"
            value={destination}
          />

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-base text-slate-950 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-base text-slate-950 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Sign In
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-500">
          SearchPV private office
        </p>
      </section>
    </main>
  );
}