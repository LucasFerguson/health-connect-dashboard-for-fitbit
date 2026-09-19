import { DashboardLoadingShell } from "~/components/dashboard/DashboardLoadingShell";

/**
 * Gives client-side navigation to the dynamic overview an immediately
 * prefetchable state. The page also owns a matching Suspense boundary for a
 * direct request, where the shell is streamed before health data is ready.
 */
export default function OverviewLoading() {
  return <DashboardLoadingShell />;
}
