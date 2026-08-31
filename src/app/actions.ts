"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDayCompleteFor } from "@/lib/completion";
import { todayIso } from "@/lib/date";
import type { CommitmentItem, DailyLogEntry } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function upsertTodayLog(challengeId: string, date: string) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("log_date", date)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("daily_logs")
    .insert({ challenge_id: challengeId, log_date: date, complete: false })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function recomputeAndPersistCompletion(dailyLogId: string) {
  const supabase = createClient();
  const { data: log } = await supabase
    .from("daily_logs").select("*").eq("id", dailyLogId).single();
  if (!log) return;
  const { data: items } = await supabase
    .from("commitment_items").select("*").eq("challenge_id", log.challenge_id);
  const { data: entries } = await supabase
    .from("daily_log_entries").select("*").eq("daily_log_id", dailyLogId);
  const complete = isDayCompleteFor(
    (items ?? []) as CommitmentItem[],
    (entries ?? []) as DailyLogEntry[],
    log.log_date as string,
  );
  await supabase
    .from("daily_logs")
    .update({ complete, updated_at: new Date().toISOString() })
    .eq("id", dailyLogId);
}

// All check-ins are boolean now (checkboxes on the Today screen).
// dateIso lets the caller target a specific day (used by log-yesterday).
// Server validates the date is within the challenge window and not in the future.
export async function setBooleanEntry(itemId: string, value: boolean, dateIso?: string) {
  const { supabase, user } = await requireUser();
  const date = dateIso ?? todayIso();

  const { data: item } = await supabase.from("commitment_items").select("challenge_id").eq("id", itemId).single();
  if (!item) throw new Error("Commitment not found");
  const { data: ch } = await supabase.from("challenges").select("*").eq("id", item.challenge_id).single();
  if (!ch || ch.user_id !== user.id) throw new Error("Not your challenge");

  // Guard: date must be in the challenge window and not in the future.
  const today = todayIso();
  const endDate = (function () {
    const d = new Date(ch.start_date + "T00:00:00");
    d.setDate(d.getDate() + ch.length_days - 1);
    return d.toISOString().slice(0, 10);
  })();
  if (date < ch.start_date || date > endDate) throw new Error("Date is outside the challenge window.");
  if (date > today) throw new Error("Can't log entries for future dates.");

  const log = await upsertTodayLog(item.challenge_id, date);

  await supabase
    .from("daily_log_entries")
    .upsert(
      { daily_log_id: log.id, commitment_item_id: itemId, bool_value: value, numeric_value: null, updated_at: new Date().toISOString() },
      { onConflict: "daily_log_id,commitment_item_id" },
    );

  await recomputeAndPersistCompletion(log.id);
  revalidatePath("/");
}

export async function endChallenge(challengeId: string) {
  const { supabase, user } = await requireUser();
  const { data: ch } = await supabase.from("challenges").select("*").eq("id", challengeId).single();
  if (!ch || ch.user_id !== user.id) throw new Error("Not your challenge");
  await supabase.from("challenges").update({ status: "completed" }).eq("id", challengeId);
  revalidatePath("/");
}

export async function updateDisplayName(name: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  revalidatePath("/settings");
}

export async function setRemindersEnabled(enabled: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ reminders_enabled: enabled }).eq("id", user.id);
  revalidatePath("/settings");
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
}
