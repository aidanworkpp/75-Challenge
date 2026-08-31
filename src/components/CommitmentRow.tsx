"use client";

import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import type { CommitmentItem, DailyLogEntry } from "@/lib/types";
import { setBooleanEntry } from "@/app/actions";

// All rows are checkboxes. Optimistic UI — the tick flips
// immediately on click; server sync happens in the background.
// dateIso lets the row target a specific date (used by /log-yesterday).
export default function CommitmentRow({
  item,
  entry,
  dateIso,
}: {
  item: CommitmentItem;
  entry: DailyLogEntry | undefined;
  dateIso?: string;
}) {
  const serverHit = entry?.bool_value === true;
  const [hit, setHit] = useState(serverHit);
  const [, startTransition] = useTransition();

  useEffect(() => { setHit(serverHit); }, [serverHit]);

  function toggle() {
    const next = !hit;
    setHit(next); // instant visual response
    startTransition(async () => {
      try {
        await setBooleanEntry(item.id, next, dateIso);
      } catch {
        setHit(!next); // roll back on error
      }
    });
  }

  const descriptor = describeTarget(item);

  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        hit ? "bg-success/10 border-success/40" : "bg-surface border-border active:bg-surface2",
      )}
    >
      <span
        className={clsx(
          "w-7 h-7 rounded-md border-2 flex items-center justify-center text-base shrink-0",
          hit ? "bg-success border-success text-black" : "border-border",
        )}
      >
        {hit ? "✓" : ""}
      </span>
      <div className="flex-1">
        <div className="font-medium">{item.label}</div>
        {(descriptor || item.optional) && (
          <div className="text-xs text-muted">
            {descriptor}
            {descriptor && item.optional && " · "}
            {item.optional && "optional"}
          </div>
        )}
      </div>
    </button>
  );
}

function describeTarget(item: CommitmentItem): string {
  if (item.type === "numeric" && item.target_value != null) {
    const unit = item.unit ?? "";
    return `${item.target_value}${unit ? " " + unit : ""} minimum`;
  }
  return "";
}
