import { DataSourcesPage } from "~/components/data-sources/DataSourcesPage";
import { getDataSourceStatus } from "~/server/health/getDataSourceStatus";

export const dynamic = "force-dynamic";

export default async function DataSourcesRoute() {
  return <DataSourcesPage feedStatus={await getDataSourceStatus()} />;
}
