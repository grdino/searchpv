import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

function copyCookies(
  source: NextResponse,
  destination: NextResponse,
) {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie);
  });

  return destination;
}

export async function updateSession(
  request: NextRequest,
) {
  let response = NextResponse.next({
    request,
  });

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

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/office/login";

  if (!claims && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/office/login";
    loginUrl.search = "";

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    const redirectResponse =
      NextResponse.redirect(loginUrl);

    redirectResponse.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive",
    );

    return copyCookies(
      response,
      redirectResponse,
    );
  }

  if (claims && isLoginPage) {
    const officeUrl = request.nextUrl.clone();

    officeUrl.pathname = "/office";
    officeUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(officeUrl);

    redirectResponse.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive",
    );

    return copyCookies(
      response,
      redirectResponse,
    );
  }

  response.headers.set(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive",
  );

  return response;
}