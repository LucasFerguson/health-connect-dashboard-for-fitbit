import type { HealthAnalytics } from "./analytics";

export type ISODateTime = string;
/** A calendar day, `YYYY-MM-DD`. */
export type DateKey = string;

/** Narrows untrusted input (a search param, a route segment) to a `DateKey`. */
export function isDateKey(value: string | null | undefined): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export type SleepStageKind =
  | "awake"
  | "light"
  | "deep"
  | "rem"
  | "asleep"
  | "unknown";

export interface SleepStage {
  startAt: ISODateTime;
  endAt: ISODateTime;
  kind: SleepStageKind;
}

export interface SleepSession {
  id: string;
  source: string;
  startAt: ISODateTime;
  endAt: ISODateTime;
  title: string | null;
  notes: string | null;
  stages: SleepStage[];
}

/**
 * Everything the overview dashboard renders, as one value: built from the
 * overview GraphQL query by `adaptOverview` and held client-side by
 * `HealthDataProvider`, which polls for fresh copies.
 */
export interface HealthSnapshot {
  generatedAt: ISODateTime;
  sleepSessions: SleepSession[];
  analytics: HealthAnalytics;
}
