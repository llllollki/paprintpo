import type { NextConfig } from "next";

// Supabase project hostname — set NEXT_PUBLIC_SUPABASE_URL in .env.local and
// replace the hostname placeholder below before deploying to production.
// Example: "abcdefghijkl.supabase.co"
const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for its runtime script injection
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind inline styles + shadcn
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Supabase Storage images + Google Fonts
  `img-src 'self' data: ${SUPABASE_HOSTNAME ? `https://${SUPABASE_HOSTNAME}` : ""}`.trim(),
  "font-src 'self' https://fonts.gstatic.com",
  // API calls: Supabase Auth/DB + Stripe
  `connect-src 'self' ${SUPABASE_HOSTNAME ? `https://${SUPABASE_HOSTNAME} wss://${SUPABASE_HOSTNAME}` : ""} https://api.stripe.com`.trim(),
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Limit referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Force HTTPS for 2 years (production only — safe to have in dev too)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent XSS via injected scripts
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
];

const nextConfig: NextConfig = {
  // Allow dev-server access from LAN devices (phones, tablets on the same Wi-Fi).
  allowedDevOrigins: ["192.168.1.*"],

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  images: {
    remotePatterns: [
      // Supabase Storage — populated dynamically from NEXT_PUBLIC_SUPABASE_URL.
      // If the env var is not set (e.g. in CI without secrets), skip gracefully.
      ...(SUPABASE_HOSTNAME
        ? [{ protocol: "https" as const, hostname: SUPABASE_HOSTNAME }]
        : []),
    ],
  },
};

export default nextConfig;
