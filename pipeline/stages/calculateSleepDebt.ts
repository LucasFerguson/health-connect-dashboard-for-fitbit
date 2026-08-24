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
  DailySleepDebt,
  DailySleepSummary,
  SleepDebtAnalytics,
  SleepDebtBreakdown,
  SleepDebtCategory,
} from "../../src/domain/analytics";

const DAY_IN_MS = 86_400_000;

export function calculateSleepDebt(
  summaries: DailySleepSummary[],
  targetMinutes: number,
): SleepDebtAnalytics {
  const ordered = [...summaries].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const daily: DailySleepDebt[] = ordered.map((summary, index) => {
    const debtMinutes = Math.max(targetMinutes - summary.sleepMinutes, 0);
    const window7 = calendarWindow(ordered, index, 7).map((item) =>
      Math.max(targetMinutes - item.sleepMinutes, 0),
    );
    const window30 = calendarWindow(ordered, index, 30).map((item) =>
      Math.max(targetMinutes - item.sleepMinutes, 0),
    );
    return {
      date: summary.date,
      sleepMinutes: summary.sleepMinutes,
      targetMinutes,
      debtMinutes,
      surplusMinutes: Math.max(summary.sleepMinutes - targetMinutes, 0),
      category: categorizeDebt(debtMinutes),
      rolling7DayAverageMinutes: average(window7),
      rolling7DayTotalMinutes: sum(window7),
      rolling30DayAverageMinutes: average(window30),
    };
  });
  const latest = daily.at(-1) ?? null;
  const latestDate = latest?.date;
  const current30 = latestDate
    ? filterByCalendarWindow(daily, latestDate, 30)
    : [];
  const previous30 = latestDate
    ? filterByCalendarWindow(daily, shiftDate(latestDate, -30), 30)
    : [];

  return {
    targetMinutes,
    methodology:
      "Daily debt is the positive difference between target sleep and recorded sleep. Rolling averages exclude days without a sleep record.",
    daily,
    latest,
    average7DayMinutes: latest?.rolling7DayAverageMinutes ?? null,
    average30DayMinutes: latest?.rolling30DayAverageMinutes ?? null,
    previous30DayAverageMinutes: averageOrNull(
      previous30.map((day) => day.debtMinutes),
    ),
    breakdown30Day: breakdown(current30),
  };
}

export function categorizeDebt(minutes: number): SleepDebtCategory {
  if (minutes <= 0) return "none";
  if (minutes < 30) return "low";
  if (minutes <= 45) return "moderate";
  return "high";
}

function calendarWindow(
  summaries: DailySleepSummary[],
  endIndex: number,
  days: number,
) {
  const end = summaries[endIndex];
  if (!end) return [];
  const earliest = parseDate(end.date) - (days - 1) * DAY_IN_MS;
  return summaries
    .slice(0, endIndex + 1)
    .filter((summary) => parseDate(summary.date) >= earliest);
}

function filterByCalendarWindow(
  daily: DailySleepDebt[],
  endDate: string,
  days: number,
) {
  const end = parseDate(endDate);
  const earliest = end - (days - 1) * DAY_IN_MS;
  return daily.filter((day) => {
    const date = parseDate(day.date);
    return date >= earliest && date <= end;
  });
}

function breakdown(days: DailySleepDebt[]): SleepDebtBreakdown {
  return days.reduce<SleepDebtBreakdown>(
    (result, day) => ({
      ...result,
      recordedDays: result.recordedDays + 1,
      [day.category]: result[day.category] + 1,
    }),
    { recordedDays: 0, none: 0, low: 0, moderate: 0, high: 0 },
  );
}

function average(values: number[]): number {
  return averageOrNull(values) ?? 0;
}

function averageOrNull(values: number[]): number | null {
  return values.length ? sum(values) / values.length : null;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function parseDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function shiftDate(date: string, amount: number): string {
  return new Date(parseDate(date) + amount * DAY_IN_MS)
    .toISOString()
    .slice(0, 10);
}
