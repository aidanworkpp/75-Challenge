import Link from "next/link";
import AppShell from "@/components/AppShell";

const CARDS = [
  {
    href: "/motivation",
    title: "Motivation",
    blurb: "Pick a tone (Goggins / Coach / Stoic / Gentle) and get a short kick when you need one.",
    emoji: "⚡",
  },
  {
    href: "/coach/meals",
    title: "Meal plan",
    blurb: "Set your goal and restrictions. Generate a plan and refine it via chat. Export to PDF.",
    emoji: "🍽",
  },
  {
    href: "/coach/workouts",
    title: "Workout plan",
    blurb: "Say your goal, days, equipment, and experience. Generate a plan, refine it, export.",
    emoji: "💪",
  },
];

export default function CoachHubPage() {
  return (
    <AppShell title="Coach">
      <div className="space-y-3">
        <p className="text-muted text-sm">
          AI-generated support. Written in the style of experienced specialists — not medical advice.
        </p>
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">{c.emoji}</div>
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-muted mt-1">{c.blurb}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
