"use client";

import { useState } from "react";
import PlanFlow from "@/components/PlanFlow";

type Goal = "loss" | "maintenance" | "gain";

const GOAL_LABEL: Record<Goal, string> = {
  loss: "weight loss",
  maintenance: "maintenance",
  gain: "weight gain",
};

export default function MealPlanFlow() {
  const [goal, setGoal] = useState<Goal>("maintenance");
  const [maintenanceCals, setMaintenanceCals] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [prefs, setPrefs] = useState("");
  const [days, setDays] = useState("3");

  function buildPrompt(): string {
    const parts: string[] = [];
    parts.push(`Please generate a ${days}-day meal plan.`);
    parts.push(`Goal: ${GOAL_LABEL[goal]}.`);
    if (maintenanceCals.trim()) {
      parts.push(`My stated maintenance calories: ${maintenanceCals.trim()} kcal/day. Set the plan's daily target relative to that goal.`);
    } else {
      parts.push(`I don't know my exact maintenance calories — use a reasonable estimate and note the assumption.`);
    }
    if (restrictions.trim()) parts.push(`Restrictions: ${restrictions.trim()}.`);
    if (prefs.trim()) parts.push(`Preferences: ${prefs.trim()}.`);
    parts.push(`Format each day with Breakfast / Lunch / Dinner / Snacks, portion sizes, and a daily calorie + protein summary.`);
    return parts.join(" ");
  }

  return (
    <PlanFlow
      kind="meal"
      planTitle="Meal plan"
      renderForm={(submit, busy) => (
        <form
          onSubmit={(e) => { e.preventDefault(); submit(buildPrompt()); }}
          className="space-y-4"
        >
          <p className="text-muted text-sm">
            Written in the style of an expert dietitian. Not medical advice.
          </p>

          <label className="block">
            <span className="text-sm text-muted">Goal</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["loss", "maintenance", "gain"] as Goal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-md border px-2 py-2 text-sm font-medium ${
                    goal === g ? "bg-accent text-black border-accent" : "bg-surface border-border text-muted"
                  }`}
                >
                  {g === "loss" ? "Fat loss" : g === "maintenance" ? "Maintain" : "Gain"}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-muted">Maintenance calories (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={maintenanceCals}
              onChange={(e) => setMaintenanceCals(e.target.value)}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2"
              placeholder="e.g. 2400"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Days in plan</span>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2"
            >
              <option value="1">1 day (sample)</option>
              <option value="3">3 days</option>
              <option value="7">7 days (week)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-muted">Restrictions</span>
            <textarea
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 resize-none"
              placeholder="e.g. no dairy, allergic to peanuts, halal, vegetarian"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Preferences (optional)</span>
            <textarea
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 resize-none"
              placeholder="e.g. quick to cook, high-protein, Mediterranean style"
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
