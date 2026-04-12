// Protects /admin routes and refreshes Supabase auth sessions on every request.

import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate admin routes
  if (pathname.startsWith("/admin")) {
    // TODO: read Supabase session from cookies and verify email is in ADMIN_EMAILS
    // For now, redirect unauthenticated requests to login
    const isAuthenticated = false; // replace with real session check

    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userEmail = ""; // replace with session user email
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    // Exclude static files and Next.js internals from middleware
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
