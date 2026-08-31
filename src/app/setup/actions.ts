"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CommitmentDraft, Tier } from "@/lib/types";

export interface CreateChallengeInput {
  tier: Tier;
  startDate: string; // yyyy-mm-dd
  lengthDays: number;
  restartOnMiss: boolean;
  commitments: CommitmentDraft[];
}

export async function createChallenge(input: CreateChallengeInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Guard: no other active challenge (also DB-enforced).
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (existing) throw new Error("You already have an active challenge.");

  if (input.commitments.length === 0) throw new Error("Add at least one commitment.");
  if (input.lengthDays < 1 || input.lengthDays > 365) throw new Error("Length must be 1–365 days.");

  const { data: challenge, error: chErr } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      tier: input.tier,
      start_date: input.startDate,
      length_days: input.lengthDays,
      status: "active",
      restart_on_miss: input.restartOnMiss,
    })
    .select("*")
    .single();
  if (chErr || !challenge) throw new Error(chErr?.message ?? "Failed to create challenge.");

  const itemsPayload = input.commitments.map((c, i) => ({
    challenge_id: challenge.id,
    label: c.label,
    type: c.type,
    target_value: c.type === "numeric" ? c.target_value : null,
    unit: c.unit,
    category: c.category,
    optional: c.optional,
    sort_order: i,
    active_weekdays: c.active_weekdays,
  }));
  const { error: itErr } = await supabase.from("commitment_items").insert(itemsPayload);
  if (itErr) throw new Error(itErr.message);

  revalidatePath("/");
  redirect("/");
}
