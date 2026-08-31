import { createClient } from "./supabase/server";
import type { Challenge, CommitmentItem, DailyLog, DailyLogEntry, Profile } from "./types";

export async function getActiveChallengeBundle(userId: string): Promise<{
  challenge: Challenge | null;
  items: CommitmentItem[];
  logs: DailyLog[];
  entries: DailyLogEntry[];
}> {
  const supabase = createClient();
  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!challenge) return { challenge: null, items: [], logs: [], entries: [] };

  const [{ data: items }, { data: logs }] = await Promise.all([
    supabase
      .from("commitment_items")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("sort_order"),
    supabase
      .from("daily_logs")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("log_date", { ascending: false }),
  ]);

  const logIds = (logs ?? []).map((l: DailyLog) => l.id);
  let entries: DailyLogEntry[] = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_entries")
      .select("*")
      .in("daily_log_id", logIds);
    entries = (data ?? []) as DailyLogEntry[];
  }

  return {
    challenge: challenge as Challenge,
    items: (items ?? []) as CommitmentItem[],
    logs: (logs ?? []) as DailyLog[],
    entries,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile) ?? null;
}
