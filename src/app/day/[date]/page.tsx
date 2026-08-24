import { notFound } from "next/navigation";
import { DayView } from "~/components/day-view/DayView";
import {
  getDayAnalytics,
  getSyncStatus,
} from "~/server/health/getDayAnalytics";

/**
 * No `export const dynamic = "force-dynamic"` here (unlike the old
 * `getDayViewSnapshot`-backed version of this page): the underlying
 * `HealthConnectClient` requests are already `cache: "no-store"`, and
 * `getDayAnalytics()` layers its own two-tier in-memory cache on top
 * (`dayAnalyticsCache.ts`) — a short 30s TTL for an open/still-arriving
 * day, a long 6h TTL for a closed historical day. Forcing the whole route
 * dynamic would just duplicate that opt-out without changing behavior, so
 * this route is left to Next's default dynamic rendering for a param'd
 * segment with no `generateStaticParams`. The client-side `AutoRefresh`
 * component picks up newly-synced data for the open day by re-running this
 * server component on an interval (requirement #13); closed days rely
 * purely on the server-side cache's long TTL.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NEARBY_RADIUS = 7;

export default async function DayViewPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_PATTERN.test(date)) {
    notFound();
  }

  const response = await getDayAnalytics(date, NEARBY_RADIUS);

  // The sync-status heartbeat is small chrome, not core day data — fetch
  // it independently so a slow/erroring sync endpoint never blocks the day
  // itself from rendering.
  const syncStatus = await getSyncStatus().catch(() => null);

  return <DayView response={response} syncStatus={syncStatus} />;
}
