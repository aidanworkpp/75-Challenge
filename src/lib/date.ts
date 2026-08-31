// [A2] "Today" is the user's local calendar day. All dates stored as YYYY-MM-DD.
// This means a challenge day changes when the user's local midnight passes,
// not UTC midnight. If a user travels timezones, the day boundary shifts with them.
import { format, addDays, parseISO, differenceInCalendarDays } from "date-fns";

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function yesterdayIso(): string {
  return format(addDays(new Date(), -1), "yyyy-MM-dd");
}

export function isoAddDays(iso: string, n: number): string {
  return format(addDays(parseISO(iso), n), "yyyy-MM-dd");
}

export function daysBetweenIso(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a));
}

export function formatFriendly(iso: string): string {
  return format(parseISO(iso), "EEE, d MMM");
}

export function formatDayLong(iso: string): string {
  return format(parseISO(iso), "EEEE, d MMMM yyyy");
}

// Day number within a challenge (1-indexed). Returns null if before start.
export function challengeDayNumber(startIso: string, dateIso: string): number | null {
  const n = daysBetweenIso(startIso, dateIso) + 1;
  return n < 1 ? null : n;
}
