import { MigratedPage } from "~/components/migration/MigratedPage";
import { SleepConsistencyTrendView } from "~/components/sleep-consistency/SleepConsistencyTrendView";
import { getSleepConsistencyAnalytics } from "~/server/health/getSleepConsistencyAnalytics";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepConsistencyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, page] = await Promise.all([
    searchParams,
    getSleepConsistencyAnalytics(),
  ]);

  const analytics =
    page?.data ?? (await getHealthSnapshot()).analytics.sleepConsistency;

  return (
    <MigratedPage
      run={page?.run ?? null}
      source="viewer.analytics.sleepConsistency"
    >
      <SleepConsistencyTrendView
        analytics={analytics}
        selectedDate={validDate(date) ? date : undefined}
      />
    </MigratedPage>
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
