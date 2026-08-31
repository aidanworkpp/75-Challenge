"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDayCompleteFor } from "@/lib/completion";
import { todayIso } from "@/lib/date";
import type { CommitmentDraft, CommitmentItem, DailyLogEntry } from "@/lib/types";

export interface EditableCommitment extends CommitmentDraft {
  id?: string; // present = existing row to update; absent = new row to insert
}

export interface UpdateChallengeInput {
  challengeId: string;
  restDaysPerWeek: number;
  cheatMealsPerWeek: number;
  commitments: EditableCommitment[];
}

export async function updateActiveChallenge(input: UpdateChallengeInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: ch } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", input.challengeId)
    .single();
  if (!ch || ch.user_id !== user.id) throw new Error("Not your challenge");
  if (ch.status !== "active") throw new Error("You can only edit an active challenge.");

  if (input.commitments.length === 0) throw new Error("Keep at least one commitment.");
  for (const c of input.commitments) {
    if (c.type === "numeric" && (c.target_value == null || c.target_value <= 0)) {
      throw new Error(`"${c.label}" needs a target above 0.`);
    }
  }

  // Update allowances (forward-looking, always safe).
  await supabase
    .from("challenges")
    .update({
      rest_days_per_week: Math.min(7, Math.max(0, Math.round(input.restDaysPerWeek))),
      cheat_meals_per_week: Math.min(7, Math.max(0, Math.round(input.cheatMealsPerWeek))),
    })
    .eq("id", ch.id);

  // Diff commitment_items by id.
  const { data: existingRows } = await supabase
    .from("commitment_items")
    .select("id")
    .eq("challenge_id", ch.id);
  const existingIds = new Set((existingRows ?? []).map((r) => r.id as string));
  const keptIds = new Set(input.commitments.filter((c) => c.id).map((c) => c.id as string));

  // Delete removed items (cascades their daily_log_entries).
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("commitment_items").delete().in("id", toDelete);
  }

  // Update existing, insert new — assign sort_order by position.
  for (let i = 0; i < input.commitments.length; i++) {
    const c = input.commitments[i];
    const row = {
      challenge_id: ch.id,
      label: c.label,
      type: c.type,
      target_value: c.type === "numeric" ? c.target_value : null,
      unit: c.type === "numeric" ? c.unit : null,
      category: c.category,
      optional: c.optional,
      active_weekdays: c.active_weekdays,
      sort_order: i,
    };
    if (c.id && existingIds.has(c.id)) {
      await supabase.from("commitment_items").update(row).eq("id", c.id);
    } else {
      await supabase.from("commitment_items").insert(row);
    }
  }

  // Recompute today's completion against the new rule set (history is left as-is).
  const today = todayIso();
  const { data: log } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("challenge_id", ch.id)
    .eq("log_date", today)
    .maybeSingle();
  if (log) {
    const [{ data: items }, { data: entries }] = await Promise.all([
      supabase.from("commitment_items").select("*").eq("challenge_id", ch.id),
      supabase.from("daily_log_entries").select("*").eq("daily_log_id", log.id),
    ]);
    const complete = isDayCompleteFor(
      (items ?? []) as CommitmentItem[],
      (entries ?? []) as DailyLogEntry[],
      today,
      { restDay: log.rest_day === true, cheatMeal: log.cheat_meal === true },
    );
    await supabase
      .from("daily_logs")
      .update({ complete, updated_at: new Date().toISOString() })
      .eq("id", log.id);
  }

  revalidatePath("/");
  revalidatePath("/edit-challenge");
  redirect("/settings");
}
