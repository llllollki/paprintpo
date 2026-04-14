"use client";

// /auth/login — email magic link (OTP) login form.
// On submit, calls Supabase signInWithOtp which sends a magic link to the email.
// The link redirects to /auth/callback, which exchanges the code for a session.

import { use, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  // Next.js 15: searchParams is a Promise for both server and client page components.
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

    // Build the callback URL, threading `next` so the callback can redirect
    // the user back to the page they were trying to reach.
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", siteUrl);
    if (nextPath) {
      callbackUrl.searchParams.set("next", nextPath);
    }

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
      <main className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Check your email</h1>
        <p className="text-sm text-gray-500">
          We sent a magic link to{" "}
          <span className="font-medium text-gray-700">{email}</span>. Click the
          link to sign in.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Sign In</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm text-gray-600">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending link…" : "Send magic link"}
        </button>
      </form>
    </main>
  );
}
