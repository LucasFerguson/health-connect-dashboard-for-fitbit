import { MigrationNotice } from "~/components/migration/MigrationNotice";
import { SleepDebtTrendView } from "~/components/sleep-debt/SleepDebtTrendView";
import { getSleepDebtAnalytics } from "~/server/health/getSleepDebtAnalytics";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, graphqlData] = await Promise.all([
    searchParams,
    getSleepDebtAnalytics(),
  ]);

  // Falls back to the legacy pipeline when the GraphQL API isn't configured
  // (e.g. the fixture/demo dev container), so the page still renders and the
  // notice reports which path actually served it.
  const analytics =
    graphqlData?.analytics ?? (await getHealthSnapshot()).analytics.sleepDebt;

  return (
    <>
      <MigrationNotice
        path={graphqlData ? "graphql" : "legacy-pipeline"}
        note={
          graphqlData
            ? `Reads viewer.analytics.sleepDebt from HCGateway GraphQL · run ${graphqlData.run?.algorithmVersion ?? "unknown"}`
            : "GraphQL API not configured here, so this fell back to the in-repo pipeline."
        }
      />
      <SleepDebtTrendView
        analytics={analytics}
        selectedDate={validDate(date) ? date : undefined}
      />
    </>
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
