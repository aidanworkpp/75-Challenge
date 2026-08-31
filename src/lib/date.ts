// [A2 / A25] The whole app runs on a single fixed timezone: SAST (Africa/Johannesburg,
// UTC+2, no DST). "Today" and the log-yesterday cutoffs are computed in SAST regardless
// of where the server (Vercel = UTC) or the user's device is set. This keeps the
// challenge "day" rolling at SA local midnight for everyone.
import { format, addDays, parseISO, differenceInCalendarDays } from "date-fns";

export const APP_TIME_ZONE = "Africa/Johannesburg";

// Current calendar date in SAST as YYYY-MM-DD. Works on server (UTC) and client.
export function todayIso(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function yesterdayIso(): string {
  return isoAddDays(todayIso(), -1);
}

// Current hour (0–23) in SAST. Used by the client-side log-yesterday cutoffs.
export function appHourNow(): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date());
  return parseInt(s, 10);
}

// Pure date-string arithmetic — timezone-independent (parse + format are symmetric).
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
