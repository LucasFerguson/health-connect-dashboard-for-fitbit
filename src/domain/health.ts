export type ISODateTime = string;
export type DateKey = string;

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

export interface HealthSnapshot {
  generatedAt: ISODateTime;
  source: "health-connect" | "fixture";
  sleepSessions: SleepSession[];
}
