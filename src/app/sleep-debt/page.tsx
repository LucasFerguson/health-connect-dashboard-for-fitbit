import { MigratedPage } from "~/components/migration/MigratedPage";
import { SleepDebtTrendView } from "~/components/sleep-debt/SleepDebtTrendView";
import { getSleepDebtAnalytics } from "~/server/health/getSleepDebtAnalytics";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, page] = await Promise.all([
    searchParams,
    getSleepDebtAnalytics(),
  ]);

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  const analytics =
    page?.data ?? (await getHealthSnapshot()).analytics.sleepDebt;

  return (
    <MigratedPage run={page?.run ?? null} source="viewer.analytics.sleepDebt">
      <SleepDebtTrendView
        analytics={analytics}
        selectedDate={validDate(date) ? date : undefined}
      />
    </MigratedPage>
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
