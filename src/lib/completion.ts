import type { CommitmentItem, DailyLogEntry } from "./types";

export function weekdayOf(iso: string): number {
  // 0=Sunday…6=Saturday, matching JS Date.getDay()
  const d = new Date(iso + "T00:00:00");
  return d.getDay();
}

export function isItemActiveOn(item: CommitmentItem, iso: string): boolean {
  if (!item.active_weekdays || item.active_weekdays.length === 0) return true;
  return item.active_weekdays.includes(weekdayOf(iso));
}

// All entries are booleans now — "hit" = bool_value === true.
export function isEntryHit(_item: CommitmentItem, entry: DailyLogEntry | undefined): boolean {
  return entry?.bool_value === true;
}

// A day is complete iff every REQUIRED item that is active on that day is hit.
// Optional items don't gate completion; items inactive today are ignored.
export function isDayCompleteFor(
  items: CommitmentItem[],
  entries: DailyLogEntry[],
  dateIso: string,
): boolean {
  const entryByItem = new Map(entries.map((e) => [e.commitment_item_id, e]));
  return items
    .filter((i) => !i.optional && isItemActiveOn(i, dateIso))
    .every((i) => isEntryHit(i, entryByItem.get(i.id)));
}

// Kept for callers that don't have the date handy — treats today as "every day"
// (used by the server action which only mutates today's log).
export function isDayComplete(items: CommitmentItem[], entries: DailyLogEntry[]): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isDayCompleteFor(items, entries, today);
}
