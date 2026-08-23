import { SleepDebtTrendView } from "~/components/sleep-debt/SleepDebtTrendView";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, snapshot] = await Promise.all([
    searchParams,
    getHealthSnapshot(),
  ]);
  return (
    <SleepDebtTrendView
      analytics={snapshot.analytics.sleepDebt}
      selectedDate={validDate(date) ? date : undefined}
    />
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
