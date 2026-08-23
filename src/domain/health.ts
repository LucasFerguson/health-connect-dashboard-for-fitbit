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

export interface IntervalObservation {
  id: string;
  source: string;
  startAt: ISODateTime;
  endAt: ISODateTime;
}

export interface StepsObservation extends IntervalObservation {
  count: number;
}

export interface EnergyObservation extends IntervalObservation {
  energyKcal: number;
}

export interface RestingHeartRateObservation {
  id: string;
  source: string;
  observedAt: ISODateTime;
  bpm: number;
}

export interface WeightObservation {
  id: string;
  source: string;
  observedAt: ISODateTime;
  kilograms: number;
}

export interface RawHealthData {
  sleepSessions: SleepSession[];
  steps: StepsObservation[];
  activeCalories: EnergyObservation[];
  totalCalories: EnergyObservation[];
  restingHeartRates: RestingHeartRateObservation[];
  weights: WeightObservation[];
}

export interface HealthSnapshot {
  generatedAt: ISODateTime;
  source: "health-connect" | "fixture";
  sleepSessions: SleepSession[];
  analytics: HealthAnalytics;
}
import type { HealthAnalytics } from "./analytics";
