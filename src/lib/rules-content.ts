// Reference explainer for the classic 75 Hard programme
// and short "why this matters" notes per commitment category.
// Written in general terms — not verbatim from any copyrighted source.

export interface RuleSection {
  title: string;
  body: string;
}

export const CLASSIC_75_HARD: RuleSection[] = [
  {
    title: "Two 45-minute workouts a day — one outdoors",
    body: "The original programme requires two separate workouts of at least 45 minutes each, every day, with one taking place outdoors regardless of weather. The outdoor rule exists to force adaptability — training your ability to follow through when conditions aren't convenient.",
  },
  {
    title: "Follow a diet — no cheat meals, no alcohol",
    body: "You pick the diet; the rule is that you stick to it exactly. No cheat meals, no cheat days, no alcohol for the full duration. The point isn't nutrition ideology — it's the discipline of choosing a plan and honouring it without exception.",
  },
  {
    title: "Drink 1 gallon of water daily",
    body: "Roughly 3.8 litres. A daily target you cannot forget until evening — either you plan it in or you miss it.",
  },
  {
    title: "Read 10 pages of non-fiction",
    body: "Specifically non-fiction, ideally self-development or educational. Ten pages is small enough that skipping it is purely a choice, not a matter of time.",
  },
  {
    title: "Take a daily progress photo",
    body: "One photo per day, for the full challenge. It creates an objective record you can look back at — separate from how you feel on any given day.",
  },
  {
    title: "No substitutions. No restarting from where you left off.",
    body: "If you miss any part of any day, the rules say you start over from day one. This is the part most people water down. The Medium and Soft tiers here relax this deliberately — pick the version that fits what you're actually trying to build.",
  },
];

export const CATEGORY_CONTEXT: Record<string, string> = {
  workout:
    "Two-a-days build a base level of consistency that a single workout doesn't. The outdoor workout in particular is about doing the thing you don't feel like doing — that's where the discipline compounds.",
  diet:
    "The 'no cheat meals' rule isn't about nutrition — it's about the practice of holding a boundary you set for yourself. Softening this line is what dilutes the challenge.",
  reading:
    "Non-fiction specifically — the daily habit is meant to be inputs that change how you think, not entertainment. Ten pages is a deliberately small number so 'no time' is never the real reason.",
  water:
    "A high daily water target forces you to plan your day around it. Missing it in the evening isn't about hydration — it's a signal you didn't structure your day.",
  photo:
    "The progress photo removes the emotional bias of how you feel about your progress. You get an objective record, taken daily, that you can review at the end.",
  custom:
    "This is your own added commitment — the 'why' behind it is up to you.",
};
