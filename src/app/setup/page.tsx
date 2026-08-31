import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import ChallengeSetupWizard from "@/components/ChallengeSetupWizard";

export default async function SetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: active } = await supabase
    .from("challenges")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (active) redirect("/");

  return (
    <AppShell title="Set up your challenge" hideNav>
      <ChallengeSetupWizard />
    </AppShell>
  );
}
