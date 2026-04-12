// Handles artwork file upload for a product line item.
// Calls /api/uploads/presign to get a signed URL, then uploads directly
// from the browser to Supabase Storage — the file never passes through the app server.

interface FileUploaderProps {
  orderItemId?: string; // set after order is created; used for associating the file
  onUploadComplete: (storagePath: string, filename: string) => void;
  accept?: string; // e.g. ".pdf,.ai,.png,.jpg"
  maxSizeMb?: number;
}

export function FileUploader({
  accept = ".pdf,.ai,.eps,.png,.jpg,.jpeg",
  maxSizeMb = 50,
  onUploadComplete,
}: FileUploaderProps) {
  // TODO:
  // 1. Validate file type and size client-side
  // 2. POST to /api/uploads/presign with { filename, mimeType, sizeBytes }
  // 3. PUT file bytes to the returned signedUrl
  // 4. Call onUploadComplete(storagePath, filename)

  const handleChange = async (_e: React.ChangeEvent<HTMLInputElement>) => {
    // placeholder
    void onUploadComplete;
    void maxSizeMb;
  };

  return (
    <div>
      <label>
        Upload Artwork
        <input type="file" accept={accept} onChange={handleChange} />
      </label>
      <p>Max {maxSizeMb}MB. Accepted: {accept}</p>
    </div>
  );
}
