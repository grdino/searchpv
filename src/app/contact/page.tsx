import ContactForm from "@/app/contact/ContactForm";
import Link from "next/link";
import SPVBranding from "@/app/components/SPVBranding";
import HamburgerMenu from "@/app/components/HamburgerMenu";

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

            <div className="pb-10">
              <p className="text-s font-bold uppercase tracking-[0.28em] text-sky-300">
                Contact SearchPV
              </p>

              {/* Continue with your h1 here */}
            </div>
          </div>
        </header>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <div className="rounded-2xl bg-white p-6 shadow md:p-8">
          <h2 className="text-2xl font-bold">Request</h2>

            <ContactForm />
        </div>
      </section>
    </main>
  );
}
