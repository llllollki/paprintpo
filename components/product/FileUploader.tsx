"use client";

// Artwork file uploader — used in ProductConfigurator before the order is created.
// Calls /api/uploads/presign-staging to get a signed URL, then PUTs directly to
// Supabase Storage. On success calls onUploadComplete with the file metadata.

import { useRef, useState } from "react";
import { validateUpload } from "@/lib/uploads";
import type { ArtworkFile } from "@/lib/cart";

interface FileUploaderProps {
  uploadedFile?: ArtworkFile;
  onUploadComplete: (file: ArtworkFile) => void;
  onClear: () => void;
  accept?: string;
  maxSizeMb?: number;
}

export function FileUploader({
  uploadedFile,
  onUploadComplete,
  onClear,
  accept = ".pdf,.ai,.eps,.png,.jpg,.jpeg,.tiff,.tif",
  maxSizeMb = 50,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUpload(file);
    if (validationError) {
      setError(validationError.message);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const presignRes = await fetch("/api/uploads/presign-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }

      const { signedUrl, storagePath } = await presignRes.json();

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Storage upload failed. Please try again.");
      }

      onUploadComplete({
        storagePath,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (uploadedFile) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "#22c55e", flexShrink: 0 }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm flex-1 truncate" style={{ color: "var(--ink)" }}>
          {uploadedFile.filename}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--ink-soft)", flexShrink: 0 }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        className={`flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-opacity ${uploading ? "opacity-50 pointer-events-none" : "hover:opacity-80"}`}
        style={{ background: "var(--surface)", border: "1.5px dashed var(--border)", color: "var(--ink-soft)" }}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={uploading}
          onChange={handleChange}
        />
        {uploading ? "Uploading…" : "Choose artwork file"}
      </label>
      <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
        PDF, AI, EPS, PNG, JPG, TIFF · Max {maxSizeMb} MB
      </p>
      {error && (
        <p className="text-xs" style={{ color: "#b91c1c" }}>{error}</p>
      )}
    </div>
  );
}
