import type {
  DailyMetricSummary,
  MetricOverview,
} from "../../../src/domain/analytics";

export function buildMetricOverview(
  daily: DailyMetricSummary[],
): MetricOverview {
  const ordered = [...daily].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const latest = ordered.at(-1) ?? null;
  const previous = ordered.at(-2) ?? null;
  return {
    latest,
    previous,
    average7Day: average(ordered.slice(-7).map((item) => item.value)),
    average30Day: average(ordered.slice(-30).map((item) => item.value)),
    changeFromPrevious:
      latest && previous ? latest.value - previous.value : null,
    sampleCount: ordered.length,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
