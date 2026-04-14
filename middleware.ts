// Protects /admin routes and refreshes Supabase auth sessions on every request.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate admin routes — all other routes pass through immediately.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Build a response that cookie setters can mutate. If the Supabase client
  // needs to refresh an expiring access token it will call setAll, which
  // re-creates `response` so the new Set-Cookie headers are forwarded.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Write refreshed tokens onto the request first so the downstream
          // server component sees them, then re-create the response so it
          // carries the updated Set-Cookie headers to the browser.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() re-validates the JWT against the Supabase Auth server on every
  // request. Never use getSession() in middleware — it only reads the local
  // cookie without verification and can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to login with return path
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but email not in the allow-list → send to storefront root
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Authorized — return the (possibly cookie-refreshed) response
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    // Exclude static files and Next.js internals from middleware
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
