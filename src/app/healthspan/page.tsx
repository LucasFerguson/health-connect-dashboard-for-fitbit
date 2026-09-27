import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { HealthspanPage } from "~/components/healthspan/HealthspanPage";
import { getHealthspanAnalytics } from "~/server/health/getHealthspanAnalytics";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function HealthspanRoute() {
  const result = await settle(getHealthspanAnalytics());
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;
  return <HealthspanPage analytics={result.data} />;
}
