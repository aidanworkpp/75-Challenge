import type { CommitmentDraft, Tier } from "./types";

// [A5] Water in litres (metric). Change to gallons/oz if you'd prefer.
// [A6] Default challenge length 75 days for all tiers.
// [A7] restart_on_miss defaults: Hard = true, Medium/Soft = false.

export interface TierTemplate {
  id: Tier;
  name: string;
  tagline: string;
  restart_on_miss: boolean;
  defaultLength: number;
  commitments: CommitmentDraft[];
}

export const TIER_TEMPLATES: Record<Exclude<Tier, "custom">, TierTemplate> = {
  hard: {
    id: "hard",
    name: "Hard",
    tagline: "The full programme. No compromises.",
    restart_on_miss: true,
    defaultLength: 75,
    commitments: [
      { label: "Workout 1 (indoor/gym)", type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false },
      { label: "Workout 2 (outdoors)",   type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false },
      { label: "Follow diet — no cheat meals or alcohol", type: "boolean", target_value: null, unit: null, category: "diet", optional: false },
      { label: "Drink water",            type: "numeric", target_value: 3.8, unit: "L", category: "water", optional: false },
      { label: "Read non-fiction",       type: "numeric", target_value: 10, unit: "pages", category: "reading", optional: false },
      { label: "Progress photo",         type: "boolean", target_value: null, unit: null, category: "photo", optional: false },
    ],
  },
  medium: {
    id: "medium",
    name: "Medium",
    tagline: "Structured but sustainable.",
    restart_on_miss: false,
    defaultLength: 75,
    commitments: [
      { label: "Workout",                    type: "numeric", target_value: 45, unit: "min", category: "workout", optional: false },
      { label: "Optional 2nd workout",       type: "numeric", target_value: 30, unit: "min", category: "workout", optional: true },
      { label: "Planned, structured meals",  type: "boolean", target_value: null, unit: null, category: "diet", optional: false },
      { label: "Drink water",                type: "numeric", target_value: 2.5, unit: "L", category: "water", optional: false },
      { label: "Read",                       type: "numeric", target_value: 10, unit: "pages", category: "reading", optional: false },
    ],
  },
  soft: {
    id: "soft",
    name: "Soft",
    tagline: "Build the habit. No punitive resets.",
    restart_on_miss: false,
    defaultLength: 75,
    commitments: [
      { label: "Workout",         type: "numeric", target_value: 30, unit: "min", category: "workout", optional: false },
      { label: "Eat mindfully",   type: "boolean", target_value: null, unit: null, category: "diet", optional: false },
      { label: "Read",            type: "numeric", target_value: 5,  unit: "pages", category: "reading", optional: false },
      { label: "Drink water",     type: "numeric", target_value: 2,  unit: "L", category: "water", optional: false },
    ],
  },
};

export const TIER_LIST: TierTemplate[] = [
  TIER_TEMPLATES.hard,
  TIER_TEMPLATES.medium,
  TIER_TEMPLATES.soft,
];
