import type { DateKey, HealthSnapshot, SleepSession } from "~/domain/health";
import { dateKeyForSession, sleepMinutes } from "~/domain/sleep";

export interface SleepDaySummary {
  date: DateKey;
  sleepMinutes: number;
  sessionCount: number;
}

export function selectSleepSessionsForDate(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepSession[] {
  if (!date) return [];
  return snapshot.sleepSessions
    .filter((session) => dateKeyForSession(session) === date)
    .sort((a, b) => sleepMinutes(b) - sleepMinutes(a));
}

export function selectDefaultSleepSession(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepSession | null {
  return selectSleepSessionsForDate(snapshot, date)[0] ?? null;
}

export function selectSleepDays(
  snapshot: HealthSnapshot,
): Record<DateKey, SleepDaySummary> {
  return snapshot.sleepSessions.reduce<Record<DateKey, SleepDaySummary>>(
    (days, session) => {
      const date = dateKeyForSession(session);
      const existing = days[date];
      days[date] = {
        date,
        sleepMinutes: (existing?.sleepMinutes ?? 0) + sleepMinutes(session),
        sessionCount: (existing?.sessionCount ?? 0) + 1,
      };
      return days;
    },
    {},
  );
}
