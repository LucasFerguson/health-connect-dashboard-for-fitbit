"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the current route (re-running the server component, which
 * re-fetches through `getDayView()`) on an interval — but only while
 * `active` is true. The page passes `active={dayState !== "future"}` for
 * the day nearest "today" among the fetched days (see `DayView`'s
 * `newestRecordedDate`): only the open day can gain new data as the phone
 * uploads, so a closed historical day never mounts this poll
 * (requirement #13).
 */
export function AutoRefresh({
  active,
  intervalMs = 30_000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
