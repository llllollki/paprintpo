// Server-side environment validation.
// Imported by lib/db/index.ts so it runs before the first DB query.
// Fails fast in production; warns once in development to avoid log noise.

if (typeof window !== "undefined") {
  throw new Error("lib/env.ts must only be imported in server-side code");
}

// Always required — app cannot function without these.
const ALWAYS_REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
] as const;

// Required in production only — fine to omit in dev (e.g. webhook secret
// is only needed when running `stripe listen` locally).
const PRODUCTION_REQUIRED = [
  "STRIPE_WEBHOOK_SECRET",
] as const;

function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const missing: string[] = [];

  for (const key of ALWAYS_REQUIRED) {
    if (!(process.env[key] ?? "").trim()) missing.push(key);
  }

  if (isProd) {
    for (const key of PRODUCTION_REQUIRED) {
      if (!(process.env[key] ?? "").trim()) missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(", ")}`;
    if (isProd) throw new Error(msg);
    else console.warn(`⚠  env: ${msg}`);
  }

  // ADMIN_EMAILS must have at least one entry in production.
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    const msg = "ADMIN_EMAILS is empty — no admin users can access /admin";
    if (isProd) throw new Error(msg);
    else console.warn(`⚠  env: ${msg}`);
  }
}

// Guard: run once per process. Next.js hot-reload re-evaluates modules, so
// we use a globalThis flag to prevent the warning from firing on every request.
const checked = (globalThis as Record<string, unknown>)["__envChecked"];
if (!checked) {
  (globalThis as Record<string, unknown>)["__envChecked"] = true;
  validateEnv();
}
