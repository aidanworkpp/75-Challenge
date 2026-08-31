"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, parseISO } from "date-fns";
import type { CommitmentItem, DailyLog, DailyLogEntry } from "@/lib/types";
import { isEntryHit, isItemActiveOn } from "@/lib/completion";
import { formatDayLong } from "@/lib/date";

export default function HistoryCalendar({
  challengeStart,
  challengeEnd,
  logs,
  items,
  entries,
}: {
  challengeStart: string;
  challengeEnd: string;
  logs: DailyLog[];
  items: CommitmentItem[];
  entries: DailyLogEntry[];
}) {
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(parseISO(challengeStart)));
  const [selected, setSelected] = useState<string | null>(null);

  const logByDate = useMemo(
    () => new Map(logs.map((l) => [l.log_date, l])),
    [logs],
  );

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const pad = getDay(start); // 0 = Sunday
    const cells: (Date | null)[] = Array(pad).fill(null);
    for (const d of eachDayOfInterval({ start, end })) cells.push(d);
    return cells;
  }, [monthCursor]);

  const selectedLog = selected ? logByDate.get(selected) : undefined;
  const selectedEntries = selectedLog ? entries.filter((e) => e.daily_log_id === selectedLog.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthCursor((m) => addMonths(m, -1))}
          className="px-3 py-1 rounded bg-surface border border-border"
        >
          ‹
        </button>
        <div className="font-semibold">{format(monthCursor, "LLLL yyyy")}</div>
        <button
          onClick={() => setMonthCursor((m) => addMonths(m, 1))}
          className="px-3 py-1 rounded bg-surface border border-border"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = format(d, "yyyy-MM-dd");
          const log = logByDate.get(iso);
          const inChallenge = iso >= challengeStart && iso <= challengeEnd;
          const status = !inChallenge
            ? "outside"
            : !log
            ? "empty"
            : log.complete
            ? "complete"
            : "partial";
          return (
            <button
              key={iso}
              onClick={() => setSelected(iso)}
              disabled={!inChallenge}
              className={clsx(
                "aspect-square rounded flex items-center justify-center text-sm border",
                !isSameMonth(d, monthCursor) && "opacity-40",
                status === "complete" && "bg-success/20 border-success/40 text-success",
                status === "partial" && "bg-danger/10 border-danger/30 text-danger",
                status === "empty" && "bg-surface border-border text-muted",
                status === "outside" && "bg-transparent border-transparent text-muted",
                selected === iso && "ring-2 ring-accent",
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{formatDayLong(selected)}</div>
            {selectedLog?.complete && (
              <span className="text-xs text-success font-medium">Complete</span>
            )}
          </div>
          {!selectedLog && (
            <div className="text-muted text-sm">No entries logged for this day.</div>
          )}
          {selectedLog && (
            <ul className="space-y-1 text-sm">
              {items
                .filter((item) => isItemActiveOn(item, selected))
                .map((item) => {
                  const entry = selectedEntries.find((e) => e.commitment_item_id === item.id);
                  const hit = isEntryHit(item, entry);
                  return (
                    <li key={item.id} className="flex items-center justify-between">
                      <span className={hit ? "" : "text-muted"}>
                        {hit ? "✓" : "·"} {item.label}
                        {item.optional && <span className="text-xs text-muted italic"> (optional)</span>}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3 text-xs text-muted">
        <Legend colour="bg-success/30" label="complete" />
        <Legend colour="bg-danger/20" label="partial/missed" />
        <Legend colour="bg-surface border border-border" label="not logged" />
      </div>
    </div>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={clsx("w-3 h-3 rounded", colour)} />
      <span>{label}</span>
    </div>
  );
}
