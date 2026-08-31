"use client";

import { useState } from "react";
import { TIER_LIST, TIER_TEMPLATES } from "@/lib/tiers";
import type { CommitmentCategory, CommitmentDraft, CommitmentType, Tier } from "@/lib/types";
import { todayIso } from "@/lib/date";
import { createChallenge } from "@/app/setup/actions";
import clsx from "clsx";

type Step = 1 | 2 | 3;

const CATEGORIES: CommitmentCategory[] = ["workout", "diet", "reading", "water", "photo", "custom"];

export default function ChallengeSetupWizard() {
  const [step, setStep] = useState<Step>(1);
  const [tier, setTier] = useState<Tier>("hard");
  const [commitments, setCommitments] = useState<CommitmentDraft[]>(TIER_TEMPLATES.hard.commitments);
  const [restartOnMiss, setRestartOnMiss] = useState<boolean>(TIER_TEMPLATES.hard.restart_on_miss);
  const [lengthDays, setLengthDays] = useState<number>(TIER_TEMPLATES.hard.defaultLength);
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickTier(t: Exclude<Tier, "custom">) {
    setTier(t);
    setCommitments(TIER_TEMPLATES[t].commitments.map((c) => ({ ...c })));
    setRestartOnMiss(TIER_TEMPLATES[t].restart_on_miss);
    setLengthDays(TIER_TEMPLATES[t].defaultLength);
  }

  function updateCommitment(i: number, patch: Partial<CommitmentDraft>) {
    setCommitments((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
    if (tier !== "custom") setTier("custom");
  }

  function removeCommitment(i: number) {
    setCommitments((cs) => cs.filter((_, idx) => idx !== i));
    if (tier !== "custom") setTier("custom");
  }

  function addCommitment() {
    setCommitments((cs) => [
      ...cs,
      { label: "New commitment", type: "boolean", target_value: null, unit: null, category: "custom", optional: false },
    ]);
    if (tier !== "custom") setTier("custom");
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await createChallenge({
        tier,
        startDate,
        lengthDays,
        restartOnMiss,
        commitments,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="space-y-3">
          <p className="text-muted text-sm">
            Pick a starting template. You&apos;ll be able to edit every commitment in the next step.
          </p>
          {TIER_LIST.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTier(t.id)}
              className={clsx(
                "w-full text-left rounded-lg border p-4 transition",
                tier === t.id ? "border-accent bg-surface2" : "border-border bg-surface",
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-lg">{t.name}</h3>
                {t.restart_on_miss && <span className="text-xs text-danger">restart on miss</span>}
              </div>
              <p className="text-muted text-sm mt-1">{t.tagline}</p>
              <ul className="mt-2 space-y-0.5 text-sm text-muted">
                {t.commitments.map((c) => (
                  <li key={c.label}>
                    · {c.label}
                    {c.type === "numeric" && c.target_value != null && (
                      <span className="text-muted"> — {c.target_value}{c.unit ? ` ${c.unit}` : ""}</span>
                    )}
                    {c.optional && <span className="text-muted italic"> (optional)</span>}
                  </li>
                ))}
              </ul>
            </button>
          ))}
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-md bg-accent text-black font-semibold py-3"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <p className="text-muted text-sm">
            Edit your commitments. Optional items count towards stats but don&apos;t block a &quot;complete&quot; day.
          </p>
          <ul className="space-y-2">
            {commitments.map((c, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                <input
                  className="w-full bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-border"
                  value={c.label}
                  onChange={(e) => updateCommitment(i, { label: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex flex-col">
                    <span className="text-muted text-xs">Type</span>
                    <select
                      className="bg-surface2 border border-border rounded px-2 py-1"
                      value={c.type}
                      onChange={(e) => {
                        const type = e.target.value as CommitmentType;
                        updateCommitment(i, {
                          type,
                          target_value: type === "numeric" ? (c.target_value ?? 1) : null,
                          unit: type === "numeric" ? (c.unit ?? "min") : null,
                        });
                      }}
                    >
                      <option value="boolean">Yes/no</option>
                      <option value="numeric">Numeric target</option>
                    </select>
                  </label>
                  <label className="flex flex-col">
                    <span className="text-muted text-xs">Category</span>
                    <select
                      className="bg-surface2 border border-border rounded px-2 py-1"
                      value={c.category}
                      onChange={(e) => updateCommitment(i, { category: e.target.value as CommitmentCategory })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>
                  {c.type === "numeric" && (
                    <>
                      <label className="flex flex-col">
                        <span className="text-muted text-xs">Target</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="bg-surface2 border border-border rounded px-2 py-1"
                          value={c.target_value ?? ""}
                          onChange={(e) => updateCommitment(i, { target_value: Number(e.target.value) })}
                        />
                      </label>
                      <label className="flex flex-col">
                        <span className="text-muted text-xs">Unit</span>
                        <input
                          className="bg-surface2 border border-border rounded px-2 py-1"
                          value={c.unit ?? ""}
                          onChange={(e) => updateCommitment(i, { unit: e.target.value })}
                          placeholder="min / pages / L"
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted">
                    <input
                      type="checkbox"
                      checked={c.optional}
                      onChange={(e) => updateCommitment(i, { optional: e.target.checked })}
                    />
                    Optional (doesn&apos;t gate day complete)
                  </label>
                  <button
                    onClick={() => removeCommitment(i)}
                    className="text-danger text-xs px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={addCommitment}
            className="w-full rounded-md border border-dashed border-border py-2 text-muted hover:text-text"
          >
            + Add commitment
          </button>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-md bg-surface border border-border py-3">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={commitments.length === 0}
              className="flex-1 rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <p className="text-muted text-sm">
            Lock in your challenge. Commitments freeze for the duration — no edits.
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface border border-border rounded px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Length (days)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={lengthDays}
              onChange={(e) => setLengthDays(Number(e.target.value))}
              className="bg-surface border border-border rounded px-3 py-2"
            />
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={restartOnMiss}
              onChange={(e) => setRestartOnMiss(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium">Restart on miss</span>
              <span className="block text-muted">
                If any required commitment is missed on a day, the challenge is marked failed and you start again from day 1.
              </span>
            </span>
          </label>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-md bg-surface border border-border py-3">Back</button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
            >
              {submitting ? "Locking in…" : "Lock in"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={clsx(
            "h-1 flex-1 rounded",
            step >= n ? "bg-accent" : "bg-surface2",
          )}
        />
      ))}
    </div>
  );
}
