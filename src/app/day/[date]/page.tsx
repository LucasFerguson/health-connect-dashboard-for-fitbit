import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { notFound } from "next/navigation";
import { DayView } from "~/components/day-view/DayView";
import { isDateKey } from "~/domain/health";
import { getDayView } from "~/server/health/getDayView";
import { settle } from "~/server/health/backendDiagnostics";

/**
 * No `export const dynamic = "force-dynamic"` here: the RSC Apollo client's
 * transport is `cache: "no-store"` (see `graphqlClient.ts`), which already
 * makes this param'd route render per request, so forcing it would duplicate
 * that opt-out without changing behavior. The client-side `AutoRefresh`
 * component picks up newly-synced data for the open day by re-running this
 * server component on an interval (requirement #13).
 */
export default async function DayViewPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isDateKey(date)) {
    notFound();
  }

  const result = await settle(getDayView(date));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return <DayView data={result.data} />;
}
