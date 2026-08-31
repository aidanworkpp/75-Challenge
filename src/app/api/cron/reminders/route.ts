import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, fromAddress, morningTemplate, eveningTemplate } from "@/lib/email";
import { isDayComplete } from "@/lib/completion";
import { currentStreak } from "@/lib/streak";
import { challengeDayNumber } from "@/lib/date";
import type { Challenge, CommitmentItem, DailyLog, DailyLogEntry } from "@/lib/types";

// Vercel Cron: this route is hit hourly. For each active challenge, it:
//   1. Computes the user's local hour and date
//   2. Matches against reminder_hour_morning / reminder_hour_evening
//   3. Sends the email (deduped via email_reminders) if reminders_enabled
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. We require it.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Pull all active challenges + owning profile in one join
  const { data: activeChallenges, error: chErr } = await supabase
    .from("challenges")
    .select(`
      *,
      profile:profiles!inner(id, display_name, timezone, reminder_hour_morning, reminder_hour_evening, reminders_enabled)
    `)
    .eq("status", "active");
  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  // We also need each user's email — fetch from auth.users via admin API
  const results: { userId: string; kind: "morning" | "evening"; status: string }[] = [];

  for (const raw of activeChallenges ?? []) {
    const ch = raw as Challenge & { profile: {
      id: string; display_name: string; timezone: string;
      reminder_hour_morning: number; reminder_hour_evening: number; reminders_enabled: boolean;
    } };
    const profile = ch.profile;
    if (!profile.reminders_enabled) continue;

    let localHour: number;
    let localDate: string;
    try {
      localHour = Number(formatInTimeZone(now, profile.timezone, "H"));
      localDate = formatInTimeZone(now, profile.timezone, "yyyy-MM-dd");
    } catch {
      continue; // bad timezone — skip
    }

    let kind: "morning" | "evening" | null = null;
    if (localHour === profile.reminder_hour_morning) kind = "morning";
    else if (localHour === profile.reminder_hour_evening) kind = "evening";
    if (!kind) continue;

    // Skip if challenge hasn't started yet or is past end
    const dayNum = challengeDayNumber(ch.start_date, localDate);
    if (dayNum === null || dayNum > ch.length_days) continue;

    // Dedup — insert row, and if it conflicts, skip
    const { error: dupErr } = await supabase
      .from("email_reminders")
      .insert({ user_id: profile.id, local_date: localDate, kind });
    if (dupErr) {
      results.push({ userId: profile.id, kind, status: "already-sent" });
      continue;
    }

    // Load items + today's log + entries
    const { data: items } = await supabase
      .from("commitment_items")
      .select("*")
      .eq("challenge_id", ch.id)
      .order("sort_order");
    const { data: log } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("challenge_id", ch.id)
      .eq("log_date", localDate)
      .maybeSingle();
    let entries: DailyLogEntry[] = [];
    if (log) {
      const { data: e } = await supabase
        .from("daily_log_entries")
        .select("*")
        .eq("daily_log_id", log.id);
      entries = (e ?? []) as DailyLogEntry[];
    }

    // For evening: if the day is already complete, still send a "nice work" version.
    // For morning: always send unless the challenge hasn't started.

    // Look up email address
    const { data: userLookup, error: userErr } = await supabase.auth.admin.getUserById(profile.id);
    if (userErr || !userLookup?.user?.email) {
      results.push({ userId: profile.id, kind, status: "no-email" });
      continue;
    }
    const email = userLookup.user.email;

    // Streak — need all logs for accuracy
    const { data: allLogs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("challenge_id", ch.id);

    const itemsSafe = (items ?? []) as CommitmentItem[];
    const complete = log ? isDayComplete(itemsSafe, entries) : false;

    let subject: string;
    let html: string;
    let text: string;

    if (kind === "morning") {
      const t = morningTemplate({
        displayName: profile.display_name,
        dayNumber: dayNum,
        totalDays: ch.length_days,
        items: itemsSafe,
      });
      subject = t.subject; html = t.html; text = t.text;
    } else {
      const streak = currentStreak((allLogs ?? []) as DailyLog[]);
      const t = eveningTemplate({
        displayName: profile.display_name,
        dayNumber: dayNum,
        totalDays: ch.length_days,
        streak,
        items: itemsSafe,
        entries,
      });
      subject = t.subject; html = t.html; text = t.text;
    }

    try {
      await resend.emails.send({
        from: fromAddress(),
        to: email,
        subject,
        html,
        text,
      });
      results.push({ userId: profile.id, kind, status: complete && kind === "evening" ? "sent-complete" : "sent" });
    } catch (e: unknown) {
      // Roll back the dedup row so we can retry next hour
      await supabase
        .from("email_reminders")
        .delete()
        .eq("user_id", profile.id)
        .eq("local_date", localDate)
        .eq("kind", kind);
      const message = e instanceof Error ? e.message : "send failed";
      results.push({ userId: profile.id, kind, status: `error:${message}` });
    }
  }

  return NextResponse.json({ ok: true, results });
}
