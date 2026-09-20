import { MigratedPage } from "~/components/migration/MigratedPage";
import { SleepQuantityView } from "~/components/sleep-quantity/SleepQuantityView";
import { getDailySleep } from "~/server/health/getDailySleep";
import type { DailySleepPageData } from "~/server/health/getDailySleep";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepQuantityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, page] = await Promise.all([searchParams, getDailySleep()]);

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  let data: DailySleepPageData;
  if (page) {
    data = page.data;
  } else {
    const { analytics } = await getHealthSnapshot();
    data = {
      daily: analytics.dailySleep,
      targetMinutes: analytics.sleepDebt.targetMinutes,
    };
  }

  return (
    <MigratedPage
      run={page?.run ?? null}
      source="viewer.analytics.days.headlineScores.sleepDuration"
    >
      <SleepQuantityView
        daily={data.daily}
        targetMinutes={data.targetMinutes}
        selectedDate={validDate(date) ? date : undefined}
      />
    </MigratedPage>
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
