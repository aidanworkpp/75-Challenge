import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import CommitmentRow from "@/components/CommitmentRow";
import StreakBadge from "@/components/StreakBadge";
import { challengeDayNumber, formatDayLong, todayIso } from "@/lib/date";
import { currentStreak } from "@/lib/streak";
import { reconcileChallengeState } from "@/lib/challenge-state";
import type { DailyLog } from "@/lib/types";

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  // Refresh challenge status if past-end or restart-on-miss triggered
  await reconcileChallengeState(challenge.id, user.id);
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

        <ul className="space-y-2">
          {items.map((item) => {
            const entry = todaysEntries.find((e) => e.commitment_item_id === item.id);
            return (
              <li key={item.id}>
                <CommitmentRow item={item} entry={entry} />
              </li>
            );
          })}
        </ul>

        <DayStatus complete={dayComplete} log={todaysLog} items={items.length} />
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
