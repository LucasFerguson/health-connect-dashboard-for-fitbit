import type { DateKey, SleepSession, StepsObservation } from "./health";
import {
  axisStartMs,
  dateKeyOf,
  minutesToPercentWidth,
  timeToPercent,
} from "./dayViewTime";

/** A single positioned segment in the sleep-stage lane (step-chart style):
 * horizontal position/width as a percentage of the 24h axis, and the
 * stage's vertical band. */
export interface SleepStageSegment {
  kind: "awake" | "rem" | "light" | "deep";
  leftPercent: number;
  widthPercent: number;
  /** True for segments belonging to a nap (a session that isn't the
   * primary overnight sleep session for the date) — rendered dimmer. */
  isNap: boolean;
}

const RENDERED_STAGE_KINDS = new Set(["awake", "rem", "light", "deep"]);

/**
 * Builds the sleep-stage lane segments for `date`, from every sleep session
 * that overlaps the 24h axis window. Segments are clipped to the axis and
 * positioned with the shared time-axis math so they align with the other
 * lanes and overlays.
 */
export function buildSleepStageSegments(
  sessions: SleepSession[],
  date: DateKey,
  dayStartHour: number,
  timeZone: string,
): SleepStageSegment[] {
  const start = axisStartMs(date, dayStartHour, timeZone);
  const end = start + 24 * 60 * 60 * 1000;

  // The primary session is the one with the most total overlap with this
  // axis window; any other overlapping session is treated as a nap.
  const overlapping = sessions
    .map((session) => ({
      session,
      overlapMs:
        Math.min(Date.parse(session.endAt), end) -
        Math.max(Date.parse(session.startAt), start),
    }))
    .filter((entry) => entry.overlapMs > 0);

  if (overlapping.length === 0) return [];

  const primaryId = overlapping.reduce((best, entry) =>
    entry.overlapMs > best.overlapMs ? entry : best,
  ).session.id;

  const segments: SleepStageSegment[] = [];
  for (const { session } of overlapping) {
    const isNap = session.id !== primaryId;
    for (const stage of session.stages) {
      if (!RENDERED_STAGE_KINDS.has(stage.kind)) continue;
      const stageStart = Date.parse(stage.startAt);
      const stageEnd = Date.parse(stage.endAt);
      if (stageEnd <= start || stageStart >= end) continue;

      const clippedStartIso = new Date(
        Math.max(stageStart, start),
      ).toISOString();
      const clippedEndMs = Math.min(stageEnd, end);
      const leftPercent = timeToPercent(
        clippedStartIso,
        date,
        dayStartHour,
        timeZone,
      );
      const widthPercent = minutesToPercentWidth(
        (clippedEndMs - Math.max(stageStart, start)) / 60_000,
      );
      if (widthPercent <= 0) continue;

      segments.push({
        kind: stage.kind as SleepStageSegment["kind"],
        leftPercent,
        widthPercent,
        isNap,
      });
    }
  }

  return segments.sort((a, b) => a.leftPercent - b.leftPercent);
}

/** Total minutes spent in each stage across all sessions overlapping the
 * calendar date (used for the SLEEP pillar card footer/bar — this counts
 * the whole session regardless of axis pivot, matching "the night that
 * ended on this date" framing from the data-questions doc). */
export function stageMinutesByKind(
  sessions: SleepSession[],
): Record<"deep" | "rem" | "light" | "awake", number> {
  const totals = { deep: 0, rem: 0, light: 0, awake: 0 };
  for (const session of sessions) {
    for (const stage of session.stages) {
      if (stage.kind in totals) {
        const minutes =
          (Date.parse(stage.endAt) - Date.parse(stage.startAt)) / 60_000;
        totals[stage.kind as keyof typeof totals] += Math.max(0, minutes);
      }
    }
  }
  return totals;
}

/** One hourly bucket of step counts, for the movement lane. */
export interface HourlySteps {
  hourStartIso: string;
  steps: number;
  /** True if any part of this hour is in the future relative to `now`. */
  isFuture: boolean;
}

/**
 * Buckets raw steps interval observations into the 24 hourly slots of the
 * axis. An observation spanning multiple hours has its count split
 * proportionally by overlap duration (Health Connect steps records are
 * short intervals in practice, so this is usually an exact single-bucket
 * assignment, but the split keeps the math honest for longer intervals).
 */
export function bucketStepsByHour(
  steps: StepsObservation[],
  date: DateKey,
  dayStartHour: number,
  now: Date,
  timeZone: string,
): HourlySteps[] {
  const start = axisStartMs(date, dayStartHour, timeZone);
  const buckets: HourlySteps[] = Array.from({ length: 24 }, (_, hour) => {
    const hourStart = start + hour * 60 * 60 * 1000;
    return {
      hourStartIso: new Date(hourStart).toISOString(),
      steps: 0,
      isFuture: hourStart >= now.getTime(),
    };
  });

  for (const observation of steps) {
    const obsStart = Date.parse(observation.startAt);
    const obsEnd = Date.parse(observation.endAt);
    const durationMs = obsEnd - obsStart;
    if (durationMs <= 0) continue;

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = start + hour * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;
      const overlapMs =
        Math.min(obsEnd, hourEnd) - Math.max(obsStart, hourStart);
      if (overlapMs <= 0) continue;
      const bucket = buckets[hour];
      if (!bucket) continue;
      bucket.steps += observation.count * (overlapMs / durationMs);
    }
  }

  for (const bucket of buckets) {
    bucket.steps = Math.round(bucket.steps);
  }

  return buckets;
}

/** Re-exported for convenience so consumers only need one import for the
 * date-key convention used across the day view. */
export { dateKeyOf };
