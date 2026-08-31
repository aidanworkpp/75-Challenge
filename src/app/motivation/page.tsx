"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import clsx from "clsx";

const STYLES: { id: string; label: string; blurb: string }[] = [
  { id: "goggins", label: "Goggins",         blurb: "Raw. Blunt. No excuses." },
  { id: "drill",   label: "Drill instructor", blurb: "Direct. Demanding." },
  { id: "coach",   label: "Coach",           blurb: "Firm, high standards." },
  { id: "stoic",   label: "Stoic",           blurb: "Calm, principled." },
  { id: "gentle",  label: "Gentle",          blurb: "Warm, supportive." },
];

export default function MotivationPage() {
  const [style, setStyle] = useState("coach");
  const [context, setContext] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setText(null);
    try {
      const res = await fetch("/api/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setText(data.text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Motivation">
      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted mb-2">Style</div>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={clsx(
                  "text-left rounded-lg border p-3",
                  style === s.id ? "border-accent bg-surface2" : "border-border bg-surface",
                )}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-muted">{s.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-muted">Optional — one line of context</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={200}
            placeholder="e.g. I'm on day 40 and the second workout is killing me"
            className="mt-1 w-full rounded-md bg-surface border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>

        {error && <p className="text-danger text-sm">{error}</p>}

        {text && (
          <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted">
              In the style of · {STYLES.find((s) => s.id === style)?.label}
            </div>
            <p className="text-base leading-relaxed whitespace-pre-line">{text}</p>
            <p className="text-xs text-muted italic pt-2 border-t border-border">
              Original message written in the described style. Not a quote from a real person.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
