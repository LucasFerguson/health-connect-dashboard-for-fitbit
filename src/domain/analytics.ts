/**
 * The UI's view-model types for prepared analytics. HCGateway computes every
 * value; the adapters in `src/server/health/adapters/` and the `get*` readers
 * map its GraphQL responses onto these shapes, and components render them.
 *
 * These are hand-maintained rather than generated because they are the
 * components' contract, not the wire's: they rename schema enums, narrow
 * `String!` fields like units to closed unions, drop records the UI can't
 * label, and let one component render the output of several queries. Don't
 * add health-data computation on top of them — if a page needs a number the
 * API doesn't provide, it belongs in HCGateway.
 */
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

export type SleepDebtCategory = "none" | "low" | "moderate" | "high";

export interface DailySleepDebt {
  date: DateKey;
  sleepMinutes: number;
  targetMinutes: number;
  debtMinutes: number;
  surplusMinutes: number;
  category: SleepDebtCategory;
  rolling7DayAverageMinutes: number;
  rolling7DayTotalMinutes: number;
  rolling30DayAverageMinutes: number;
}

export interface SleepDebtBreakdown {
  recordedDays: number;
  none: number;
  low: number;
  moderate: number;
  high: number;
}

export interface SleepDebtAnalytics {
  targetMinutes: number;
  methodology: string;
  daily: DailySleepDebt[];
  latest: DailySleepDebt | null;
  average7DayMinutes: number | null;
  average30DayMinutes: number | null;
  previous30DayAverageMinutes: number | null;
  breakdown30Day: SleepDebtBreakdown;
}

export type SleepConsistencyCategory = "optimal" | "sufficient" | "poor";

export interface DailySleepConsistency {
  date: DateKey;
  source: string;
  bedtimeAt: ISODateTime;
  wakeAt: ISODateTime;
  bedtimeMinutesLocal: number;
  wakeMinutesLocal: number;
  baselineBedtimeMinutesLocal: number | null;
  baselineWakeMinutesLocal: number | null;
  bedtimeDeviationMinutes: number | null;
  wakeDeviationMinutes: number | null;
  baselineNightCount: number;
  score: number | null;
  category: SleepConsistencyCategory | null;
  rolling7DayAverageScore: number | null;
  rolling30DayAverageScore: number | null;
  qualityFlags: string[];
}

export interface SleepConsistencyBreakdown {
  scoredDays: number;
  optimal: number;
  sufficient: number;
  poor: number;
}

export interface SleepConsistencyAnalytics {
  baselineWindowDays: number;
  minimumBaselineNights: number;
  methodology: string;
  daily: DailySleepConsistency[];
  latest: DailySleepConsistency | null;
  average7DayScore: number | null;
  average30DayScore: number | null;
  previous30DayAverageScore: number | null;
  breakdown30Day: SleepConsistencyBreakdown;
}

export type HealthspanStatus = "calibrating" | "partial" | "ready";
export type HealthspanFactorKey =
  | "sleep_duration"
  | "sleep_consistency"
  | "steps"
  | "resting_heart_rate";

export interface HealthspanFactor {
  key: HealthspanFactorKey;
  label: string;
  value: number;
  unit: "minutes" | "percent" | "steps" | "bpm";
  referenceValue: number;
  ageImpactYears: number;
  coverageDays: number;
}

export interface DailyHealthspanEstimate {
  date: DateKey;
  chronologicalAgeYears: number | null;
  healthAgeYears: number | null;
  ageDeltaYears: number | null;
  paceOfAging: number | null;
  factors: HealthspanFactor[];
  qualityFlags: string[];
}

export interface HealthspanAnalytics {
  modelVersion: string;
  status: HealthspanStatus;
  birthDateConfigured: boolean;
  methodology: string;
  calibrationReasons: string[];
  trend: DailyHealthspanEstimate[];
  latest: DailyHealthspanEstimate | null;
  paceOfAging: number | null;
  paceWindowDays: number;
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
  sleepEvents: SleepEvent[];
  dailySleep: DailySleepSummary[];
  sleepDebt: SleepDebtAnalytics;
  sleepConsistency: SleepConsistencyAnalytics;
  healthspan: HealthspanAnalytics;
  deviceSleep: DeviceSleepSummary[];
  steps: MetricAnalytics;
  activeCalories: MetricAnalytics;
  totalCalories: MetricAnalytics;
  restingHeartRate: MetricAnalytics;
  weight: MetricAnalytics;
}
