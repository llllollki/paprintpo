"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextPath } = use(searchParams);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", siteUrl);
    if (nextPath) callbackUrl.searchParams.set("next", nextPath);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--off-white)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--surface)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--violet)" }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
            Check your email
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            We sent a magic link to{" "}
            <span className="font-semibold" style={{ color: "var(--ink)" }}>{email}</span>.
            Click the link to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--off-white)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center rounded-xl px-3 py-2" style={{ background: "white", boxShadow: "var(--shadow-sm)" }}>
            <Image src="/logo.png" alt="Paprintpo" width={140} height={32} className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "var(--shadow-md)" }}>
          <h1 className="text-2xl font-extrabold mb-1 tracking-tight" style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}>
            Sign in
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--ink-soft)" }}>
            Enter your email and we&apos;ll send a magic link.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: "var(--ink)" }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--border)",
                  color: "var(--ink)",
                  background: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--violet)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#b91c1c", background: "#fef2f2" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg py-3 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "var(--violet)" }}
            >
              {loading ? "Sending link…" : "Send magic link"}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: "var(--ink-soft)" }}>
          <Link href="/" className="font-medium hover:underline" style={{ color: "var(--violet)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
