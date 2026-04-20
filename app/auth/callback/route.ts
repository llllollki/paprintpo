// Supabase auth callback handler.
// Exchanges the one-time `code` from the magic link for a session,
// sets the session cookies, then redirects to `next` (default: /admin).

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate the redirect target is same-origin.
  // Checking startsWith("/") is insufficient — "//evil.com" passes that check.
  // Constructing a URL relative to `origin` and comparing origins is safe.
  const rawNext = searchParams.get("next") ?? "";
  let next = "/admin";
  if (rawNext) {
    try {
      const resolved = new URL(rawNext, origin);
      if (resolved.origin === origin) next = resolved.pathname + resolved.search;
    } catch {
      // malformed URL — fall back to default
    }
  }

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
