import type {
  DailyMetricSummary,
  MetricAnalytics,
  MetricUnit,
  SourceMetricValue,
} from "../../../src/domain/analytics";
import type { PipelineContext } from "../../context";
import { dateKeyInTimeZone } from "../../shared/dateKey";
import { buildMetricOverview } from "./buildMetricOverview";

interface PointObservation {
  id: string;
  source: string;
  observedAt: string;
}

export function aggregatePointMetric<T extends PointObservation>(
  observations: T[],
  unit: Extract<MetricUnit, "bpm" | "kg">,
  valueFor: (observation: T) => number,
  policy: "median" | "latest",
  context: PipelineContext,
): MetricAnalytics {
  const grouped = new Map<string, T[]>();
  for (const observation of observations) {
    const date = dateKeyInTimeZone(
      observation.observedAt,
      context.homeTimeZone,
    );
    const key = `${date}\u0000${observation.source}`;
    grouped.set(key, [...(grouped.get(key) ?? []), observation]);
  }

  const dailySources = new Map<
    string,
    Array<SourceMetricValue & { latestAt: number }>
  >();
  for (const [key, records] of grouped) {
    const [date, source] = key.split("\u0000");
    if (!date || !source) continue;
    const ordered = [...records].sort(
      (left, right) =>
        Date.parse(left.observedAt) - Date.parse(right.observedAt),
    );
    const values = ordered.map(valueFor).sort((left, right) => left - right);
    const value =
      policy === "latest" ? valueFor(ordered.at(-1)!) : median(values);
    const sources = dailySources.get(date) ?? [];
    sources.push({
      source,
      value,
      observationCount: records.length,
      coverageMinutes: null,
      latestAt: Date.parse(ordered.at(-1)!.observedAt),
    });
    dailySources.set(date, sources);
  }

  const daily: DailyMetricSummary[] = [...dailySources.entries()]
    .map(([date, sources]) => {
      const ranked = sources.sort(
        (left, right) =>
          right.observationCount - left.observationCount ||
          right.latestAt - left.latestAt,
      );
      const selected = ranked[0];
      if (!selected) throw new Error("Daily point metric has no source");
      return {
        date,
        value: selected.value,
        source: selected.source,
        bySource: ranked.map(({ latestAt: _, ...source }) => source),
        qualityFlags: [],
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return { unit, daily, overview: buildMetricOverview(daily) };
}

function median(values: number[]): number {
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[middle]!;
  return (values[middle - 1]! + values[middle]!) / 2;
}
