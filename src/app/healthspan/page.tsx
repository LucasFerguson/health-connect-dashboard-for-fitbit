import { MigratedPage } from "~/components/migration/MigratedPage";
import { HealthspanPage } from "~/components/healthspan/HealthspanPage";
import { getHealthspanAnalytics } from "~/server/health/getHealthspanAnalytics";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function HealthspanRoute() {
  const page = await getHealthspanAnalytics();

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  const analytics =
    page?.data ?? (await getHealthSnapshot()).analytics.healthspan;

  return (
    <MigratedPage run={page?.run ?? null} source="viewer.analytics.healthspan">
      <HealthspanPage analytics={analytics} />
    </MigratedPage>
  );
}
