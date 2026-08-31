"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// [A8] Auth via magic link only — no passwords, no signup form.
// New emails auto-create an account when they click the link.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg text-text">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-3xl font-bold">75-something</h1>
          <p className="text-muted mt-2">A private tracker for your own version of the challenge.</p>
        </div>

        {status === "sent" ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="font-medium">Check your email.</p>
            <p className="text-muted text-sm mt-1">We sent a sign-in link to <span className="text-text">{email}</span>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md bg-surface border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@work.com"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-accent text-black font-semibold py-2 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {error && <p className="text-danger text-sm">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
