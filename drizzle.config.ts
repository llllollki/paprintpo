import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// drizzle-kit runs in its own process and does not load .env.local automatically.
// This must be called before defineConfig reads process.env.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",                 // generated migration files land here
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Supabase uses public schema by default
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
