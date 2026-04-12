// Supabase OAuth callback handler
// Exchanges the auth code for a session and redirects to the intended destination
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: implement Supabase code exchange
  // const { searchParams } = new URL(request.url);
  // const code = searchParams.get("code");
  // const next = searchParams.get("next") ?? "/";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/", siteUrl));
}
