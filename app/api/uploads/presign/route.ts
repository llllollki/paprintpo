// Generates a Supabase Storage presigned URL for direct browser → bucket uploads.
// The browser uploads the file directly; this route never handles the file bytes.
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO:
  // 1. Authenticate the request (verify Supabase session)
  // 2. Validate file metadata (mime type, size) from request body
  // 3. Generate a presigned upload URL via Supabase Storage
  // 4. Return { path, signedUrl }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
