import type { Challenge, DailyLog } from "./types";
import { daysBetweenIso } from "./date";

// Challenge-week index for a date (0-based): days since start / 7.
export function challengeWeekIndex(startIso: string, dateIso: string): number {
  return Math.floor(daysBetweenIso(startIso, dateIso) / 7);
}

export interface AllowanceStatus {
  restUsed: number;
  restBudget: number;
  restRemaining: number;
  cheatUsed: number;
  cheatBudget: number;
  cheatRemaining: number;
}

// Usage within the challenge-week that contains `dateIso`.
export function allowanceStatusForWeek(
  challenge: Challenge,
  logs: DailyLog[],
  dateIso: string,
): AllowanceStatus {
  const week = challengeWeekIndex(challenge.start_date, dateIso);
  let restUsed = 0;
  let cheatUsed = 0;
  for (const l of logs) {
    if (challengeWeekIndex(challenge.start_date, l.log_date) !== week) continue;
    if (l.rest_day) restUsed += 1;
    if (l.cheat_meal) cheatUsed += 1;
  }
  const restBudget = challenge.rest_days_per_week;
  const cheatBudget = challenge.cheat_meals_per_week;
  return {
    restUsed,
    restBudget,
    restRemaining: Math.max(0, restBudget - restUsed),
    cheatUsed,
    cheatBudget,
    cheatRemaining: Math.max(0, cheatBudget - cheatUsed),
  };
}
