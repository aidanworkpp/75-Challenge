"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { setDayFlag } from "@/app/actions";

export default function RestCheatControls({
  challengeId,
  restBudget,
  cheatBudget,
  restRemaining,
  cheatRemaining,
  restActive,
  cheatActive,
}: {
  challengeId: string;
  restBudget: number;
  cheatBudget: number;
  restRemaining: number;
  cheatRemaining: number;
  restActive: boolean;
  cheatActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (restBudget <= 0 && cheatBudget <= 0) return null;

  function toggle(kind: "rest" | "cheat", next: boolean) {
    startTransition(async () => {
      try {
        await setDayFlag(challengeId, kind, next);
        router.refresh();
      } catch {
        /* surfaced via disabled state; a failed toggle just no-ops */
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted">Allowances this week</div>
      <div className="grid grid-cols-2 gap-2">
        {restBudget > 0 && (
          <Toggle
            label="Rest day"
            sub={restActive ? "on — workouts excused" : `${restRemaining} of ${restBudget} left`}
            active={restActive}
            disabled={pending || (!restActive && restRemaining <= 0)}
            onClick={() => toggle("rest", !restActive)}
          />
        )}
        {cheatBudget > 0 && (
          <Toggle
            label="Cheat meal"
            sub={cheatActive ? "on — diet excused" : `${cheatRemaining} of ${cheatBudget} left`}
            active={cheatActive}
            disabled={pending || (!cheatActive && cheatRemaining <= 0)}
            onClick={() => toggle("cheat", !cheatActive)}
          />
        )}
      </div>
    </div>
  );
}

function Toggle({
  label, sub, active, disabled, onClick,
}: {
  label: string; sub: string; active: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-md border p-3 text-left transition-colors disabled:opacity-50",
        active ? "bg-accent/15 border-accent" : "bg-surface2 border-border",
      )}
    >
      <div className={clsx("font-medium text-sm", active && "text-accent")}>{label}</div>
      <div className="text-xs text-muted mt-0.5">{sub}</div>
    </button>
  );
}
