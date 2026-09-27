import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { SleepDebtTrendView } from "~/components/sleep-debt/SleepDebtTrendView";
import { isDateKey } from "~/domain/health";
import { getSleepDebtAnalytics } from "~/server/health/getSleepDebtAnalytics";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function SleepDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, result] = await Promise.all([
    searchParams,
    settle(getSleepDebtAnalytics()),
  ]);
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <SleepDebtTrendView
      analytics={result.data}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
