"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CommitmentRow from "@/components/CommitmentRow";
import type { CommitmentItem, DailyLogEntry } from "@/lib/types";
import { isItemActiveOn } from "@/lib/completion";
import { formatDayLong } from "@/lib/date";

// Client-side 12:00 cutoff. Server also validates the date is in-window
// and not in the future, so this is the UX gate — not the source of truth.
export default function LogYesterdayScreen({
  items,
  entries,
  yesterdayIso,
  inWindow,
}: {
  items: CommitmentItem[];
  entries: DailyLogEntry[];
  yesterdayIso: string;
  inWindow: boolean;
}) {
  const [expired, setExpired] = useState<boolean | null>(null);

  useEffect(() => {
    function check() {
      setExpired(new Date().getHours() >= 12);
    }
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  if (expired === null) {
    return <div className="text-muted text-sm">Loading…</div>;
  }

  if (!inWindow) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Yesterday is outside your challenge window — nothing to log.
        </div>
        <Link href="/" className="block text-center rounded-md bg-accent text-black font-semibold py-3">
          Back to today
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4">
          <div className="font-semibold text-danger">Too late</div>
          <div className="text-sm text-muted mt-1">
            Log-yesterday closes at 12:00 local time. You&apos;ll need to catch up on today&apos;s items instead.
          </div>
        </div>
        <Link href="/" className="block text-center rounded-md bg-accent text-black font-semibold py-3">
          Back to today
        </Link>
      </div>
    );
  }

  const activeItems = items.filter((i) => isItemActiveOn(i, yesterdayIso));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-3 text-sm">
        <div className="font-medium">{formatDayLong(yesterdayIso)}</div>
        <div className="text-muted text-xs mt-1">
          Backfilling entries for yesterday. Closes at 12:00 local time.
        </div>
      </div>

      {activeItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-muted text-sm">
          No commitments were scheduled for that weekday.
        </div>
      ) : (
        <ul className="space-y-2">
          {activeItems.map((item) => {
            const entry = entries.find((e) => e.commitment_item_id === item.id);
            return (
              <li key={item.id}>
                <CommitmentRow item={item} entry={entry} dateIso={yesterdayIso} />
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/" className="block text-center rounded-md border border-border bg-surface py-3 text-sm">
        Done — back to today
      </Link>
    </div>
  );
}
