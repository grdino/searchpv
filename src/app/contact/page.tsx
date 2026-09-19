import type { Metadata } from "next";
import ContactForm from "@/app/contact/ContactForm";
import SPVBranding from "@/app/components/SPVBranding";
import HamburgerMenu from "@/app/components/HamburgerMenu";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const queryParams = await searchParams;
  const hasQueryParams = Object.keys(queryParams).length > 0;

  const pageUrl = "https://searchpv.com/contact";

  return {
    title: "Contact SearchPV",
    description:
      "Contact SearchPV for help with Puerto Vallarta and Riviera Nayarit real estate, listings, neighborhoods, and market information.",
    alternates: {
      canonical: pageUrl,
    },
    robots: hasQueryParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="flex h-28 items-center justify-between">
              <div className="text-white">
                <SPVBranding />
              </div>
              <div className="text-white">
                <HamburgerMenu />
              </div>
            </div>

            <div className="max-w-3xl pb-12">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-300">
                Contact SearchPV
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Have a question?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Ask about a property, an area, the market, or anything you found on SearchPV.
              </p>
            </div>
          </div>
        </header>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8 md:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
