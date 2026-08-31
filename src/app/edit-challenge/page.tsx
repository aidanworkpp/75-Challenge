import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import EditChallengeForm from "./EditChallengeForm";

export default async function EditChallengePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  return (
    <AppShell title="Edit challenge" hideNav>
      <EditChallengeForm
        challengeId={challenge.id}
        restDaysPerWeek={challenge.rest_days_per_week}
        cheatMealsPerWeek={challenge.cheat_meals_per_week}
        items={items}
      />
    </AppShell>
  );
}
