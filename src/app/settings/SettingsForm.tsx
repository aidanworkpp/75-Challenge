"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endChallenge, signOut, updateDisplayName, updateReminderPrefs } from "@/app/actions";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default function SettingsForm({
  email,
  displayName,
  timezone,
  remindersEnabled,
  morningHour,
  eveningHour,
  activeChallengeId,
}: {
  email: string;
  displayName: string;
  timezone: string;
  remindersEnabled: boolean;
  morningHour: number;
  eveningHour: number;
  activeChallengeId: string | null;
}) {
  const [name, setName] = useState(displayName);
  const [enabled, setEnabled] = useState(remindersEnabled);
  const [morning, setMorning] = useState(morningHour);
  const [evening, setEvening] = useState(eveningHour);
  const [tz, setTz] = useState(timezone);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedReminders, setSavedReminders] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function saveName() {
    startTransition(async () => {
      await updateDisplayName(name);
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 1500);
    });
  }

  function saveReminders() {
    startTransition(async () => {
      await updateReminderPrefs({
        enabled,
        morningHour: morning,
        eveningHour: evening,
        timezone: tz,
      });
      setSavedReminders(true);
      setTimeout(() => setSavedReminders(false), 1500);
    });
  }

  function detectTz() {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTz(detected);
    } catch { /* ignore */ }
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
            {savedProfile ? "Saved" : "Save"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Email reminders</h2>
        <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium">Send me daily reminders</span>
              <span className="block text-muted">Two per day: a morning nudge and an evening check-in with what&apos;s outstanding.</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              <span className="text-xs text-muted">Morning</span>
              <select
                disabled={!enabled}
                value={morning}
                onChange={(e) => setMorning(Number(e.target.value))}
                className="bg-surface2 border border-border rounded px-2 py-1 disabled:opacity-50"
              >
                {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-muted">Evening</span>
              <select
                disabled={!enabled}
                value={evening}
                onChange={(e) => setEvening(Number(e.target.value))}
                className="bg-surface2 border border-border rounded px-2 py-1 disabled:opacity-50"
              >
                {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
            </label>
          </div>

          <div>
            <div className="text-xs text-muted">Timezone (IANA)</div>
            <div className="flex gap-2 mt-1">
              <input
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="flex-1 bg-surface2 border border-border rounded px-3 py-2"
                placeholder="e.g. Europe/London"
              />
              <button
                type="button"
                onClick={detectTz}
                className="px-3 rounded-md border border-border bg-surface2 text-sm"
              >
                Detect
              </button>
            </div>
          </div>

          <button
            onClick={saveReminders}
            disabled={pending}
            className="rounded-md bg-accent text-black font-semibold px-4 py-2"
          >
            {savedReminders ? "Saved" : "Save reminders"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Challenge</h2>
        {activeChallengeId ? (
          <button
            onClick={handleEnd}
            disabled={pending}
            className="w-full rounded-md border border-danger/40 text-danger bg-danger/10 py-3"
          >
            End current challenge
          </button>
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
