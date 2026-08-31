"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import type { CommitmentItem, DailyLogEntry } from "@/lib/types";
import { isEntryHit } from "@/lib/completion";
import { setBooleanEntry, setNumericEntry } from "@/app/actions";

export default function CommitmentRow({
  item,
  entry,
}: {
  item: CommitmentItem;
  entry: DailyLogEntry | undefined;
}) {
  const [pending, startTransition] = useTransition();
  const hit = isEntryHit(item, entry);

  if (item.type === "boolean") {
    return (
      <button
        onClick={() =>
          startTransition(async () => {
            await setBooleanEntry(item.id, !hit);
          })
        }
        disabled={pending}
        className={clsx(
          "w-full flex items-center gap-3 rounded-lg border p-3 text-left",
          hit ? "bg-success/10 border-success/40" : "bg-surface border-border",
        )}
      >
        <span
          className={clsx(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm shrink-0",
            hit ? "bg-success border-success text-black" : "border-border",
          )}
        >
          {hit ? "✓" : ""}
        </span>
        <div className="flex-1">
          <div className="font-medium">{item.label}</div>
          {item.optional && <div className="text-xs text-muted">optional</div>}
        </div>
      </button>
    );
  }

  return <NumericRow item={item} entry={entry} pending={pending} startTransition={startTransition} />;
}

function NumericRow({
  item,
  entry,
  pending,
  startTransition,
}: {
  item: CommitmentItem;
  entry: DailyLogEntry | undefined;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [value, setValue] = useState<string>(
    entry?.numeric_value != null ? String(entry.numeric_value) : "",
  );
  const target = item.target_value ?? 0;
  const numericValue = Number(value || 0);
  const hit = !!value && numericValue >= target;

  function save(v: string) {
    setValue(v);
    const num = Number(v || 0);
    startTransition(async () => {
      await setNumericEntry(item.id, num);
    });
  }

  return (
    <div
      className={clsx(
        "rounded-lg border p-3",
        hit ? "bg-success/10 border-success/40" : "bg-surface border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm shrink-0",
            hit ? "bg-success border-success text-black" : "border-border",
          )}
        >
          {hit ? "✓" : ""}
        </span>
        <div className="flex-1">
          <div className="font-medium">{item.label}</div>
          <div className="text-xs text-muted">
            Target: {target}{item.unit ? ` ${item.unit}` : ""}
            {item.optional && <span> · optional</span>}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => save(e.target.value)}
          disabled={pending}
          className="flex-1 bg-surface2 border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="0"
        />
        <span className="text-sm text-muted min-w-[3rem] text-right">
          / {target}{item.unit ? ` ${item.unit}` : ""}
        </span>
      </div>
    </div>
  );
}
