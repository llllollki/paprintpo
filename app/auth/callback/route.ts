// Supabase auth callback handler.
// Exchanges the one-time `code` from the magic link for a session,
// sets the session cookies, then redirects to `next` (default: /admin).

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Require a relative path to prevent open-redirect to external URLs.
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") ? rawNext : "/admin";

  // If there is no code, the link is malformed — redirect to login.
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // Build a response so we can write the new session cookies onto it.
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Exchange failed (expired link, already used, etc.) — back to login.
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  return response;
}
