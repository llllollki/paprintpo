// Supabase service-role client.
// Bypasses Row Level Security. SERVER ONLY — never import in client components.
// Used for Storage admin operations: generating signed upload/download URLs.

import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ---------------------------------------------------------------------------
// ensureArtworkBucket
//
// Creates the private "artwork" Storage bucket if it doesn't exist yet.
// Safe to call on every request — createBucket is a no-op if the bucket
// already exists (we treat "already exists" errors as success).
//
// Production: run drizzle/rls_policies.sql in the Supabase SQL editor to
// create the bucket with the correct RLS policies before go-live.
// ---------------------------------------------------------------------------

let artworkBucketEnsured = false;

export async function ensureArtworkBucket(): Promise<void> {
  if (artworkBucketEnsured) return;

  const { error } = await supabaseAdmin.storage.createBucket("artwork", {
    public: false,
  });

  if (error) {
    // "already exists" variants from different Supabase versions — treat as success.
    const msg = error.message.toLowerCase();
    if (!msg.includes("already exists") && !msg.includes("duplicate") && !msg.includes("unique")) {
      throw new Error(`Failed to create artwork storage bucket: ${error.message}`);
    }
  }

  artworkBucketEnsured = true;
}
