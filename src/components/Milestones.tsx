import clsx from "clsx";
import type { EvaluatedAchievement } from "@/lib/achievements";

export default function Milestones({ achievements }: { achievements: EvaluatedAchievement[] }) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <span className="text-xs text-muted">{unlockedCount} / {achievements.length} unlocked</span>
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {achievements.map((a) => (
          <li
            key={a.id}
            className={clsx(
              "rounded-lg border p-3",
              a.isUnlocked ? "border-accent/50 bg-accent/10" : "border-border bg-surface",
            )}
          >
            <div className="flex items-center gap-2">
              <span className={clsx("text-xl leading-none", !a.isUnlocked && "grayscale opacity-40")}>
                {a.isUnlocked ? a.emoji : "🔒"}
              </span>
              <span className={clsx("font-semibold text-sm", a.isUnlocked ? "text-text" : "text-muted")}>
                {a.title}
              </span>
            </div>
            <p className={clsx("mt-2 text-xs", a.isUnlocked ? "text-muted italic" : "text-muted")}>
              {a.isUnlocked ? a.line : a.hint}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
