export default function StreakBadge({
  streak,
  dayNumber,
  totalDays,
}: {
  streak: number;
  dayNumber: number | null;
  totalDays: number;
}) {
  return (
    <div className="rounded-lg bg-surface border border-border p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted">Streak</div>
        <div className="text-3xl font-bold">
          {streak} <span className="text-base font-normal text-muted">day{streak === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-wider text-muted">Day</div>
        <div className="text-3xl font-bold">
          {dayNumber ?? "—"} <span className="text-base font-normal text-muted">/ {totalDays}</span>
        </div>
      </div>
    </div>
  );
}
