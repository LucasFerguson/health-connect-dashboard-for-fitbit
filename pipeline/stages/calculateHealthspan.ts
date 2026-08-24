/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
import type {
  DailyHealthspanEstimate,
  DailyMetricSummary,
  DailySleepSummary,
  HealthspanAnalytics,
  HealthspanFactor,
  MetricAnalytics,
  SleepConsistencyAnalytics,
} from "../../src/domain/analytics";
import type { PipelineContext } from "../context";

const DAY_IN_MS = 86_400_000;
const YEAR_IN_DAYS = 365.2425;
const FACTOR_WINDOW_DAYS = 30;
const PACE_WINDOW_DAYS = 180;
const MODEL_VERSION = "experimental-healthspan-v1";

interface HealthspanInputs {
  dailySleep: DailySleepSummary[];
  sleepConsistency: SleepConsistencyAnalytics;
  steps: MetricAnalytics;
  restingHeartRate: MetricAnalytics;
}

interface FactorInput {
  sleepMinutes?: { value: number; coverageDays: number };
  consistencyScore?: { value: number; coverageDays: number };
  steps?: { value: number; coverageDays: number };
  restingHeartRate?: { value: number; coverageDays: number };
}

export function calculateHealthspan(
  inputs: HealthspanInputs,
  context: PipelineContext,
): HealthspanAnalytics {
  const dates = [
    ...new Set([
      ...inputs.dailySleep.map((day) => day.date),
      ...inputs.sleepConsistency.daily.map((day) => day.date),
      ...inputs.steps.daily.map((day) => day.date),
      ...inputs.restingHeartRate.daily.map((day) => day.date),
    ]),
  ].sort();

  const estimates: DailyHealthspanEstimate[] = dates.map((date) => {
    const factors = scoreHealthspanFactors(
      {
        sleepMinutes: averageSleep(inputs.dailySleep, date),
        consistencyScore: averageConsistency(inputs.sleepConsistency, date),
        steps: averageMetric(inputs.steps.daily, date, 5),
        restingHeartRate: averageMetric(inputs.restingHeartRate.daily, date, 3),
      },
      context.sleepTargetMinutes,
    );
    const ageDeltaYears = factors.length
      ? round(
          factors.reduce((total, factor) => total + factor.ageImpactYears, 0),
          2,
        )
      : null;
    const chronologicalAgeYears = context.birthDate
      ? ageAt(context.birthDate, date)
      : null;
    const healthAgeYears =
      chronologicalAgeYears !== null &&
      ageDeltaYears !== null &&
      factors.length >= 2
        ? round(
            clamp(
              chronologicalAgeYears + ageDeltaYears,
              chronologicalAgeYears - 15,
              chronologicalAgeYears + 15,
            ),
            2,
          )
        : null;
    return {
      date,
      chronologicalAgeYears,
      healthAgeYears,
      ageDeltaYears,
      paceOfAging: null,
      factors,
      qualityFlags: [
        ...(context.birthDate ? [] : ["birth_date_required"]),
        ...(factors.length >= 2 ? [] : ["insufficient_factors"]),
      ],
    };
  });

  const trend = estimates.map((estimate, index) => ({
    ...estimate,
    paceOfAging: calculatePaceOfAging(estimates.slice(0, index + 1)),
  }));
  const latest = trend.at(-1) ?? null;
  const calibrationReasons = [
    ...(context.birthDate
      ? []
      : ["Set HEALTH_BIRTH_DATE to calculate chronological and health age."]),
    ...(latest && latest.factors.length >= 2
      ? []
      : ["At least two sufficiently covered health factors are required."]),
    ...(context.birthDate &&
    latest?.healthAgeYears != null &&
    !latest.paceOfAging
      ? ["Pace of aging needs at least 30 days of health-age estimates."]
      : []),
  ];
  const status =
    !latest || latest.healthAgeYears === null || !context.birthDate
      ? "calibrating"
      : latest.paceOfAging === null
        ? "partial"
        : "ready";

  return {
    modelVersion: MODEL_VERSION,
    status,
    birthDateConfigured: context.birthDate !== null,
    methodology:
      "Experimental estimate, not a medical measurement. Thirty-day sleep duration, sleep consistency, steps, and resting heart rate each contribute an auditable age adjustment. Pace of aging is the annualized regression slope of health age over the latest 180 days.",
    calibrationReasons,
    trend,
    latest,
    paceOfAging: latest?.paceOfAging ?? null,
    paceWindowDays: PACE_WINDOW_DAYS,
  };
}

