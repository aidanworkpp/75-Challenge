"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackError = params.get("error");

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

        {callbackError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm">
            <div className="font-medium text-danger">Sign-in failed</div>
            <div className="text-muted mt-1 break-words">{callbackError}</div>
            <div className="text-muted mt-2 text-xs">
              Tip: open the magic link in the <span className="text-text">same browser</span> you requested it from. Incognito, a different browser, or a different device breaks the flow.
            </div>
          </div>
        )}

        {status === "sent" ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="font-medium">Check your email.</p>
            <p className="text-muted text-sm mt-1">We sent a sign-in link to <span className="text-text">{email}</span>.</p>
            <p className="text-muted text-xs mt-2">Open the link in this same browser.</p>
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
