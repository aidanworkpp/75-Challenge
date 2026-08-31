import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { getActiveChallengeBundle, getProfile } from "@/lib/queries";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const { challenge } = await getActiveChallengeBundle(user.id);

  return (
    <AppShell title="Settings">
      <SettingsForm
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        timezone={profile?.timezone ?? "UTC"}
        remindersEnabled={profile?.reminders_enabled ?? true}
        morningHour={profile?.reminder_hour_morning ?? 7}
        eveningHour={profile?.reminder_hour_evening ?? 20}
        activeChallengeId={challenge?.id ?? null}
      />
    </AppShell>
  );
}
