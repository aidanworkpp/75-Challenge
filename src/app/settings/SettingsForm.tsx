"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endChallenge, signOut, updateDisplayName } from "@/app/actions";

export default function SettingsForm({
  email,
  displayName,
  activeChallengeId,
}: {
  email: string;
  displayName: string;
  activeChallengeId: string | null;
}) {
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function saveName() {
    startTransition(async () => {
      await updateDisplayName(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
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
