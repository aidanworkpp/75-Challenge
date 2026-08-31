"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Two-step sign-in:
//   1. Enter email → Supabase emails a 6-8 digit code (plus a magic link for laptop users).
//   2. Enter the code → verifyOtp → signed in.
// Same-browser magic link still works via /auth/callback for people who click it.
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const callbackError = params.get("error");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("idle");
      setStep("code");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg text-text">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-3xl font-bold">75 Challenge</h1>
          <p className="text-muted mt-2">A private tracker for your own version of the challenge.</p>
        </div>

        {callbackError && step === "email" && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm">
            <div className="font-medium text-danger">Sign-in link didn&apos;t work</div>
            <div className="text-muted mt-1 break-words">{callbackError}</div>
            <div className="text-muted mt-2 text-xs">
              Enter your email below and use the 6-digit code from the email instead — it works on any device.
            </div>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-3">
            <label className="block">
              <span className="text-sm text-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md bg-surface border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@work.com"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send me a code"}
            </button>
            {error && <p className="text-danger text-sm">{error}</p>}
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="font-medium">Check your email.</p>
              <p className="text-muted text-sm mt-1">
                We sent a 6-digit code to <span className="text-text">{email}</span>. It arrives within a few seconds.
              </p>
            </div>

            <label className="block">
              <span className="text-sm text-muted">Code</span>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                maxLength={10}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-1 w-full rounded-md bg-surface border border-border px-3 py-3 text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter code"
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={status === "verifying" || code.length < 6}
              className="w-full rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
            >
              {status === "verifying" ? "Verifying…" : "Sign in"}
            </button>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(null); }}
              className="w-full text-muted text-sm py-2"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
