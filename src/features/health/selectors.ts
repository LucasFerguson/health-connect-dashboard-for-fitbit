import type { DateKey, HealthSnapshot, SleepSession } from "~/domain/health";
import { dateKeyForSession, sleepMinutes } from "~/domain/sleep";

export interface SleepDaySummary {
  date: DateKey;
  sleepMinutes: number;
  sessionCount: number;
  recordingCount: number;
}

export interface SleepEvent {
  id: string;
  date: DateKey;
  primary: SleepSession;
  recordings: SleepSession[];
}

export interface DeviceSleepSummary {
  source: string;
  recordingCount: number;
  averageSleepMinutes: number;
  comparisonCount: number;
  averageDifferenceMinutes: number | null;
}

const SAME_EVENT_OVERLAP_RATIO = 0.8;

function sessionDuration(session: SleepSession): number {
  return Math.max(0, Date.parse(session.endAt) - Date.parse(session.startAt));
}

function overlapRatio(left: SleepSession, right: SleepSession): number {
  const overlap = Math.max(
    0,
    Math.min(Date.parse(left.endAt), Date.parse(right.endAt)) -
      Math.max(Date.parse(left.startAt), Date.parse(right.startAt)),
  );
  const shorter = Math.min(sessionDuration(left), sessionDuration(right));
  return shorter === 0 ? 0 : overlap / shorter;
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
  return (
    selectSleepEventsForDate(snapshot, date)
      .map((event) => event.primary)
      .sort(
        (left, right) => sessionDuration(right) - sessionDuration(left),
      )[0] ?? null
  );
}

export function selectSleepEventsForDate(
  snapshot: HealthSnapshot,
  date: DateKey | null,
): SleepEvent[] {
  const sessions = selectSleepSessionsForDate(snapshot, date);
  if (!date) return [];

  const parent = sessions.map((_, index) => index);
  const find = (index: number): number =>
    parent[index] === index
      ? index
      : (parent[index] = find(parent[index] ?? index));
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  sessions.forEach((left, leftIndex) => {
    sessions.slice(leftIndex + 1).forEach((right, offset) => {
      if (overlapRatio(left, right) >= SAME_EVENT_OVERLAP_RATIO) {
        union(leftIndex, leftIndex + offset + 1);
      }
    });
  });

  const groups = new Map<number, SleepSession[]>();
  sessions.forEach((session, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), session]);
  });

  return [...groups.values()]
    .map((recordings) => {
      const ranked = recordings.sort(
        (left, right) => sessionDuration(right) - sessionDuration(left),
      );
      const primary = ranked[0];
      if (!primary) throw new Error("Sleep event has no recordings");
      return { id: primary.id, date, primary, recordings: ranked };
    })
    .sort(
      (left, right) =>
        Date.parse(left.primary.startAt) - Date.parse(right.primary.startAt),
    );
}

export function selectSleepDays(
  snapshot: HealthSnapshot,
): Record<DateKey, SleepDaySummary> {
  const dates = new Set(snapshot.sleepSessions.map(dateKeyForSession));
  return [...dates].reduce<Record<DateKey, SleepDaySummary>>((days, date) => {
    const events = selectSleepEventsForDate(snapshot, date);
    days[date] = {
      date,
      sleepMinutes: events.reduce(
        (total, event) => total + sleepMinutes(event.primary),
        0,
      ),
      sessionCount: events.length,
      recordingCount: events.reduce(
        (total, event) => total + event.recordings.length,
        0,
      ),
    };
    return days;
  }, {});
}

export function selectDeviceSleepSummaries(
  snapshot: HealthSnapshot,
): DeviceSleepSummary[] {
  const dates = new Set(snapshot.sleepSessions.map(dateKeyForSession));
  const events = [...dates].flatMap((date) =>
    selectSleepEventsForDate(snapshot, date),
  );
  const observations = new Map<
    string,
    { durations: number[]; pairedDifferences: number[] }
  >();

  for (const event of events) {
    const sourceRepresentatives = new Map<string, SleepSession>();
    for (const recording of event.recordings) {
      const existing = sourceRepresentatives.get(recording.source);
      if (!existing || sleepMinutes(recording) > sleepMinutes(existing)) {
        sourceRepresentatives.set(recording.source, recording);
      }
    }

    const sourceDurations = [...sourceRepresentatives.entries()].map(
      ([source, recording]) => ({ source, minutes: sleepMinutes(recording) }),
    );

    for (const { source, minutes } of sourceDurations) {
      const summary = observations.get(source) ?? {
        durations: [],
        pairedDifferences: [],
      };
      summary.durations.push(minutes);
      const peers = sourceDurations.filter((item) => item.source !== source);
      if (peers.length > 0) {
        summary.pairedDifferences.push(
          minutes - average(peers.map((item) => item.minutes)),
        );
      }
      observations.set(source, summary);
    }
  }

  return [...observations.entries()]
    .map(([source, observation]) => ({
      source,
      recordingCount: observation.durations.length,
      averageSleepMinutes: average(observation.durations),
      comparisonCount: observation.pairedDifferences.length,
      averageDifferenceMinutes:
        observation.pairedDifferences.length > 0
          ? average(observation.pairedDifferences)
          : null,
    }))
    .sort(
      (left, right) => right.averageSleepMinutes - left.averageSleepMinutes,
    );
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
