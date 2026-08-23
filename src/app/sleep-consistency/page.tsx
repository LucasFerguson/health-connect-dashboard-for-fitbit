import { SleepConsistencyTrendView } from "~/components/sleep-consistency/SleepConsistencyTrendView";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepConsistencyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, snapshot] = await Promise.all([
    searchParams,
    getHealthSnapshot(),
  ]);
  return (
    <SleepConsistencyTrendView
      analytics={snapshot.analytics.sleepConsistency}
      selectedDate={validDate(date) ? date : undefined}
    />
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
