"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { settleYesterday } from "@/app/actions";
import { appHourNow } from "@/lib/date";

// Server render always leaves yesterday in the grace window.
// Once SAST passes 13:00, this component fires the settlement
// (which may fail the challenge if yesterday's required items weren't hit).
export default function YesterdaySettler({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (appHourNow() < 13) return;
      try {
        await settleYesterday(challengeId);
        if (!cancelled) router.refresh();
      } catch {
        /* ignore */
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [challengeId, router]);
  return null;
}
