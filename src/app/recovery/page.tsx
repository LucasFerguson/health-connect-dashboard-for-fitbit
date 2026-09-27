import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { RecoveryView } from "~/components/recovery/RecoveryView";
import { getRecoveryAnalytics } from "~/server/health/getRecoveryAnalytics";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const result = await settle(getRecoveryAnalytics());
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;
  return <RecoveryView recovery={result.data} />;
}
