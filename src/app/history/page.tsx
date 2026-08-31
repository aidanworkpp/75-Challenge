import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import HistoryCalendar from "@/components/HistoryCalendar";
import Milestones from "@/components/Milestones";
import { challengeDayNumber, isoAddDays, todayIso } from "@/lib/date";
import { longestStreak } from "@/lib/streak";
import { evaluateAchievements } from "@/lib/achievements";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  const endDate = isoAddDays(challenge.start_date, challenge.length_days - 1);

  const dayNumber = Math.max(0, challengeDayNumber(challenge.start_date, todayIso()) ?? 0);
  const achievements = evaluateAchievements({
    dayNumber,
    longestStreak: longestStreak(logs),
    completeDays: logs.filter((l) => l.complete).length,
    restUsed: logs.filter((l) => l.rest_day).length,
    cheatUsed: logs.filter((l) => l.cheat_meal).length,
    lengthDays: challenge.length_days,
  });

  return (
    <AppShell title="History">
      <div className="space-y-6">
        <Milestones achievements={achievements} />
        <HistoryCalendar
          challengeStart={challenge.start_date}
          challengeEnd={endDate}
          logs={logs}
          items={items}
          entries={entries}
        />
      </div>
    </AppShell>
  );
}
