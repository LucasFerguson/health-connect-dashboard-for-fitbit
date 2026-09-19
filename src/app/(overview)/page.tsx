import { Suspense } from "react";
import { Dashboard } from "~/components/Dashboard";
import { DashboardLoadingShell } from "~/components/dashboard/DashboardLoadingShell";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

/**
 * Keep the route itself synchronous so Next can send the navigation and the
 * complete dashboard frame immediately. Only the data-dependent subtree
 * suspends; React streams it into the existing shell when the snapshot is
 * ready.
 */
export default function HomePage() {
  return (
    <Suspense fallback={<DashboardLoadingShell />}>
      <LoadedDashboard />
    </Suspense>
  );
}

async function LoadedDashboard() {
  const snapshot = await getHealthSnapshot();
  return <Dashboard snapshot={snapshot} />;
}
