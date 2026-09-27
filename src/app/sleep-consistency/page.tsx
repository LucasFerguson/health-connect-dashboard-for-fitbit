import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { SleepConsistencyTrendView } from "~/components/sleep-consistency/SleepConsistencyTrendView";
import { isDateKey } from "~/domain/health";
import { getSleepConsistencyAnalytics } from "~/server/health/getSleepConsistencyAnalytics";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function SleepConsistencyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, result] = await Promise.all([
    searchParams,
    settle(getSleepConsistencyAnalytics()),
  ]);
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <SleepConsistencyTrendView
      analytics={result.data}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
