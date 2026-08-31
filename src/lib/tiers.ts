import type { CommitmentDraft, Tier } from "./types";

// [A5] Water in litres (metric).
// [A6] Default challenge length 75 days for all tiers.
// [A7] restart_on_miss defaults: Hard = true, Medium/Soft = false.
// [A16] active_weekdays: null = every day. Progress photos can be scoped
//        to specific weekdays only.
// [A17] Tracking on the Today screen is checkbox-only. The numeric
//        target_value + unit are shown as descriptive minimum
//        ("Workout — 45 min minimum").

export interface TierTemplate {
  id: Exclude<Tier, "custom">;
  name: string;
  tagline: string;
  restart_on_miss: boolean;
  defaultLength: number;
  commitments: CommitmentDraft[];
  photoDefault: { enabled: boolean; weekdays: number[] };
}

const daily = (c: Omit<CommitmentDraft, "active_weekdays">): CommitmentDraft => ({
  ...c,
  active_weekdays: null,
});

export const ALL_WEEKDAYS: number[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_LONG   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TIER_TEMPLATES: Record<Exclude<Tier, "custom">, TierTemplate> = {
  hard: {
    id: "hard",
    name: "Hard",
    tagline: "The full programme. No compromises.",
    restart_on_miss: true,
    defaultLength: 75,
    photoDefault: { enabled: true, weekdays: ALL_WEEKDAYS },
    commitments: [
      daily({ label: "Workout 1 (indoor/gym)", type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false }),
      daily({ label: "Workout 2 (outdoors)",   type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false }),
      daily({ label: "Follow diet — no cheat meals or alcohol", type: "boolean", target_value: null, unit: null, category: "diet", optional: false }),
      daily({ label: "Drink water",            type: "numeric", target_value: 3.8, unit: "L", category: "water", optional: false }),
      daily({ label: "Read non-fiction",       type: "numeric", target_value: 10, unit: "pages", category: "reading", optional: false }),
    ],
  },
  medium: {
    id: "medium",
    name: "Medium",
    tagline: "Structured but sustainable.",
    restart_on_miss: false,
    defaultLength: 75,
    photoDefault: { enabled: true, weekdays: [0] }, // Sundays
    commitments: [
      daily({ label: "Workout",                    type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false }),
      daily({ label: "Optional 2nd workout",       type: "numeric", target_value: 30, unit: "min", category: "workout", optional: true }),
      daily({ label: "Planned, structured meals",  type: "boolean", target_value: null, unit: null, category: "diet", optional: false }),
      daily({ label: "Drink water",                type: "numeric", target_value: 2.5, unit: "L", category: "water", optional: false }),
      daily({ label: "Read",                       type: "numeric", target_value: 10, unit: "pages", category: "reading", optional: false }),
    ],
  },
  soft: {
    id: "soft",
    name: "Soft",
    tagline: "Build the habit. No punitive resets.",
    restart_on_miss: false,
    defaultLength: 75,
    photoDefault: { enabled: false, weekdays: [] },
    commitments: [
      daily({ label: "Workout",         type: "numeric", target_value: 30, unit: "min", category: "workout", optional: false }),
      daily({ label: "Eat mindfully",   type: "boolean", target_value: null, unit: null, category: "diet", optional: false }),
      daily({ label: "Read",            type: "numeric", target_value: 5,  unit: "pages", category: "reading", optional: false }),
      daily({ label: "Drink water",     type: "numeric", target_value: 2,  unit: "L", category: "water", optional: false }),
    ],
  },
};

export const TIER_LIST: TierTemplate[] = [
  TIER_TEMPLATES.hard,
  TIER_TEMPLATES.medium,
  TIER_TEMPLATES.soft,
];

export function photoDraft(weekdays: number[]): CommitmentDraft {
  return {
    label: "Progress photo",
    type: "boolean",
    target_value: null,
    unit: null,
    category: "photo",
    optional: false,
    active_weekdays: weekdays.length === 7 ? null : [...weekdays].sort((a, b) => a - b),
  };
}
