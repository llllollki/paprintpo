// POST /api/preview-sessions
// Creates or replaces a preview session for the Quick Preview flow.
// Sets a server-side cookie (preview_session_token) for guest users.
// Returns a short-lived signed read URL so the client can display the artwork.
//
// Security: session token is httpOnly — not accessible to JS.
// RLS on preview_sessions gates direct Supabase API access; this route
// uses the service role (bypasses RLS) so no current_setting is needed here.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { previewSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase/service";

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour — shorter than preview_sessions TTL (24h)

const BodySchema = z.object({
  storagePath: z
    .string()
    .min(1)
    .max(500)
    .refine((p) => p.startsWith("staging/"), {
      message: "storagePath must be in the staging/ prefix",
    }),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { storagePath } = parsed.data;

  // Get or create session token
  const existingToken = request.cookies.get("preview_session_token")?.value;
  const sessionToken = existingToken ?? crypto.randomUUID();

  // Replace any existing preview session for this token (second upload replaces first)
  await db
    .delete(previewSessions)
    .where(eq(previewSessions.sessionToken, sessionToken));

  await db.insert(previewSessions).values({
    sessionToken,
    storagePath,
    userId: null,
  });

  // Issue a signed read URL so the client can display the artwork without
  // exposing the private bucket via a public URL.
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from("artwork")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signedData) {
    console.error("Failed to sign read URL:", signError?.message);
    return NextResponse.json(
      { error: "Could not generate artwork preview URL. Please try again." },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    sessionToken,
    artworkUrl: signedData.signedUrl,
    storagePath,
  });

  if (!existingToken) {
    response.cookies.set("preview_session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 86400, // 24 hours — matches preview_sessions TTL
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
