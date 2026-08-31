"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { CommitmentCategory, CommitmentItem, CommitmentType } from "@/lib/types";
import { ALL_WEEKDAYS, WEEKDAY_LABELS, photoDraft } from "@/lib/tiers";
import { updateActiveChallenge, type EditableCommitment } from "./actions";

const CATEGORIES: CommitmentCategory[] = ["workout", "diet", "reading", "water", "photo", "custom"];

export default function EditChallengeForm({
  challengeId,
  restDaysPerWeek,
  cheatMealsPerWeek,
  items,
}: {
  challengeId: string;
  restDaysPerWeek: number;
  cheatMealsPerWeek: number;
  items: CommitmentItem[];
}) {
  const router = useRouter();

  // Split the photo item out into its own section (matches the setup flow).
  const initialPhoto = items.find((i) => i.category === "photo");
  const initialOthers = items.filter((i) => i.category !== "photo");

  const [commitments, setCommitments] = useState<EditableCommitment[]>(
    initialOthers.map((i) => ({
      id: i.id,
      label: i.label,
      type: i.type,
      target_value: i.target_value,
      unit: i.unit,
      category: i.category,
      optional: i.optional,
      active_weekdays: i.active_weekdays,
    })),
  );
  const [photoId] = useState<string | undefined>(initialPhoto?.id);
  const [photoEnabled, setPhotoEnabled] = useState<boolean>(!!initialPhoto);
  const [photoWeekdays, setPhotoWeekdays] = useState<number[]>(
    initialPhoto?.active_weekdays ?? ALL_WEEKDAYS,
  );
  const [restDays, setRestDays] = useState<number>(restDaysPerWeek);
  const [cheatMeals, setCheatMeals] = useState<number>(cheatMealsPerWeek);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCommitment(i: number, patch: Partial<EditableCommitment>) {
    setCommitments((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeCommitment(i: number) {
    const c = commitments[i];
    if (c.id && !confirm(`Remove "${c.label}"? Any days you already ticked it will lose that tick.`)) return;
    setCommitments((cs) => cs.filter((_, idx) => idx !== i));
  }
  function addCommitment() {
    setCommitments((cs) => [
      ...cs,
      { label: "New commitment", type: "boolean", target_value: null, unit: null, category: "custom", optional: false, active_weekdays: null },
    ]);
  }
  function togglePhotoWeekday(d: number) {
    setPhotoWeekdays((wd) => (wd.includes(d) ? wd.filter((x) => x !== d) : [...wd, d].sort((a, b) => a - b)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const full: EditableCommitment[] = [...commitments];
      if (photoEnabled && photoWeekdays.length > 0) {
        const draft = photoDraft(photoWeekdays);
        full.push({ ...draft, id: photoId });
      }
      await updateActiveChallenge({
        challengeId,
        restDaysPerWeek: restDays,
        cheatMealsPerWeek: cheatMeals,
        commitments: full,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-muted text-sm">
        Changes apply from today forward. Past days keep what they earned.
      </p>

      {/* Allowances — the reason most people are here */}
      <section className="rounded-lg border border-border bg-surface p-3 space-y-3">
        <div className="text-sm font-medium">Weekly allowances</div>
        <p className="text-xs text-muted -mt-1">
          Rest days excuse workouts; cheat meals excuse the diet — that day only. Used allowances don&apos;t break your streak.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-xs text-muted">Rest days / week</span>
            <select value={restDays} onChange={(e) => setRestDays(Number(e.target.value))}
              className="mt-1 bg-surface2 border border-border rounded px-2 py-2">
              {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-muted">Cheat meals / week</span>
            <select value={cheatMeals} onChange={(e) => setCheatMeals(Number(e.target.value))}
              className="mt-1 bg-surface2 border border-border rounded px-2 py-2">
              {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Commitments */}
      <section className="space-y-2">
        <div className="text-sm font-medium">Commitments</div>
        <ul className="space-y-2">
          {commitments.map((c, i) => (
            <li key={c.id ?? `new-${i}`} className="rounded-lg border border-border bg-surface p-3 space-y-2">
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
                    <option value="numeric">With a minimum target</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <span className="text-muted text-xs">Category</span>
                  <select
                    className="bg-surface2 border border-border rounded px-2 py-1"
                    value={c.category}
                    onChange={(e) => updateCommitment(i, { category: e.target.value as CommitmentCategory })}
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </label>
                {c.type === "numeric" && (
                  <>
                    <label className="flex flex-col">
                      <span className="text-muted text-xs">Minimum</span>
                      <input type="number" step="0.1" min="0"
                        className="bg-surface2 border border-border rounded px-2 py-1"
                        value={c.target_value ?? ""}
                        onChange={(e) => updateCommitment(i, { target_value: Number(e.target.value) })} />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-muted text-xs">Unit</span>
                      <input className="bg-surface2 border border-border rounded px-2 py-1"
                        value={c.unit ?? ""} placeholder="min / pages / L"
                        onChange={(e) => updateCommitment(i, { unit: e.target.value })} />
                    </label>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" checked={c.optional}
                    onChange={(e) => updateCommitment(i, { optional: e.target.checked })} />
                  Optional
                </label>
                <button onClick={() => removeCommitment(i)} className="text-danger text-xs px-2 py-1">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={addCommitment}
          className="w-full rounded-md border border-dashed border-border py-2 text-muted hover:text-text">
          + Add commitment
        </button>
      </section>

      {/* Progress photos */}
      <section className="rounded-lg border border-border bg-surface p-3 space-y-3">
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={photoEnabled}
            onChange={(e) => setPhotoEnabled(e.target.checked)} />
          <span className="text-sm">
            <span className="font-medium">Track progress photos</span>
            <span className="block text-muted">Pick which weekdays a photo is required.</span>
          </span>
        </label>
        {photoEnabled && (
          <div>
            <div className="flex gap-1">
              {WEEKDAY_LABELS.map((lbl, d) => {
                const on = photoWeekdays.includes(d);
                return (
                  <button key={d} type="button" onClick={() => togglePhotoWeekday(d)}
                    className={clsx("flex-1 aspect-square rounded-md border text-sm font-medium",
                      on ? "bg-accent text-black border-accent" : "bg-surface2 border-border text-muted")}
                    aria-label={`Toggle ${lbl}`}>
                    {lbl}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <button type="button" className="text-muted underline" onClick={() => setPhotoWeekdays(ALL_WEEKDAYS)}>Every day</button>
              <button type="button" className="text-muted underline" onClick={() => setPhotoWeekdays([0])}>Sundays only</button>
              <button type="button" className="text-muted underline" onClick={() => setPhotoWeekdays([])}>Clear</button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => router.push("/settings")} className="flex-1 rounded-md bg-surface border border-border py-3">
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
