import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { OFFICE_AUTH_COOKIE_NAME } from "@/lib/supabase/office-cookie";

function isOfficeAuthCookie(name: string) {
  return (
    name === OFFICE_AUTH_COOKIE_NAME ||
    name.startsWith(`${OFFICE_AUTH_COOKIE_NAME}.`)
  );
}

export async function createOfficeClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookieOptions: {
        name: OFFICE_AUTH_COOKIE_NAME,
      },

      cookies: {
        getAll() {
          /*
           * IMPORTANT:
           * The Office Supabase client must never see the
           * normal/public Supabase authentication cookies.
           *
           * Supabase may split a session across multiple
           * cookies, so include the base Office cookie and
           * any numbered chunks such as:
           *
           * searchpv-office-auth
           * searchpv-office-auth.0
           * searchpv-office-auth.1
           */
          return cookieStore
            .getAll()
            .filter(({ name }) =>
              isOfficeAuthCookie(name),
            );
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet
              .filter(({ name }) =>
                isOfficeAuthCookie(name),
              )
              .forEach(
                ({ name, value, options }) => {
                  cookieStore.set(
                    name,
                    value,
                    options,
                  );
                },
              );
          } catch {
            /*
             * Server Components cannot always modify cookies.
             * Office session refresh is handled by src/proxy.ts.
             */
          }
        },
      },
    },
  );
}