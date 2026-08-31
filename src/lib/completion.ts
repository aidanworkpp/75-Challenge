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

export interface DayAllowances {
  restDay?: boolean;    // excuses required workout-category items
  cheatMeal?: boolean;  // excuses required diet-category items
}

// An item is "excused" on a day if a rest day covers its workout category
// or a cheat meal covers its diet category.
export function isItemExcused(item: CommitmentItem, allow: DayAllowances): boolean {
  if (allow.restDay && item.category === "workout") return true;
  if (allow.cheatMeal && item.category === "diet") return true;
  return false;
}

// A day is complete iff every REQUIRED item that is active on that day AND not
// excused (by a rest day / cheat meal) is hit.
// Optional items don't gate completion; items inactive today are ignored.
export function isDayCompleteFor(
  items: CommitmentItem[],
  entries: DailyLogEntry[],
  dateIso: string,
  allow: DayAllowances = {},
): boolean {
  const entryByItem = new Map(entries.map((e) => [e.commitment_item_id, e]));
  return items
    .filter((i) => !i.optional && isItemActiveOn(i, dateIso) && !isItemExcused(i, allow))
    .every((i) => isEntryHit(i, entryByItem.get(i.id)));
}
