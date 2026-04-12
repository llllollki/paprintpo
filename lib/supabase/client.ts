// Browser-side Supabase client.
// Use this in Client Components only ("use client").
// For Server Components and Route Handlers, use lib/supabase/server.ts.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
