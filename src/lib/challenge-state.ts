import { createClient } from "./supabase/server";
import { daysBetweenIso, isoAddDays, todayIso } from "./date";

// [A20] Yesterday is only "settled" once local time passes 13:00 the next day.
//       - Server-side reconcile (called from page render) always uses
//         includeYesterday=false — never fails a challenge on yesterday's miss.
//       - A client component checks local time and calls settleYesterday()
//         (which passes includeYesterday=true) once it's past the cutoff.
export async function reconcileChallengeState(
  challengeId: string,
  userId: string,
  { includeYesterday }: { includeYesterday: boolean } = { includeYesterday: false },
): Promise<void> {
  const supabase = createClient();
  const { data: ch } = await supabase.from("challenges").select("*").eq("id", challengeId).single();
  if (!ch || ch.user_id !== userId || ch.status !== "active") return;

  const today = todayIso();
  const endDate = isoAddDays(ch.start_date, ch.length_days - 1);
  const isPastEnd = today > endDate;

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, complete")
    .eq("challenge_id", challengeId);
  const byDate = new Map((logs ?? []).map((l) => [l.log_date, l.complete as boolean]));

  const elapsedPastDays = Math.min(
    Math.max(daysBetweenIso(ch.start_date, today), 0),
    ch.length_days,
  );
  // Yesterday sits in the grace window unless includeYesterday is true.
  const daysToCheck = includeYesterday ? elapsedPastDays : Math.max(0, elapsedPastDays - 1);

  let anyMissed = false;
  for (let i = 0; i < daysToCheck; i++) {
    const d = isoAddDays(ch.start_date, i);
    if (!byDate.get(d)) { anyMissed = true; break; }
  }

  if (ch.restart_on_miss && anyMissed) {
    await supabase.from("challenges").update({ status: "failed" }).eq("id", challengeId);
    return;
  }
  if (isPastEnd) {
    // For end-of-challenge completion we do check yesterday too — the challenge is over.
    let allComplete = true;
    for (let i = 0; i < elapsedPastDays; i++) {
      const d = isoAddDays(ch.start_date, i);
      if (!byDate.get(d)) { allComplete = false; break; }
    }
    const status = allComplete ? "completed" : "failed";
    await supabase.from("challenges").update({ status }).eq("id", challengeId);
  }
}
