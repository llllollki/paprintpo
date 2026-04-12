// Upload helpers — validation and presign request utilities.
// The actual presigned URL is generated server-side in /api/uploads/presign.

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/postscript",      // .ai / .eps
  "image/png",
  "image/jpeg",
  "image/tiff",
] as const;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface UploadValidationError {
  field: "mimeType" | "size";
  message: string;
}

/**
 * Validates a file before requesting a presigned URL.
 * Call this client-side for fast feedback; re-validate server-side in the API route.
 */
export function validateUpload(file: File): UploadValidationError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      field: "mimeType",
      message: `File type not accepted. Allowed: PDF, AI, EPS, PNG, JPG, TIFF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      field: "size",
      message: `File exceeds the 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB uploaded).`,
    };
  }

  return null;
}

/**
 * Requests a presigned upload URL from the app server.
 * Returns { signedUrl, path } on success.
 */
export async function requestPresignedUrl(file: File): Promise<{
  signedUrl: string;
  path: string;
}> {
  const res = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to get upload URL. Please try again.");
  }

  return res.json();
}
