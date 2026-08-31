import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import InsightsCards from "@/components/InsightsCards";
import { currentStreak, longestStreak } from "@/lib/streak";
import { completionRate, elapsedDays, perCommitmentConsistency } from "@/lib/insights";

export default async function InsightsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  const elapsed = elapsedDays(challenge.start_date, challenge.length_days);
  const rate = completionRate(logs, elapsed);
  const cur = currentStreak(logs);
  const lng = longestStreak(logs);
  const consistency = perCommitmentConsistency(items, logs, entries, challenge.start_date, elapsed);
  const restUsed = logs.filter((l) => l.rest_day).length;
  const cheatUsed = logs.filter((l) => l.cheat_meal).length;
  const hasAllowances = challenge.rest_days_per_week > 0 || challenge.cheat_meals_per_week > 0;

  return (
    <AppShell title="Insights">
      {elapsed === 0 ? (
        <p className="text-muted">Stats appear once your challenge starts.</p>
      ) : (
        <InsightsCards
          completionRate={rate}
          elapsed={elapsed}
          totalDays={challenge.length_days}
          currentStreak={cur}
          longestStreak={lng}
          consistency={consistency}
          restUsed={restUsed}
          cheatUsed={cheatUsed}
          showAllowances={hasAllowances}
        />
      )}
    </AppShell>
  );
}
