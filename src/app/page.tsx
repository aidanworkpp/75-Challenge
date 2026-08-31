import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import CommitmentRow from "@/components/CommitmentRow";
import StreakBadge from "@/components/StreakBadge";
import { challengeDayNumber, formatDayLong, isoAddDays, todayIso } from "@/lib/date";
import { currentStreak } from "@/lib/streak";
import { reconcileChallengeState } from "@/lib/challenge-state";
import { isItemActiveOn, isItemExcused } from "@/lib/completion";
import { allowanceStatusForWeek } from "@/lib/allowances";
import LogYesterdayButton from "@/components/LogYesterdayButton";
import YesterdaySettler from "@/components/YesterdaySettler";
import RestCheatControls from "@/components/RestCheatControls";
import type { DailyLog } from "@/lib/types";

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  // Server-side reconcile always leaves yesterday in the grace window.
  // <YesterdaySettler> triggers the yesterday check only after local 13:00.
  await reconcileChallengeState(challenge.id, user.id, { includeYesterday: false });
  const refreshed = await getActiveChallengeBundle(user.id);
  if (!refreshed.challenge) {
    return (
      <AppShell title="Challenge ended">
        <ChallengeEndedCard />
      </AppShell>
    );
  }

  const today = todayIso();
  const todaysLog = logs.find((l) => l.log_date === today);
  const todaysEntries = todaysLog
    ? entries.filter((e) => e.daily_log_id === todaysLog.id)
    : [];

  // Only show items active today (e.g. photo scheduled for Sundays hides on other days)
  const activeItems = items.filter((i) => isItemActiveOn(i, today));

  const restActive = todaysLog?.rest_day ?? false;
  const cheatActive = todaysLog?.cheat_meal ?? false;
  const allowance = allowanceStatusForWeek(challenge, logs, today);

  const dayNum = challengeDayNumber(challenge.start_date, today);
  const streak = currentStreak(logs);
  const dayComplete = todaysLog?.complete ?? false;
  const preStart = dayNum === null;

  return (
    <AppShell title={formatDayLong(today)}>
      <div className="space-y-4">
        <StreakBadge streak={streak} dayNumber={dayNum} totalDays={challenge.length_days} />

        {preStart && (
          <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
            Your challenge starts on {formatDayLong(challenge.start_date)}. Come back then.
          </div>
        )}

        {!preStart && (
          <RestCheatControls
            challengeId={challenge.id}
            restBudget={challenge.rest_days_per_week}
            cheatBudget={challenge.cheat_meals_per_week}
            restRemaining={allowance.restRemaining}
            cheatRemaining={allowance.cheatRemaining}
            restActive={restActive}
            cheatActive={cheatActive}
          />
        )}

        <ul className="space-y-2">
          {activeItems.map((item) => {
            const entry = todaysEntries.find((e) => e.commitment_item_id === item.id);
            const excused = isItemExcused(item, { restDay: restActive, cheatMeal: cheatActive });
            return (
              <li key={item.id}>
                <CommitmentRow item={item} entry={entry} excused={excused} />
              </li>
            );
          })}
        </ul>

        <DayStatus complete={dayComplete} log={todaysLog} items={activeItems.length} />

        <LogYesterdayButton
          challengeStart={challenge.start_date}
          challengeEnd={isoAddDays(challenge.start_date, challenge.length_days - 1)}
        />

        <YesterdaySettler challengeId={challenge.id} />
      </div>
    </AppShell>
  );
}

function DayStatus({ complete, log, items }: { complete: boolean; log: DailyLog | undefined; items: number }) {
  if (!log) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-center text-muted">
        No commitments logged yet today.
      </div>
    );
  }
  if (complete) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-center">
        <div className="font-semibold text-success">Day complete</div>
        <div className="text-xs text-muted mt-1">All {items} required commitments hit.</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-center text-muted">
      Day in progress — keep going.
    </div>
  );
}

function ChallengeEndedCard() {
  return (
    <div className="space-y-4">
      <p className="text-muted">Your challenge has ended (completed, failed, or reset).</p>
      <Link
        href="/setup"
        className="block text-center rounded-md bg-accent text-black font-semibold py-3"
      >
        Start a new challenge
      </Link>
    </div>
  );
}
