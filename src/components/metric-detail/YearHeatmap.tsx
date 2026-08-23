"use client";

import type { DailyMetricSummary } from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import { metricPresentation } from "~/features/health/metricPresentation";
import { CalendarHeatmap } from "../heatmap/CalendarHeatmap";

export function YearHeatmap({
  data,
  kind,
  initialDate,
}: {
  data: DailyMetricSummary[];
  kind: MetricKind;
  initialDate?: string;
}) {
  const presentation = metricPresentation(kind);
  return (
    <CalendarHeatmap
      data={data}
      label={presentation.title}
      color={presentation.color}
      formatValue={presentation.formatValue}
      initialDate={initialDate}
    />
  );
}
