import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { DataSourcesPage } from "~/components/data-sources/DataSourcesPage";
import { getDataSourceStatus } from "~/server/health/getDataSourceStatus";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function DataSourcesRoute() {
  const result = await settle(getDataSourceStatus());
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;
  return <DataSourcesPage feedStatus={result.data} />;
}
