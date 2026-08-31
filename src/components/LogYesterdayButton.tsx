"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { appHourNow, yesterdayIso } from "@/lib/date";

// Only rendered before 12:00 SAST. Refreshes its own visibility every minute.
export default function LogYesterdayButton({
  challengeStart,
  challengeEnd,
}: {
  challengeStart: string;
  challengeEnd: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      const beforeNoon = appHourNow() < 12;
      const y = yesterdayIso();
      const yesterdayInWindow = y >= challengeStart && y <= challengeEnd;
      setVisible(beforeNoon && yesterdayInWindow);
    }
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [challengeStart, challengeEnd]);

  if (!visible) return null;

  return (
    <Link
      href="/log-yesterday"
      className="block w-full text-center rounded-md border border-border bg-surface2 text-text py-3 text-sm"
    >
      Forgot yesterday? Log it →
    </Link>
  );
}
