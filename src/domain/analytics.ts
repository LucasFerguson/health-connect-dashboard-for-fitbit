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

export interface HealthAnalytics {
  algorithmVersion: string;
  sourceFingerprint: string;
  processedAt: ISODateTime;
  sleepEvents: SleepEvent[];
  dailySleep: DailySleepSummary[];
  deviceSleep: DeviceSleepSummary[];
}