export function scoreHealthspanFactors(
  input: FactorInput,
  sleepTargetMinutes: number,
): HealthspanFactor[] {
  const factors: HealthspanFactor[] = [];
  if (input.sleepMinutes) {
    factors.push({
      key: "sleep_duration",
      label: "Hours of sleep",
      value: round(input.sleepMinutes.value, 1),
      unit: "minutes",
      referenceValue: sleepTargetMinutes,
      ageImpactYears: round(
        clamp(
          ((sleepTargetMinutes - input.sleepMinutes.value) / 60) * 0.9,
          -0.75,
          4,
        ),
        2,
      ),
      coverageDays: input.sleepMinutes.coverageDays,
    });
  }
  if (input.consistencyScore) {
    factors.push({
      key: "sleep_consistency",
      label: "Sleep consistency",
      value: round(input.consistencyScore.value, 1),
      unit: "percent",
      referenceValue: 80,
      ageImpactYears: round(
        clamp((80 - input.consistencyScore.value) * 0.03, -0.6, 3),
        2,
      ),
      coverageDays: input.consistencyScore.coverageDays,
    });
  }
  if (input.steps) {
    factors.push({
      key: "steps",
      label: "Steps",
      value: round(input.steps.value, 0),
      unit: "steps",
      referenceValue: 8_000,
      ageImpactYears: round(
        clamp((8_000 - input.steps.value) * 0.0004, -1.2, 2.8),
        2,
      ),
      coverageDays: input.steps.coverageDays,
    });
  }
  if (input.restingHeartRate) {
    factors.push({
      key: "resting_heart_rate",
      label: "Resting heart rate",
      value: round(input.restingHeartRate.value, 1),
      unit: "bpm",
      referenceValue: 60,
      ageImpactYears: round(
        clamp((input.restingHeartRate.value - 60) * 0.1, -2, 3),
        2,
      ),
      coverageDays: input.restingHeartRate.coverageDays,
    });
  }
  return factors;
}

export function calculatePaceOfAging(
  estimates: DailyHealthspanEstimate[],
): number | null {
  const available = estimates.filter(
    (
      estimate,
    ): estimate is DailyHealthspanEstimate & { healthAgeYears: number } =>
      estimate.healthAgeYears !== null,
  );
  const endDate = available.at(-1)?.date;
  if (!endDate) return null;
  const window = calendarWindow(available, endDate, PACE_WINDOW_DAYS);
  const first = window[0];
  const last = window.at(-1);
  if (
    window.length < 6 ||
    !first ||
    !last ||
    (parseDate(last.date) - parseDate(first.date)) / DAY_IN_MS < 30
  ) {
    return null;
  }
  const origin = parseDate(first.date);
  const points = window.map((estimate) => ({
    x: (parseDate(estimate.date) - origin) / DAY_IN_MS,
    y: estimate.healthAgeYears,
  }));
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  const numerator = points.reduce(
    (total, point) => total + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const denominator = points.reduce(
    (total, point) => total + (point.x - meanX) ** 2,
    0,
  );
  if (!denominator) return null;
  return round(clamp((numerator / denominator) * YEAR_IN_DAYS, -1, 3), 2);
}

function averageSleep(
  values: DailySleepSummary[],
  endDate: string,
): FactorInput["sleepMinutes"] {
  const window = calendarWindow(values, endDate, FACTOR_WINDOW_DAYS);
  return window.length >= 7
    ? {
        value: mean(window.map((day) => day.sleepMinutes)),
        coverageDays: window.length,
      }
    : undefined;
}

function averageConsistency(
  analytics: SleepConsistencyAnalytics,
  endDate: string,
): FactorInput["consistencyScore"] {
  const window = calendarWindow(
    analytics.daily.filter(
      (day): day is typeof day & { score: number } => day.score !== null,
    ),
    endDate,
    FACTOR_WINDOW_DAYS,
  );
  return window.length >= 5
    ? {
        value: mean(window.map((day) => day.score)),
        coverageDays: window.length,
      }
    : undefined;
}

function averageMetric(
  values: DailyMetricSummary[],
  endDate: string,
  minimumDays: number,
): { value: number; coverageDays: number } | undefined {
  const window = calendarWindow(values, endDate, FACTOR_WINDOW_DAYS);
  return window.length >= minimumDays
    ? {
        value: mean(window.map((day) => day.value)),
        coverageDays: window.length,
      }
    : undefined;
}

function calendarWindow<T extends { date: string }>(
  values: T[],
  endDate: string,
  days: number,
): T[] {
  const end = parseDate(endDate);
  const earliest = end - (days - 1) * DAY_IN_MS;
  return values.filter((value) => {
    const instant = parseDate(value.date);
    return instant >= earliest && instant <= end;
  });
}

function ageAt(birthDate: string, date: string): number {
  return (parseDate(date) - parseDate(birthDate)) / DAY_IN_MS / YEAR_IN_DAYS;
}

function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function parseDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
