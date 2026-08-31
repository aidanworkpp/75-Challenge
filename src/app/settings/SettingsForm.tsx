"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { endChallenge, setAccent, setRemindersEnabled, signOut, updateDisplayName } from "@/app/actions";
import { ACCENTS } from "@/lib/accents";

export default function SettingsForm({
  email,
  displayName,
  remindersEnabled,
  accent,
  activeChallengeId,
}: {
  email: string;
  displayName: string;
  remindersEnabled: boolean;
  accent: string;
  activeChallengeId: string | null;
}) {
  const [name, setName] = useState(displayName);
  const [reminders, setReminders] = useState(remindersEnabled);
  const [accentKey, setAccentKey] = useState(accent);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function chooseAccent(key: string, rgb: string) {
    setAccentKey(key);
    // Instant visual feedback — set the CSS var immediately, then persist.
    try {
      document.documentElement.style.setProperty("--accent-rgb", rgb);
    } catch { /* ignore */ }
    startTransition(async () => {
      await setAccent(key);
      router.refresh();
    });
  }

  function saveName() {
    startTransition(async () => {
      await updateDisplayName(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function toggleReminders(next: boolean) {
    setReminders(next);
    startTransition(async () => {
      await setRemindersEnabled(next);
    });
  }

  function handleEnd() {
    if (!activeChallengeId) return;
    if (!confirm("End the current challenge? You'll be able to start a new one.")) return;
    startTransition(async () => {
      await endChallenge(activeChallengeId);
      router.push("/setup");
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Profile</h2>
        <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
          <div>
            <div className="text-xs text-muted">Email</div>
            <div className="font-medium">{email}</div>
          </div>
          <label className="block">
            <span className="text-xs text-muted">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-surface2 border border-border rounded px-3 py-2"
            />
          </label>
          <button
            onClick={saveName}
            disabled={pending}
            className="rounded-md bg-accent text-black font-semibold px-4 py-2"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Accent colour</h2>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => {
              const active = accentKey === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => chooseAccent(a.key, a.rgb)}
                  aria-label={a.label}
                  className={clsx(
                    "w-9 h-9 rounded-full border-2 transition-transform",
                    active ? "border-text scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: `rgb(${a.rgb})` }}
                >
                  {active && <span className="text-black text-sm font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Reminders</h2>
        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={reminders}
            onChange={(e) => toggleReminders(e.target.checked)}
            disabled={pending}
          />
          <span className="text-sm">
            <span className="font-medium">Daily afternoon check-in email</span>
            <span className="block text-muted">
              One reminder per day showing what you&apos;ve ticked and what&apos;s outstanding. Sent to <span className="text-text">{email}</span>.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Challenge</h2>
        {activeChallengeId ? (
          <>
            <button
              onClick={() => router.push("/edit-challenge")}
              disabled={pending}
              className="w-full rounded-md border border-border bg-surface py-3"
            >
              Edit commitments &amp; allowances
            </button>
            <button
              onClick={handleEnd}
              disabled={pending}
              className="w-full rounded-md border border-danger/40 text-danger bg-danger/10 py-3"
            >
              End current challenge
            </button>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-3 text-muted text-sm">
            No active challenge.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Account</h2>
        <button
          onClick={handleSignOut}
          disabled={pending}
          className="w-full rounded-md border border-border bg-surface py-3"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
