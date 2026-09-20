import { Suspense } from "react";
import { Dashboard } from "~/components/Dashboard";
import { DashboardLoadingShell } from "~/components/dashboard/DashboardLoadingShell";
import { MigratedPage } from "~/components/migration/MigratedPage";
import { getOverviewSnapshot } from "~/server/health/getOverviewSnapshot";
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
  const page = await getOverviewSnapshot();

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  const snapshot = page?.data ?? (await getHealthSnapshot());

  return (
    <MigratedPage run={page?.run ?? null} source="viewer.analytics">
      <Dashboard snapshot={snapshot} />
    </MigratedPage>
  );
}
