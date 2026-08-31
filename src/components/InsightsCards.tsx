import type { CommitmentConsistency } from "@/lib/insights";

export default function InsightsCards({
  completionRate,
  elapsed,
  totalDays,
  currentStreak,
  longestStreak,
  consistency,
}: {
  completionRate: number;
  elapsed: number;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  consistency: CommitmentConsistency[];
}) {
  const sorted = [...consistency].sort((a, b) => b.hitRate - a.hitRate);
  const most = sorted[0];
  const least = sorted[sorted.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Completion" value={`${Math.round(completionRate * 100)}%`} sub={`${Math.round(completionRate * elapsed)}/${elapsed} days`} />
        <Stat label="Progress" value={`${elapsed}/${totalDays}`} sub="days elapsed" />
        <Stat label="Current streak" value={String(currentStreak)} sub={currentStreak === 1 ? "day" : "days"} />
        <Stat label="Longest streak" value={String(longestStreak)} sub={longestStreak === 1 ? "day" : "days"} />
      </div>

      {most && least && most.item.id !== least.item.id && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted">Consistency</div>
          <div>
            <div className="text-sm text-muted">Most consistent</div>
            <div className="font-medium">{most.item.label}</div>
            <div className="text-xs text-muted">{Math.round(most.hitRate * 100)}% ({most.hits}/{most.totalDays})</div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="text-sm text-muted">Least consistent</div>
            <div className="font-medium">{least.item.label}</div>
            <div className="text-xs text-muted">{Math.round(least.hitRate * 100)}% ({least.hits}/{least.totalDays})</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted mb-2">Per commitment</div>
        {consistency.map((c) => (
          <div key={c.item.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span>{c.item.label}{c.item.optional && <span className="text-muted text-xs italic"> (opt)</span>}</span>
              <span className="text-muted">{Math.round(c.hitRate * 100)}%</span>
            </div>
            <div className="h-1.5 bg-surface2 rounded overflow-hidden mt-1">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.round(c.hitRate * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
