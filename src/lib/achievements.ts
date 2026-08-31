// Tongue-in-cheek achievement system (Rockstar/PlayStation style).
// The "lines" are original parody tough-love one-liners — deliberately NOT
// quotes from, or attributed to, any real person.

export interface AchievementContext {
  dayNumber: number; // 0 if the challenge hasn't started yet
  longestStreak: number;
  completeDays: number;
  restUsed: number;
  cheatUsed: number;
  lengthDays: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  emoji: string;
  hint: string; // shown while locked
  line: string; // sarcastic payoff, shown once unlocked
  unlocked: (c: AchievementContext) => boolean;
}

export interface EvaluatedAchievement extends AchievementDef {
  isUnlocked: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "day_one",
    title: "Day One",
    emoji: "🥾",
    hint: "Start the challenge",
    line: "Congratulations on the single easiest rep there is: starting. Only the rest of your life to go.",
    unlocked: (c) => c.dayNumber >= 1,
  },
  {
    id: "streak_3",
    title: "Rule of Three",
    emoji: "🔥",
    hint: "Hit a 3-day streak",
    line: "Three days in a row. A houseplant survives longer than that, but sure — take the trophy.",
    unlocked: (c) => c.longestStreak >= 3,
  },
  {
    id: "week_1",
    title: "Seven Down",
    emoji: "📅",
    hint: "Hit a 7-day streak",
    line: "A whole week. Your motivation is still technically in its free trial. Don't cancel.",
    unlocked: (c) => c.longestStreak >= 7,
  },
  {
    id: "double_digits",
    title: "Double Digits",
    emoji: "💯",
    hint: "Hit a 10-day streak",
    line: "Ten straight. Comfort is knocking. Do not, under any circumstances, answer the door.",
    unlocked: (c) => c.longestStreak >= 10,
  },
  {
    id: "fortnight",
    title: "Fortnight of Fury",
    emoji: "⚔️",
    hint: "Hit a 14-day streak",
    line: "Fourteen days. You're now mildly inconvenient to kill. Keep at it, mildly.",
    unlocked: (c) => c.longestStreak >= 14,
  },
  {
    id: "quarter",
    title: "Quarter… ish",
    emoji: "🐣",
    hint: "Reach day 25",
    line: "Day 25. Roughly a third done, which is a fancy way of saying mostly not done. Move.",
    unlocked: (c) => c.dayNumber >= 25,
  },
  {
    id: "halfway",
    title: "Over the Hump",
    emoji: "⛰️",
    hint: "Reach the halfway mark",
    line: "Halfway. Also known as: still halfway to go. Read that twice, then go again.",
    unlocked: (c) => c.dayNumber >= Math.ceil(c.lengthDays / 2),
  },
  {
    id: "fifty",
    title: "Two-Thirds Human",
    emoji: "🦾",
    hint: "Reach day 50",
    line: "Day 50. You're becoming slightly harder to break. Slightly. Don't celebrate with a nap.",
    unlocked: (c) => c.dayNumber >= 50,
  },
  {
    id: "finisher",
    title: "Certified",
    emoji: "🏆",
    hint: "Reach the final day",
    line: "You made it to the end. No parade, no medal, just the person in the mirror looking marginally less disappointed.",
    unlocked: (c) => c.lengthDays > 0 && c.dayNumber >= c.lengthDays,
  },
  {
    id: "rest_day",
    title: "Strategic Napping",
    emoji: "😴",
    hint: "Take your first rest day",
    line: "You took a rest day. Recovery is legitimate. So is guilt. Enjoy both responsibly.",
    unlocked: (c) => c.restUsed >= 1,
  },
  {
    id: "cheat_meal",
    title: "Macros Betrayed",
    emoji: "🍔",
    hint: "Use your first cheat meal",
    line: "You cheated. On a meal. Your future abs have been notified and are, frankly, disappointed.",
    unlocked: (c) => c.cheatUsed >= 1,
  },
  {
    id: "flawless_10",
    title: "Spotless",
    emoji: "✨",
    hint: "Complete 10 days total",
    line: "Ten complete days banked. Impressive, in the way that showing up is technically impressive.",
    unlocked: (c) => c.completeDays >= 10,
  },
];

export function evaluateAchievements(ctx: AchievementContext): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((a) => ({ ...a, isUnlocked: a.unlocked(ctx) }));
}
