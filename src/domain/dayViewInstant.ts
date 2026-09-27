import type { HealthDay, SleepStageSegment } from "./dayView";
import type { SleepStageKind } from "./health";
import { axisStartMs, hourLabelForSlot } from "./dayViewTime";

/**
 * Cross-lane lookup for the timeline's hover readout: what every lane says
 * at one instant. Pure and React-free so it can be unit tested with
 * synthetic days.
 *
 * Every field is `null` when its lane has nothing at that instant (no
 * segment covering it, an hour whose status isn't `available`, a missing
 * aggregate). Missing is never turned into a zero; a `0` step count only
 * comes back when the backend actually reported 0 for an available hour.
 */

export interface HeartRateAtInstant {
  /** Clock hour (0-23) the aggregate covers. */
  hour: number;
  mean: number | null;
  min: number | null;
  max: number | null;
}

export interface StepsAtInstant {
  hour: number;
  count: number;
}

export interface InstantValues {
  /** Stage covering the instant. `unknown` segments are treated as no data. */
  sleepStage: Exclude<SleepStageKind, "unknown"> | null;
  heartRate: HeartRateAtInstant | null;
  steps: StepsAtInstant | null;
  /** Label of a workout in progress at the instant. */
  workout: string | null;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Values at `instantMs` for `day`'s timeline, whose axis starts at
 * `dayStartHour` in `day.timeZone`. Hourly lanes (heart rate, steps) are
 * matched by the axis slot the instant falls in, the same slot->hour mapping
 * the lanes use to draw them, so the readout always describes the bar under
 * the cursor. Instants outside the 24-hour axis get all-null values.
 */
export function valuesAtInstant(
  day: Pick<HealthDay, "date" | "timeZone" | "timeline">,
  instantMs: number,
  dayStartHour = 0,
): InstantValues {
  const empty: InstantValues = {
    sleepStage: null,
    heartRate: null,
    steps: null,
    workout: null,
  };
  const start = axisStartMs(day.date, dayStartHour, day.timeZone);
  const slot = Math.floor((instantMs - start) / HOUR_MS);
  if (!Number.isFinite(slot) || slot < 0 || slot >= 24) return empty;
  const hour = hourLabelForSlot(slot, dayStartHour);

  return {
    sleepStage: stageAt(day.timeline.sleepStages, instantMs),
    heartRate: heartRateAt(day, hour),
    steps: stepsAt(day, hour),
    workout: workoutAt(day, instantMs),
  };
}

function covers(startAt: string, endAt: string, instantMs: number): boolean {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  return startMs <= instantMs && instantMs < endMs;
}

function stageAt(
  segments: SleepStageSegment[],
  instantMs: number,
): InstantValues["sleepStage"] {
  // A later-listed segment wins on overlap, matching the lane's paint order
  // for equal start times.
  let found: InstantValues["sleepStage"] = null;
  for (const segment of segments) {
    if (segment.kind === "unknown") continue;
    if (covers(segment.startAt, segment.endAt, instantMs)) found = segment.kind;
  }
  return found;
}

function heartRateAt(
  day: Pick<HealthDay, "timeline">,
  hour: number,
): HeartRateAtInstant | null {
  const entry = day.timeline.heartRate.hours.find((h) => h.hour === hour);
  if (!entry || entry.status !== "available") return null;
  const { mean, min, max } = entry;
  if (mean === null && min === null && max === null) return null;
  return { hour, mean, min, max };
}

function stepsAt(
  day: Pick<HealthDay, "timeline">,
  hour: number,
): StepsAtInstant | null {
  const entry = day.timeline.steps.find((h) => h.hour === hour);
  if (!entry || entry.status !== "available") return null;
  return { hour, count: entry.count };
}

function workoutAt(
  day: Pick<HealthDay, "timeline">,
  instantMs: number,
): string | null {
  const workout = day.timeline.workouts?.find((w) =>
    covers(w.startAt, w.endAt, instantMs),
  );
  return workout ? workout.label : null;
}
