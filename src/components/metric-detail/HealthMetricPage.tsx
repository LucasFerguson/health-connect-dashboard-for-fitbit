import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { isDateKey } from "~/domain/health";
import type { MetricKind } from "~/features/health/metricPresentation";
import { getMetricSeries } from "~/server/health/getMetricSeries";
import { MetricDetailPage } from "./MetricDetailPage";
import { settle } from "~/server/health/backendDiagnostics";

/** Shared body of /steps, /calories, /resting-heart-rate and /weight. */
export async function HealthMetricPage({
  kind,
  selectedDate,
}: {
  kind: MetricKind;
  selectedDate?: string;
}) {
  const result = await settle(getMetricSeries(kind));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <MetricDetailPage
      kind={kind}
      analytics={result.data.primary}
      // Only /calories has one: it charts active against total energy.
      secondaryAnalytics={result.data.secondary}
      selectedDate={isDateKey(selectedDate) ? selectedDate : undefined}
    />
  );
}
