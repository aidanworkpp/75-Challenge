import type { DailyLog } from "./types";
import { todayIso } from "./date";

// Current streak = consecutive complete days ending yesterday-or-today.
// If today isn't marked complete yet, streak still includes yesterday's run.
export function currentStreak(logs: DailyLog[]): number {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const today = todayIso();
  let streak = 0;
  let cursor = today;
  // If today isn't complete, start from yesterday
  if (!byDate.get(cursor)?.complete) {
    cursor = shiftDay(cursor, -1);
  }
  while (byDate.get(cursor)?.complete) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export function longestStreak(logs: DailyLog[]): number {
  const sorted = [...logs].filter((l) => l.complete).sort((a, b) => a.log_date.localeCompare(b.log_date));
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const l of sorted) {
    if (prev && shiftDay(prev, 1) === l.log_date) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = l.log_date;
  }
  return best;
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
