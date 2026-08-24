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
import type { DateKey, SleepSession, SleepStageKind } from "./health";

export function dateKeyForSession(session: SleepSession): DateKey {
  return session.startAt.slice(0, 10);
}

export function minutesBetween(startAt: string, endAt: string): number {
  return Math.max(0, (Date.parse(endAt) - Date.parse(startAt)) / 60_000);
}

export function isSleepingStage(kind: SleepStageKind): boolean {
  return kind !== "awake" && kind !== "unknown";
}

export function sleepMinutes(session: SleepSession): number {
  if (session.stages.length === 0) {
    return minutesBetween(session.startAt, session.endAt);
  }

  return session.stages.reduce(
    (total, stage) =>
      total +
      (isSleepingStage(stage.kind)
        ? minutesBetween(stage.startAt, stage.endAt)
        : 0),
    0,
  );
}
