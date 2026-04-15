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
