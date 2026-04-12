import { defineConfig } from "drizzle-kit";

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
