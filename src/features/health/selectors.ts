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
