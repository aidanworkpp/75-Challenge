import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import LogYesterdayScreen from "./LogYesterdayScreen";
import { isoAddDays, yesterdayIso } from "@/lib/date";

export default async function LogYesterdayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items, logs, entries } = await getActiveChallengeBundle(user.id);
  if (!challenge) redirect("/setup");

  const yIso = yesterdayIso();
  const endDate = isoAddDays(challenge.start_date, challenge.length_days - 1);
  const yesterdayInWindow = yIso >= challenge.start_date && yIso <= endDate;

  const yesterdayLog = logs.find((l) => l.log_date === yIso);
  const yesterdayEntries = yesterdayLog
    ? entries.filter((e) => e.daily_log_id === yesterdayLog.id)
    : [];

  return (
    <AppShell title="Log yesterday">
      <LogYesterdayScreen
        items={items}
        entries={yesterdayEntries}
        yesterdayIso={yIso}
        inWindow={yesterdayInWindow}
      />
    </AppShell>
  );
}
