"use client";

// Per-item artwork upload form.
// Validates file client-side, requests a presigned URL, then PUTs directly to
// Supabase Storage. Calls router.refresh() on success to re-render the server
// component with the updated file list.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateUpload } from "@/lib/uploads";

export interface UploadedFile {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
}

interface Props {
  orderId: string;
  orderItemId: string;
  existingFiles: UploadedFile[];
  canUpload: boolean;
}

const FILE_STATUS_LABELS: Record<string, string> = {
  pending_review: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

const FILE_STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  approved: "bg-green-50 text-green-700 ring-green-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtworkUploadForm({
  orderId,
  orderItemId,
  existingFiles,
  canUpload,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUpload(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      // 1. Request presigned upload URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderItemId,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }

      const { signedUrl } = await presignRes.json();

      // 2. PUT file bytes directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Storage upload failed. Please try again.");
      }

      setSuccess(true);
      router.refresh(); // Re-fetches server component to show the new file row
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing files */}
      {existingFiles.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {existingFiles.map((file) => (
            <li key={file.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">
                  {file.originalFilename}
                </p>
                <p className="text-xs text-gray-400">
                  {file.mimeType} · {formatBytes(file.sizeBytes)}
                </p>
              </div>
              <span
                className={`ml-4 shrink-0 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  FILE_STATUS_STYLES[file.status] ?? "bg-gray-50 text-gray-500 ring-gray-200"
                }`}
              >
                {FILE_STATUS_LABELS[file.status] ?? file.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Upload form */}
      {canUpload && (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500">
            Upload artwork file (PDF, AI, EPS, PNG, JPG, TIFF · max 50 MB)
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tiff,.tif"
            disabled={uploading}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />
          {uploading && (
            <p className="text-xs text-gray-400">Uploading…</p>
          )}
          {success && (
            <p className="text-xs text-green-600">File uploaded successfully.</p>
          )}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      )}

      {!canUpload && existingFiles.length === 0 && (
        <p className="text-xs text-gray-400">No files uploaded yet.</p>
      )}
    </div>
  );
}
