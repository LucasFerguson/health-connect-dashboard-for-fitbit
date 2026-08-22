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
