"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/app/actions";

// Runs once per session on the client — if the profile's stored timezone
// is default/empty, this pushes the browser's IANA timezone up. Cheap no-op if same.
export default function TimezoneSync({ currentTimezone }: { currentTimezone: string }) {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      if (tz === currentTimezone) return;
      // Only auto-update if the stored value is the default 'UTC' — never overwrite an explicit choice.
      if (currentTimezone !== "UTC") return;
      void syncTimezone(tz);
    } catch {
      /* ignore */
    }
  }, [currentTimezone]);
  return null;
}
