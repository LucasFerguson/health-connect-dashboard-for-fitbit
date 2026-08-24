import { DataSourcesPage } from "~/components/data-sources/DataSourcesPage";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function DataSourcesRoute() {
  const snapshot = await getHealthSnapshot();
  return (
    <DataSourcesPage
      analytics={snapshot.analytics}
      usingFixture={snapshot.source === "fixture"}
    />
  );
}
