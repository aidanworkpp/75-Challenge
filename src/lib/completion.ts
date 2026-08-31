import type { CommitmentItem, DailyLogEntry } from "./types";

// A single commitment is "hit" if:
// - boolean: bool_value === true
// - numeric: numeric_value !== null && >= target_value
export function isEntryHit(item: CommitmentItem, entry: DailyLogEntry | undefined): boolean {
  if (!entry) return false;
  if (item.type === "boolean") return entry.bool_value === true;
  if (item.type === "numeric") {
    if (entry.numeric_value == null || item.target_value == null) return false;
    return entry.numeric_value >= item.target_value;
  }
  return false;
}

// A day is complete iff every REQUIRED commitment is hit.
// Optional items don't gate completion (but still count in stats).
export function isDayComplete(items: CommitmentItem[], entries: DailyLogEntry[]): boolean {
  const entryByItem = new Map(entries.map((e) => [e.commitment_item_id, e]));
  return items
    .filter((i) => !i.optional)
    .every((i) => isEntryHit(i, entryByItem.get(i.id)));
}
