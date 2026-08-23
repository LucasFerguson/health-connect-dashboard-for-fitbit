import type {
  DailySleepConsistency,
  SleepConsistencyAnalytics,
  SleepConsistencyBreakdown,
  SleepConsistencyCategory,
  SleepEvent,
} from "../../src/domain/analytics";
import { minutesBetween } from "../../src/domain/sleep";
import type { PipelineContext } from "../context";
import { localMinuteOfDay } from "../shared/dateKey";

const BASELINE_WINDOW_DAYS = 14;
const MINIMUM_BASELINE_NIGHTS = 3;
const DAY_IN_MS = 86_400_000;

interface NightSchedule {
  date: string;
  source: string;
  bedtimeAt: string;
  wakeAt: string;
  bedtimeMinutesLocal: number;
  wakeMinutesLocal: number;
}

export function calculateSleepConsistency(
  events: SleepEvent[],
  context: PipelineContext,
): SleepConsistencyAnalytics {
  const schedules = buildNightSchedules(events, context);
  const evaluated: DailySleepConsistency[] = schedules.map((night, index) => {
    const baselineNights = priorCalendarNights(schedules, index);
    const baselineBedtime = circularMean(
      baselineNights.map((item) => item.bedtimeMinutesLocal),
    );
    const baselineWake = circularMean(
      baselineNights.map((item) => item.wakeMinutesLocal),
    );
    const hasBaseline = baselineNights.length >= MINIMUM_BASELINE_NIGHTS;
    const bedtimeDeviation = hasBaseline
      ? circularDistance(night.bedtimeMinutesLocal, baselineBedtime)
      : null;
    const wakeDeviation = hasBaseline
      ? circularDistance(night.wakeMinutesLocal, baselineWake)
      : null;
    const score =
      bedtimeDeviation === null || wakeDeviation === null
        ? null
        : consistencyScore(bedtimeDeviation, wakeDeviation);
    return {
      ...night,
      baselineBedtimeMinutesLocal: hasBaseline ? baselineBedtime : null,
      baselineWakeMinutesLocal: hasBaseline ? baselineWake : null,
      bedtimeDeviationMinutes: bedtimeDeviation,
      wakeDeviationMinutes: wakeDeviation,
      baselineNightCount: baselineNights.length,
      score,
      category: score === null ? null : categorizeConsistency(score),
      rolling7DayAverageScore: null,
      rolling30DayAverageScore: null,
      qualityFlags: hasBaseline ? [] : ["insufficient_baseline"],
    };
  });

  const daily = evaluated.map((day) => ({
    ...day,
    rolling7DayAverageScore: rollingAverage(evaluated, day.date, 7),
    rolling30DayAverageScore: rollingAverage(evaluated, day.date, 30),
  }));

  const scored = daily.filter(hasScore);
  const latest = scored.at(-1) ?? null;
  const latestDate = latest?.date;
  const current30 = latestDate ? calendarWindow(scored, latestDate, 30) : [];
  const previous30 = latestDate
    ? calendarWindow(scored, shiftDate(latestDate, -30), 30)
    : [];
  return {
    baselineWindowDays: BASELINE_WINDOW_DAYS,
    minimumBaselineNights: MINIMUM_BASELINE_NIGHTS,
    methodology:
      "The longest sleep event is treated as the main sleep for each day. Bedtime and wake time are compared with a circular 14-day baseline from prior nights. The score starts at 100 and loses one point per three minutes of average schedule deviation.",
    daily,
    latest,
    average7DayScore: latest?.rolling7DayAverageScore ?? null,
    average30DayScore: latest?.rolling30DayAverageScore ?? null,
    previous30DayAverageScore: averageScore(previous30),
    breakdown30Day: breakdown(current30),
  };
}

export function consistencyScore(
  bedtimeDeviationMinutes: number,
  wakeDeviationMinutes: number,
): number {
  const averageDeviation = (bedtimeDeviationMinutes + wakeDeviationMinutes) / 2;
  return Math.round(Math.max(0, Math.min(100, 100 - averageDeviation / 3)));
}

export function categorizeConsistency(score: number): SleepConsistencyCategory {
  if (score >= 80) return "optimal";
  if (score >= 70) return "sufficient";
  return "poor";
}

function buildNightSchedules(
  events: SleepEvent[],
  context: PipelineContext,
): NightSchedule[] {
  const longestByDate = new Map<string, SleepEvent>();
  for (const event of events) {
    const current = longestByDate.get(event.date);
    if (
      !current ||
      minutesBetween(event.primary.startAt, event.primary.endAt) >
        minutesBetween(current.primary.startAt, current.primary.endAt)
    ) {
      longestByDate.set(event.date, event);
    }
  }
  return [...longestByDate.values()]
    .map((event) => ({
      date: event.date,
      source: event.primary.source,
      bedtimeAt: event.primary.startAt,
      wakeAt: event.primary.endAt,
      bedtimeMinutesLocal: localMinuteOfDay(
        event.primary.startAt,
        context.homeTimeZone,
      ),
      wakeMinutesLocal: localMinuteOfDay(
        event.primary.endAt,
        context.homeTimeZone,
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function priorCalendarNights(schedules: NightSchedule[], index: number) {
  const current = schedules[index];
  if (!current) return [];
  const earliest = parseDate(current.date) - BASELINE_WINDOW_DAYS * DAY_IN_MS;
  return schedules
    .slice(0, index)
    .filter((night) => parseDate(night.date) >= earliest);
}

function circularMean(values: number[]): number {
  if (!values.length) return 0;
  const radians = values.map((value) => (value / 1_440) * Math.PI * 2);
  const x = radians.reduce((total, value) => total + Math.cos(value), 0);
  const y = radians.reduce((total, value) => total + Math.sin(value), 0);
  const angle = Math.atan2(y / values.length, x / values.length);
  return Math.round(
    (((angle < 0 ? angle + Math.PI * 2 : angle) / (Math.PI * 2)) * 1_440) %
      1_440,
  );
}

function circularDistance(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, 1_440 - distance);
}

function rollingAverage(
  daily: DailySleepConsistency[],
  endDate: string,
  days: number,
): number | null {
  return averageScore(calendarWindow(daily.filter(hasScore), endDate, days));
}

function calendarWindow<T extends { date: string }>(
  values: T[],
  endDate: string,
  days: number,
): T[] {
  const end = parseDate(endDate);
  const earliest = end - (days - 1) * DAY_IN_MS;
  return values.filter((value) => {
    const date = parseDate(value.date);
    return date >= earliest && date <= end;
  });
}

function averageScore(days: DailySleepConsistency[]): number | null {
  const scores = days
    .map((day) => day.score)
    .filter((score): score is number => score !== null);
  return scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : null;
}

function breakdown(days: DailySleepConsistency[]): SleepConsistencyBreakdown {
  return days.reduce<SleepConsistencyBreakdown>(
    (result, day) => {
      if (!day.category) return result;
      return {
        ...result,
        scoredDays: result.scoredDays + 1,
        [day.category]: result[day.category] + 1,
      };
    },
    { scoredDays: 0, optimal: 0, sufficient: 0, poor: 0 },
  );
}

function hasScore(
  day: DailySleepConsistency,
): day is DailySleepConsistency & { score: number } {
  return day.score !== null;
}

function parseDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function shiftDate(date: string, amount: number): string {
  return new Date(parseDate(date) + amount * DAY_IN_MS)
    .toISOString()
    .slice(0, 10);
}
