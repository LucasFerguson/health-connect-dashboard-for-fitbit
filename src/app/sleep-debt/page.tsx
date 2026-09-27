import { SleepDebtTrendView } from "~/components/sleep-debt/SleepDebtTrendView";
import { isDateKey } from "~/domain/health";
import { getSleepDebtAnalytics } from "~/server/health/getSleepDebtAnalytics";

export const dynamic = "force-dynamic";

export default async function SleepDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, analytics] = await Promise.all([
    searchParams,
    getSleepDebtAnalytics(),
  ]);

  return (
    <SleepDebtTrendView
      analytics={analytics}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
