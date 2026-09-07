import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/Header";

export const metadata: Metadata = {
  title: "Privacy Notice | SearchPV",
  description:
    "Learn how SearchPV handles contact information, saved items, and website usage data.",
  alternates: {
    canonical: "https://searchpv.com/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#edf7f8] px-5 pb-12 pt-8 text-slate-950 md:px-8 md:pt-10">
      <div className="mx-auto max-w-4xl">
        <Header />

        <article className="rounded-[24px] border border-white/90 bg-white/80 px-5 py-7 shadow-[0_18px_55px_rgba(15,23,42,.08)] backdrop-blur-xl sm:px-8 sm:py-9 md:px-10">
          <header className="border-b border-slate-200 pb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 sm:text-xs">
              SearchPV
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
              Privacy Notice
            </h1>

            <p className="mt-2 text-xs text-slate-500">
              Last updated: September 6, 2026
            </p>

            <p className="mt-4 max-w-2xl text-[13px] leading-6 text-slate-600 sm:text-sm">
              SearchPV helps you explore Puerto Vallarta and
              Riviera Nayarit real estate, neighborhoods,
              properties, and market information. This notice
              explains in plain language what information we
              collect and how we use it.
            </p>
          </header>

          <div className="space-y-7 pt-7 text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-6">
            <PrivacySection title="Information you choose to provide">
              <p>
                You may provide your name, email address,
                telephone number, WhatsApp number, real estate
                interests, or a message when you contact
                SearchPV, request property information, or ask
                us to follow up with you.
              </p>

              <p>
                You may explore most of SearchPV without
                identifying yourself.
              </p>
            </PrivacySection>

            <PrivacySection title="Saved items">
              <p>
                SearchPV allows you to save properties, Atlas
                areas, searches, property lists, and market
                reports.
              </p>

              <p>
                Until you verify an email address, saved items
                are normally kept only in your browser. They
                may not be available from another device and
                may be lost if you clear your browser data.
              </p>

              <p>
                If you choose to keep saved items across
                devices, they may be associated with your
                verified email address so SearchPV can restore
                them for you.
              </p>
            </PrivacySection>

            <PrivacySection title="Anonymous feature usage">
              <p>
                SearchPV may record limited information when
                someone saves or removes an item. This may
                include a randomly assigned browser identifier,
                the type of item, its property or geographic
                reference, the page used, general device type,
                and the date of the interaction.
              </p>

              <p>
                We use this information to understand which
                features are useful and improve the SearchPV
                experience. It does not identify you by name
                unless you later choose to provide and verify
                an email address.
              </p>
            </PrivacySection>

            <PrivacySection title="How we use information">
              <ul className="list-disc space-y-1 pl-5 marker:text-teal-600">
                <li>
                  Respond to questions and property-information
                  requests
                </li>
                <li>
                  Provide requested real estate services
                </li>
                <li>
                  Save and restore selected properties, areas,
                  searches, and reports
                </li>
                <li>
                  Improve SearchPV&apos;s maps, reports,
                  property search, and user experience
                </li>
                <li>
                  Understand general feature usage and website
                  performance
                </li>
                <li>
                  Protect SearchPV from misuse and technical
                  problems
                </li>
              </ul>

              <p>
                Providing an email address to retain saved
                items does not automatically enroll you in
                promotional email.
              </p>
            </PrivacySection>

            <PrivacySection title="Service providers">
              <p>
                SearchPV uses established technology providers
                for website hosting, databases, mapping, email
                delivery, property search, analytics, and
                security. These providers may process limited
                information on SearchPV&apos;s behalf, and some
                may operate outside Mexico.
              </p>

              <p>
                SearchPV does not sell your personal
                information.
              </p>
            </PrivacySection>

            <PrivacySection title="Browser storage">
              <p>
                SearchPV may use browser storage, cookies, or
                similar technology to remember saved items and
                preferences, maintain essential functions,
                measure feature usage, and protect website
                reliability.
              </p>

              <p>
                You can remove locally stored information
                through your browser settings. Doing so may
                remove saved items that have not been connected
                to a verified email.
              </p>
            </PrivacySection>

            <PrivacySection title="How long information is kept">
              <p>
                Information is retained only for as long as
                reasonably necessary to provide the requested
                service, maintain saved items, understand
                feature usage, meet legal obligations, and
                protect the website.
              </p>
            </PrivacySection>

            <PrivacySection title="Your choices and rights">
              <p>
                You may ask SearchPV to provide access to your
                personal information, correct it, delete it
                when appropriate, or stop or limit particular
                uses. These are commonly known as rights of
                Access, Rectification, Cancellation, and
                Opposition, or ARCO rights.
              </p>

              <p>
                To make a request, email{" "}
                <a
                  href="mailto:privacy@searchpv.com"
                  className="font-bold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-600"
                >
                  contact@searchpv.com
                </a>{" "}
                with the subject “Privacy Request.” We may need
                to verify your identity before providing,
                changing, or deleting information.
              </p>
            </PrivacySection>

            <PrivacySection title="Security">
              <p>
                We use reasonable administrative and technical
                measures intended to protect information. No
                internet service can promise absolute security,
                but we limit the information collected and use
                established providers to operate SearchPV.
              </p>
            </PrivacySection>

            <PrivacySection title="Changes to this notice">
              <p>
                This notice may be updated as SearchPV&apos;s
                services develop. The current version and its
                latest update date will remain available on
                this page.
              </p>
            </PrivacySection>

{/*
            <PrivacySection title="Responsible party">
              <p>
                <strong className="font-bold text-slate-800">
                  [Your full legal name or business name]
                </strong>{" "}
                operates SearchPV and is responsible for the
                treatment of personal information described in
                this notice.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p>
                  <strong className="text-slate-800">
                    Address:
                  </strong>{" "}
                  [Your business address]
                </p>

                <p>
                  <strong className="text-slate-800">
                    Privacy contact:
                  </strong>{" "}
                  contact@searchpv.com
                </p>

                <p>
                  <strong className="text-slate-800">
                    Website:
                  </strong>{" "}
                  searchpv.com
                </p>
              </div>
            </PrivacySection>
*/}
          </div>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <span>© SearchPV</span>

            <Link
              href="/"
              className="font-bold text-teal-800 hover:text-teal-600"
            >
              Return to SearchPV
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}

function PrivacySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-black tracking-[-0.01em] text-slate-900 sm:text-[15px]">
        {title}
      </h2>

      <div className="space-y-3">{children}</div>
    </section>
  );
}