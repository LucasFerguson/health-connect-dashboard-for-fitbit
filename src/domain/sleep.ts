/**
 * Display-time sleep duration for a single `SleepSession`. The analytics
 * totals (daily sleep, debt, consistency) come prepared from HCGateway; this
 * only labels individual sessions and recordings in the UI.
 *
 * Sessions from the overview snapshot arrive with `stages: []` (see
 * `overviewAdapter.ts`), so there this is the session's wall-clock span, awake
 * time included. Only sessions fetched with their stages exclude awake time.
 */
import type { SleepSession, SleepStageKind } from "./health";

function minutesBetween(startAt: string, endAt: string): number {
  return Math.max(0, (Date.parse(endAt) - Date.parse(startAt)) / 60_000);
}

function isSleepingStage(kind: SleepStageKind): boolean {
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
