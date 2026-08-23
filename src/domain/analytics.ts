import type { DateKey, ISODateTime, SleepSession } from "./health";

export interface SleepEvent {
  id: string;
  date: DateKey;
  primary: SleepSession;
  recordings: SleepSession[];
}

export interface DailySleepSummary {
  date: DateKey;
  sleepMinutes: number;
  eventCount: number;
  recordingCount: number;
}

export interface DeviceSleepSummary {
  source: string;
  recordingCount: number;
  averageSleepMinutes: number;
  comparisonCount: number;
  averageDifferenceMinutes: number | null;
}

export type MetricUnit = "steps" | "kcal" | "bpm" | "kg";

export interface SourceMetricValue {
  source: string;
  value: number;
  observationCount: number;
  coverageMinutes: number | null;
}

export interface DailyMetricSummary {
  date: DateKey;
  value: number;
  source: string;
  bySource: SourceMetricValue[];
  qualityFlags: string[];
}

export interface MetricOverview {
  latest: DailyMetricSummary | null;
  previous: DailyMetricSummary | null;
  average7Day: number | null;
  average30Day: number | null;
  changeFromPrevious: number | null;
  sampleCount: number;
}

export interface MetricTrendPoint {
  date: DateKey;
  value: number;
  sampleCount: number;
}

export interface MonthlyMetricSummary {
  month: string;
  value: number;
  sampleCount: number;
}

export interface MetricAnalytics {
  unit: MetricUnit;
  daily: DailyMetricSummary[];
  overview: MetricOverview;
  rolling7Day: MetricTrendPoint[];
  monthly: MonthlyMetricSummary[];
}

export interface HealthAnalytics {
  algorithmVersion: string;
  sourceFingerprint: string;
  processedAt: ISODateTime;
  sleepEvents: SleepEvent[];
  dailySleep: DailySleepSummary[];
  deviceSleep: DeviceSleepSummary[];
  steps: MetricAnalytics;
  activeCalories: MetricAnalytics;
  totalCalories: MetricAnalytics;
  restingHeartRate: MetricAnalytics;
  weight: MetricAnalytics;
}
