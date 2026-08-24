/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
import type {
  DailyMetricSummary,
  MetricAnalytics,
  MetricOverview,
  MetricUnit,
  MonthlyMetricSummary,
} from "../../../src/domain/analytics";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function buildMetricAnalytics(
  unit: MetricUnit,
  daily: DailyMetricSummary[],
): MetricAnalytics {
  const ordered = [...daily].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  return {
    unit,
    daily: ordered,
    overview: buildMetricOverview(ordered),
    rolling7Day: ordered.map((day, index) => {
      const earliest = Date.parse(`${day.date}T00:00:00Z`) - 6 * DAY_IN_MS;
      const window = ordered
        .slice(0, index + 1)
        .filter(
          (candidate) => Date.parse(`${candidate.date}T00:00:00Z`) >= earliest,
        );
      return {
        date: day.date,
        value: average(window.map((item) => item.value)) ?? day.value,
        sampleCount: window.length,
      };
    }),
    monthly: buildMonthlySummaries(ordered),
  };
}

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

function buildMonthlySummaries(
  daily: DailyMetricSummary[],
): MonthlyMetricSummary[] {
  const groups = new Map<string, number[]>();
  for (const day of daily) {
    const month = day.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), day.value]);
  }
  return [...groups.entries()].map(([month, values]) => ({
    month,
    value: average(values) ?? 0,
    sampleCount: values.length,
  }));
}
