import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { notFound } from "next/navigation";
import { DayView } from "~/components/day-view/DayView";
import { isDateKey } from "~/domain/health";
import { getDayAnalytics } from "~/server/health/getDayAnalytics";
import { settle } from "~/server/health/backendDiagnostics";

/**
 * No `export const dynamic = "force-dynamic"` here: the underlying
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

const NEARBY_RADIUS = 7;

export default async function DayViewPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isDateKey(date)) {
    notFound();
  }

  const result = await settle(getDayAnalytics(date, NEARBY_RADIUS));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return <DayView response={result.data} />;
}
