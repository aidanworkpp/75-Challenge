import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMailer, fromAddress, afternoonTemplate } from "@/lib/email";
import { challengeDayNumber, todayIso } from "@/lib/date";
import type { Challenge, CommitmentItem, DailyLogEntry } from "@/lib/types";

// Vercel Cron: fires once daily at the UTC hour set in vercel.json.
// For each active, opted-in challenge → sends the afternoon reminder
// (deduped in email_reminders so multiple runs the same day only send once).
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

  const mailer = getMailer();
  if (!mailer) {
    return NextResponse.json({ error: "GMAIL_USER / GMAIL_APP_PASSWORD not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();

  const { data: activeChallenges, error: chErr } = await supabase
    .from("challenges")
    .select(`
      *,
      profile:profiles!inner(id, display_name, reminders_enabled)
    `)
    .eq("status", "active");
  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  const today = todayIso(); // UTC "today" — good enough for a single daily job
  const results: { userId: string; status: string }[] = [];

  for (const raw of activeChallenges ?? []) {
    const ch = raw as Challenge & { profile: { id: string; display_name: string; reminders_enabled: boolean } };
    const profile = ch.profile;
    if (!profile.reminders_enabled) continue;

    const dayNum = challengeDayNumber(ch.start_date, today);
    if (dayNum === null || dayNum > ch.length_days) continue;

    // Dedup — insert row, and if it conflicts, skip
    const { error: dupErr } = await supabase
      .from("email_reminders")
      .insert({ user_id: profile.id, log_date: today });
    if (dupErr) {
      results.push({ userId: profile.id, status: "already-sent" });
      continue;
    }

    // Look up email address
    const { data: userLookup, error: userErr } = await supabase.auth.admin.getUserById(profile.id);
    if (userErr || !userLookup?.user?.email) {
      results.push({ userId: profile.id, status: "no-email" });
      continue;
    }
    const email = userLookup.user.email;

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
      .eq("log_date", today)
      .maybeSingle();
    let entries: DailyLogEntry[] = [];
    if (log) {
      const { data: e } = await supabase
        .from("daily_log_entries")
        .select("*")
        .eq("daily_log_id", log.id);
      entries = (e ?? []) as DailyLogEntry[];
    }

    const t = afternoonTemplate({
      displayName: profile.display_name,
      dayNumber: dayNum,
      totalDays: ch.length_days,
      items: (items ?? []) as CommitmentItem[],
      entries,
    });

    try {
      await mailer.sendMail({
        from: fromAddress(),
        to: email,
        subject: t.subject,
        html: t.html,
        text: t.text,
      });
      results.push({ userId: profile.id, status: "sent" });
    } catch (e: unknown) {
      await supabase
        .from("email_reminders")
        .delete()
        .eq("user_id", profile.id)
        .eq("log_date", today);
      const message = e instanceof Error ? e.message : "send failed";
      results.push({ userId: profile.id, status: `error:${message}` });
    }
  }

  return NextResponse.json({ ok: true, results });
}
