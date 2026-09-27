import { SleepConsistencyTrendView } from "~/components/sleep-consistency/SleepConsistencyTrendView";
import { isDateKey } from "~/domain/health";
import { getSleepConsistencyAnalytics } from "~/server/health/getSleepConsistencyAnalytics";

export const dynamic = "force-dynamic";

export default async function SleepConsistencyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, analytics] = await Promise.all([
    searchParams,
    getSleepConsistencyAnalytics(),
  ]);

  return (
    <SleepConsistencyTrendView
      analytics={analytics}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
