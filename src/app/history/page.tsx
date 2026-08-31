import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import HistoryCalendar from "@/components/HistoryCalendar";
import { isoAddDays } from "@/lib/date";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  const endDate = isoAddDays(challenge.start_date, challenge.length_days - 1);

  return (
    <AppShell title="History">
      <HistoryCalendar
        challengeStart={challenge.start_date}
        challengeEnd={endDate}
        logs={logs}
        items={items}
        entries={entries}
      />
    </AppShell>
  );
}
