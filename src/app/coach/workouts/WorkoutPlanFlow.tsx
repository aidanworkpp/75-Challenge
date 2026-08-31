"use client";

import { useState } from "react";
import PlanFlow from "@/components/PlanFlow";

type Goal = "strength" | "hypertrophy" | "endurance" | "fat_loss" | "general";
type Level = "beginner" | "intermediate" | "advanced";

const GOAL_LABEL: Record<Goal, string> = {
  strength: "strength (heavy lifting)",
  hypertrophy: "hypertrophy (muscle size)",
  endurance: "endurance / conditioning",
  fat_loss: "fat loss with muscle retention",
  general: "general fitness",
};

const GOAL_SHORT: Record<Goal, string> = {
  strength: "Strength",
  hypertrophy: "Muscle",
  endurance: "Endurance",
  fat_loss: "Fat loss",
  general: "General",
};

export default function WorkoutPlanFlow() {
  const [goal, setGoal] = useState<Goal>("general");
  const [level, setLevel] = useState<Level>("intermediate");
  const [days, setDays] = useState("3");
  const [minutes, setMinutes] = useState("45");
  const [equipment, setEquipment] = useState("full gym");
  const [notes, setNotes] = useState("");

  function buildPrompt(): string {
    const parts: string[] = [];
    parts.push(`Please generate a weekly workout plan.`);
    parts.push(`Goal: ${GOAL_LABEL[goal]}.`);
    parts.push(`Experience level: ${level}.`);
    parts.push(`Sessions per week: ${days}.`);
    parts.push(`Time per session: ~${minutes} minutes including warm-up and cool-down.`);
    parts.push(`Available equipment: ${equipment.trim() || "bodyweight only"}.`);
    if (notes.trim()) parts.push(`Additional notes / injuries / preferences: ${notes.trim()}.`);
    parts.push(`Structure each session with Warm-up / Main work / Accessory / Cool-down and specify sets × reps and rough RPE.`);
    return parts.join(" ");
  }

  return (
    <PlanFlow
      kind="workout"
      planTitle="Workout plan"
      renderForm={(submit, busy) => (
        <form
          onSubmit={(e) => { e.preventDefault(); submit(buildPrompt()); }}
          className="space-y-4"
        >
          <p className="text-muted text-sm">
            Written in the style of an expert S&amp;C coach. Not medical advice.
          </p>

          <label className="block">
            <span className="text-sm text-muted">Goal</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(Object.keys(GOAL_SHORT) as Goal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-md border px-2 py-2 text-sm font-medium ${
                    goal === g ? "bg-accent text-black border-accent" : "bg-surface border-border text-muted"
                  }`}
                >
                  {GOAL_SHORT[g]}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-muted">Experience level</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`rounded-md border px-2 py-2 text-sm font-medium ${
                    level === l ? "bg-accent text-black border-accent" : "bg-surface border-border text-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-muted">Sessions / week</span>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2"
              >
                {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-muted">Minutes / session</span>
              <select
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2"
              >
                {[30, 45, 60, 75, 90].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-muted">Equipment</span>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2"
              placeholder="e.g. full gym, dumbbells + bench, bodyweight only"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Notes (injuries / preferences)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 resize-none"
              placeholder="e.g. bad left knee — avoid deep squats. Prefer compound lifts."
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-accent text-black font-semibold py-3 disabled:opacity-60"
          >
            {busy ? "Generating…" : "Generate plan"}
          </button>
        </form>
      )}
    />
  );
}
