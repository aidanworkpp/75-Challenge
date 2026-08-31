import { createClient } from "./supabase/server";
import { daysBetweenIso, todayIso } from "./date";

// Idempotent: safe to call on every render.
// Auto-marks challenge failed if restart_on_miss + any past day incomplete,
// or completed if past end (failed if any past day incomplete).
export async function reconcileChallengeState(challengeId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { data: ch } = await supabase.from("challenges").select("*").eq("id", challengeId).single();
  if (!ch || ch.user_id !== userId || ch.status !== "active") return;

  const today = todayIso();
  const endDate = shiftDay(ch.start_date, ch.length_days - 1);
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
  let anyMissed = false;
  for (let i = 0; i < elapsedPastDays; i++) {
    const d = shiftDay(ch.start_date, i);
    if (!byDate.get(d)) { anyMissed = true; break; }
  }

  if (ch.restart_on_miss && anyMissed) {
    await supabase.from("challenges").update({ status: "failed" }).eq("id", challengeId);
    return;
  }
  if (isPastEnd) {
    const status = anyMissed ? "failed" : "completed";
    await supabase.from("challenges").update({ status }).eq("id", challengeId);
  }
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
