import { isDateKey } from "~/domain/health";
import type { MetricKind } from "~/features/health/metricPresentation";
import {
  getMetricSeries,
  selectMetricSeries,
} from "~/server/health/getMetricSeries";
import { MetricDetailPage } from "./MetricDetailPage";

/** Shared body of /steps, /calories, /resting-heart-rate and /weight. */
export async function HealthMetricPage({
  kind,
  selectedDate,
}: {
  kind: MetricKind;
  selectedDate?: string;
}) {
  const series = await getMetricSeries();

  return (
    <MetricDetailPage
      kind={kind}
      analytics={selectMetricSeries(kind, series)}
      // Calories charts active against total energy.
      secondaryAnalytics={
        kind === "calories" ? series.totalCalories : undefined
      }
      selectedDate={isDateKey(selectedDate) ? selectedDate : undefined}
    />
  );
}
