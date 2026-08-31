import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveChallengeBundle } from "@/lib/queries";
import AppShell from "@/components/AppShell";
import { CATEGORY_CONTEXT, CLASSIC_75_HARD } from "@/lib/rules-content";

export default async function RulesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { challenge, items } = await getActiveChallengeBundle(user.id);

  return (
    <AppShell title="The rules">
      <div className="space-y-6">
        {challenge && items.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your commitments — why they matter</h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="font-medium">{item.label}</div>
                  {item.type === "numeric" && (
                    <div className="text-xs text-muted mt-0.5">
                      Target {item.target_value}{item.unit ? ` ${item.unit}` : ""} · {item.category}
                    </div>
                  )}
                  <p className="text-sm text-muted mt-2">
                    {CATEGORY_CONTEXT[item.category] ?? CATEGORY_CONTEXT.custom}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Classic 75 Hard</h2>
          <p className="text-muted text-sm">
            The original programme this app is modelled on. Medium and Soft tiers deliberately relax parts of this —
            here&apos;s what they&apos;re relaxing.
          </p>
          <ul className="space-y-3">
            {CLASSIC_75_HARD.map((r) => (
              <li key={r.title} className="rounded-lg border border-border bg-surface p-3">
                <div className="font-medium">{r.title}</div>
                <p className="text-sm text-muted mt-1">{r.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
