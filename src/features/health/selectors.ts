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
import type { DeviceSleepSummary, SleepEvent } from "~/domain/analytics";
import type { DateKey, HealthSnapshot, SleepSession } from "~/domain/health";

export interface SleepDaySummary {
  date: DateKey;
  sleepMinutes: number;
  sessionCount: number;
  recordingCount: number;
}

export function selectSleepSessionsForDate(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepSession[] {
  return selectSleepEventsForDate(snapshot, date).flatMap(
    (event) => event.recordings,
  );
}

export function selectSleepEventsForDate(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepEvent[] {
  if (!date) return [];
  return snapshot.analytics.sleepEvents.filter((event) => event.date === date);
}

export function selectDefaultSleepSession(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepSession | null {
  return (
    selectSleepEventsForDate(snapshot, date)
      .map((event) => event.primary)
      .sort(
        (left, right) =>
          Date.parse(right.endAt) -
          Date.parse(right.startAt) -
          (Date.parse(left.endAt) - Date.parse(left.startAt)),
      )[0] ?? null
  );
}

export function selectSleepDays(
  snapshot: HealthSnapshot,
): Record<DateKey, SleepDaySummary> {
  return snapshot.analytics.dailySleep.reduce<Record<DateKey, SleepDaySummary>>(
    (days, summary) => {
      days[summary.date] = {
        date: summary.date,
        sleepMinutes: summary.sleepMinutes,
        sessionCount: summary.eventCount,
        recordingCount: summary.recordingCount,
      };
      return days;
    },
    {},
  );
}

export function selectDeviceSleepSummaries(
  snapshot: HealthSnapshot,
): DeviceSleepSummary[] {
  return snapshot.analytics.deviceSleep;
}
