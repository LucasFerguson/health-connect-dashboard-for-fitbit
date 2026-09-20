import { DataSourcesPage } from "~/components/data-sources/DataSourcesPage";
import { MigratedPage } from "~/components/migration/MigratedPage";
import { getDataSourceStatus } from "~/server/health/getDataSourceStatus";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";
import type { FeedPresence } from "~/server/health/getDataSourceStatus";

export const dynamic = "force-dynamic";

export default async function DataSourcesRoute() {
  const page = await getDataSourceStatus();

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  let feedStatus: FeedPresence;
  let usingFixture = false;
  if (page) {
    feedStatus = page.data;
  } else {
    const snapshot = await getHealthSnapshot();
    const { analytics } = snapshot;
    usingFixture = snapshot.source === "fixture";
    feedStatus = {
      sleep: analytics.dailySleep.length > 0,
      steps: analytics.steps.daily.length > 0,
      activeCalories: analytics.activeCalories.daily.length > 0,
      totalCalories: analytics.totalCalories.daily.length > 0,
      restingHeartRate: analytics.restingHeartRate.daily.length > 0,
      weight: analytics.weight.daily.length > 0,
    };
  }

  return (
    <MigratedPage
      run={page?.run ?? null}
      source="viewer.analytics (feed counts)"
    >
      <DataSourcesPage feedStatus={feedStatus} usingFixture={usingFixture} />
    </MigratedPage>
  );
}
