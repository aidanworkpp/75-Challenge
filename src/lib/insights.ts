import type { CommitmentItem, DailyLog, DailyLogEntry } from "./types";
import { isEntryHit, isItemActiveOn } from "./completion";
import { daysBetweenIso, todayIso } from "./date";

export interface CommitmentConsistency {
  item: CommitmentItem;
  hitRate: number; // 0..1
  hits: number;
  totalDays: number; // number of elapsed days on which this item was active
}

// Elapsed days (inclusive) from challenge start up to min(today, end).
export function elapsedDays(startDate: string, lengthDays: number): number {
  const today = todayIso();
  const end = shiftDay(startDate, lengthDays - 1);
  const cap = today < end ? today : end;
  const n = daysBetweenIso(startDate, cap) + 1;
  return Math.max(0, n);
}

export function completionRate(logs: DailyLog[], elapsed: number): number {
  if (elapsed === 0) return 0;
  const complete = logs.filter((l) => l.complete).length;
  return complete / elapsed;
}

export function perCommitmentConsistency(
  items: CommitmentItem[],
  logs: DailyLog[],
  entries: DailyLogEntry[],
  startDate: string,
  elapsed: number,
): CommitmentConsistency[] {
  const entriesByLog = new Map<string, DailyLogEntry[]>();
  for (const e of entries) {
    const arr = entriesByLog.get(e.daily_log_id) ?? [];
    arr.push(e);
    entriesByLog.set(e.daily_log_id, arr);
  }
  const logByDate = new Map(logs.map((l) => [l.log_date, l]));

  return items.map((item) => {
    let hits = 0;
    let activeDays = 0;
    for (let i = 0; i < elapsed; i++) {
      const iso = shiftDay(startDate, i);
      if (!isItemActiveOn(item, iso)) continue;
      activeDays += 1;
      const log = logByDate.get(iso);
      if (!log) continue;
      const es = entriesByLog.get(log.id) ?? [];
      const entry = es.find((e) => e.commitment_item_id === item.id);
      if (isEntryHit(item, entry)) hits += 1;
    }
    return {
      item,
      hits,
      totalDays: activeDays,
      hitRate: activeDays === 0 ? 0 : hits / activeDays,
    };
  });
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
