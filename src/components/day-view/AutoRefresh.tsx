"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the current route (re-running the server component, which
 * re-fetches through `getDayAnalytics()`) on an interval — but only while
 * `active` is true. The page passes `active={dayState !== "future"}` for
 * the day nearest "today" among the fetched days (see `DayView`'s
 * `newestRecordedDate`), matching step 1's own open/closed cache-tier
 * split (`dayAnalyticsCache.ts`'s `OPEN_DAY_TTL_MS` = 30s): a closed
 * historical day never mounts this poll, relying entirely on the
 * long-TTL server cache instead (requirement #13).
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
