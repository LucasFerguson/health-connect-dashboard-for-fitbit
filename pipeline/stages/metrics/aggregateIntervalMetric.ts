import type {
  DailyMetricSummary,
  MetricAnalytics,
  MetricUnit,
  SourceMetricValue,
} from "../../../src/domain/analytics";
import type { IntervalObservation } from "../../../src/domain/health";
import type { PipelineContext } from "../../context";
import { dateKeyInTimeZone } from "../../shared/dateKey";
import { buildMetricAnalytics } from "./buildMetricOverview";

interface SourceAccumulator {
  value: number;
  observationIds: Set<string>;
  intervals: Array<[number, number]>;
  qualityFlags: Set<string>;
}

export function aggregateIntervalMetric<T extends IntervalObservation>(
  observations: T[],
  unit: Extract<MetricUnit, "steps" | "kcal">,
  valueFor: (observation: T) => number,
  context: PipelineContext,
): MetricAnalytics {
  const byDayAndSource = new Map<string, SourceAccumulator>();

  for (const observation of observations) {
    const start = Date.parse(observation.startAt);
    const end = Date.parse(observation.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
      continue;
    const duration = end - start;
    for (const segment of splitByLocalDay(start, end, context.homeTimeZone)) {
      const key = `${segment.date}\u0000${observation.source}`;
      const value = valueFor(observation) * (segment.durationMs / duration);
      const accumulator = byDayAndSource.get(key) ?? {
        value: 0,
        observationIds: new Set<string>(),
        intervals: [],
        qualityFlags: new Set<string>(),
      };
      accumulator.value += value;
      accumulator.observationIds.add(observation.id);
      accumulator.intervals.push([segment.startAt, segment.endAt]);
      if (duration > 26 * 60 * 60 * 1000) {
        accumulator.qualityFlags.add("long_interval");
      }
      byDayAndSource.set(key, accumulator);
    }
  }

  const dailySources = new Map<
    string,
    Array<SourceMetricValue & { qualityFlags: string[] }>
  >();
  for (const [key, accumulator] of byDayAndSource) {
    const [date, source] = key.split("\u0000");
    if (!date || !source) continue;
    const values = dailySources.get(date) ?? [];
    values.push({
      source,
      value:
        unit === "steps" ? Math.round(accumulator.value) : accumulator.value,
      observationCount: accumulator.observationIds.size,
      coverageMinutes: unionDuration(accumulator.intervals) / 60_000,
      qualityFlags: [...accumulator.qualityFlags],
    });
    dailySources.set(date, values);
  }

  const daily: DailyMetricSummary[] = [...dailySources.entries()]
    .map(([date, sources]) => {
      const ranked = sources.sort(
        (left, right) =>
          (right.coverageMinutes ?? 0) - (left.coverageMinutes ?? 0) ||
          right.observationCount - left.observationCount,
      );
      const selected = ranked[0];
      if (!selected) throw new Error("Daily interval metric has no source");
      return {
        date,
        value: selected.value,
        source: selected.source,
        bySource: ranked.map(({ qualityFlags: _, ...source }) => source),
        qualityFlags: selected.qualityFlags,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return buildMetricAnalytics(unit, daily);
}

function splitByLocalDay(start: number, end: number, timeZone: string) {
  const segments: Array<{
    date: string;
    durationMs: number;
    startAt: number;
    endAt: number;
  }> = [];
  let cursor = start;
  while (cursor < end) {
    const date = dateKeyInTimeZone(cursor, timeZone);
    const lastInstant = Math.max(cursor, end - 1);
    let boundary = end;
    if (dateKeyInTimeZone(lastInstant, timeZone) !== date) {
      let low = cursor + 1;
      let high = end;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (dateKeyInTimeZone(middle, timeZone) === date) low = middle + 1;
        else high = middle;
      }
      boundary = low;
    }
    segments.push({
      date,
      durationMs: boundary - cursor,
      startAt: cursor,
      endAt: boundary,
    });
    cursor = boundary;
  }
  return segments;
}

function unionDuration(intervals: Array<[number, number]>): number {
  const ordered = [...intervals].sort((left, right) => left[0] - right[0]);
  let total = 0;
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  for (const [start, end] of ordered) {
    if (currentStart === null || currentEnd === null) {
      currentStart = start;
      currentEnd = end;
    } else if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      total += currentEnd - currentStart;
      currentStart = start;
      currentEnd = end;
    }
  }
  return currentStart === null || currentEnd === null
    ? total
    : total + currentEnd - currentStart;
}
