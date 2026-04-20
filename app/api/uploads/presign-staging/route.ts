// POST /api/uploads/presign-staging
// Issues a signed upload URL for pre-order artwork (no order context yet).
// The returned storagePath is stored in the CartItem and committed to order_files
// at checkout when the order row and items are created.
// Path pattern: staging/{uuid}.{ext}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_MIME_TYPES } from "@/lib/uploads";
import { supabaseAdmin, ensureArtworkBucket } from "@/lib/supabase/service";

const SAFE_FILENAME_RE = /^[a-zA-Z0-9._\- ]+$/;

const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf":        ["pdf"],
  "application/postscript": ["ai", "eps"],
  "image/png":              ["png"],
  "image/jpeg":             ["jpg", "jpeg"],
  "image/tiff":             ["tif", "tiff"],
};

const StagingPresignSchema = z.object({
  filename:  z
    .string()
    .min(1)
    .max(200)
    .refine((f) => SAFE_FILENAME_RE.test(f), {
      message: "Filename contains invalid characters",
    }),
  mimeType:  z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = StagingPresignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { filename, mimeType, sizeBytes: _sizeBytes } = parsed.data;

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = MIME_EXTENSIONS[mimeType] ?? [];
  if (!allowedExts.includes(ext)) {
    return NextResponse.json(
      { error: "Filename extension does not match the declared file type" },
      { status: 422 }
    );
  }

  const storagePath = `staging/${crypto.randomUUID()}.${ext}`;

  try {
    await ensureArtworkBucket();
  } catch (err) {
    console.error("ensureArtworkBucket failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Storage unavailable. Please try again." },
      { status: 502 }
    );
  }

  const { data, error } = await supabaseAdmin.storage
    .from("artwork")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("Supabase storage presign failed:", error?.message);
    return NextResponse.json(
      { error: "Failed to generate upload URL. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl, storagePath });
}
