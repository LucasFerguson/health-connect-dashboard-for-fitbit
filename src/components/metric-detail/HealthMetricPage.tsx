import type { MetricAnalytics } from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";
import { MetricDetailPage } from "./MetricDetailPage";

export async function HealthMetricPage({
  kind,
  selectedDate,
}: {
  kind: MetricKind;
  selectedDate?: string;
}) {
  const snapshot = await getHealthSnapshot();
  const analytics = selectAnalytics(kind, snapshot.analytics);
  return (
    <MetricDetailPage
      kind={kind}
      analytics={analytics}
      secondaryAnalytics={
        kind === "calories" ? snapshot.analytics.totalCalories : undefined
      }
      selectedDate={validDate(selectedDate) ? selectedDate : undefined}
    />
  );
}

function selectAnalytics(
  kind: MetricKind,
  analytics: Awaited<ReturnType<typeof getHealthSnapshot>>["analytics"],
): MetricAnalytics {
  switch (kind) {
    case "steps":
      return analytics.steps;
    case "calories":
      return analytics.activeCalories;
    case "heart-rate":
      return analytics.restingHeartRate;
    case "weight":
      return analytics.weight;
  }
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
