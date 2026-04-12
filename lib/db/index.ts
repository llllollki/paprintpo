// Database client — Drizzle over postgres (node-postgres driver).
// Import db from here throughout the app; never instantiate a second client.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string comes from Supabase → Settings → Database → Connection string (Transaction mode)
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for Supabase transaction pooler compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
