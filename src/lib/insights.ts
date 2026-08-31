import type { CommitmentItem, DailyLog, DailyLogEntry } from "./types";
import { isEntryHit } from "./completion";
import { daysBetweenIso, todayIso } from "./date";

export interface CommitmentConsistency {
  item: CommitmentItem;
  hitRate: number; // 0..1
  hits: number;
  totalDays: number;
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
  elapsed: number,
): CommitmentConsistency[] {
  const entriesByLog = new Map<string, DailyLogEntry[]>();
  for (const e of entries) {
    const arr = entriesByLog.get(e.daily_log_id) ?? [];
    arr.push(e);
    entriesByLog.set(e.daily_log_id, arr);
  }

  return items.map((item) => {
    let hits = 0;
    for (const log of logs) {
      const es = entriesByLog.get(log.id) ?? [];
      const entry = es.find((e) => e.commitment_item_id === item.id);
      if (isEntryHit(item, entry)) hits += 1;
    }
    return {
      item,
      hits,
      totalDays: elapsed,
      hitRate: elapsed === 0 ? 0 : hits / elapsed,
    };
  });
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
