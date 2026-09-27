/**
 * Journal habits (WHOOP's daily yes/no questions) for `/habits` and the
 * habit metrics on `/explore`: bucketing answers into days and weeks, the
 * per-range counts, and the page's URL state.
 *
 * Two rules run through everything here:
 *
 * - **An answer is literal, not a score.** `answeredYes` means "yes" to the
 *   question as asked. For "Experienced a headache?" that records the
 *   symptom, so nothing here (or in the UI) treats yes as success or no as
 *   failure.
 * - **No answer is absent, never "no".** A day without an entry has no
 *   `HabitDay` at all; only a recorded "no" counts as one.
 */
import { shiftDate } from "./correlation";
import type { DateKey } from "./health";

export interface HabitEntry {
  id: string;
  date: DateKey;
  answeredYes: boolean;
  notes: string | null;
  /** The WHOOP cycle this answer belongs to, as source-local wall time
   * ("2026-01-12T02:45:47"). A cycle runs wake to wake, so it rarely lines
   * up with midnight. */
  cycleStartLocal: string;
  cycleEndLocal: string;
}

export interface Habit {
  id: string;
  source: string;
  question: string;
  /** All-time, whatever range the entries were fetched for. */
  firstSeenDate: DateKey;
  lastSeenDate: DateKey;
  /** All-time entry count. The backend does not scope it to `range`, so
   * per-range counts come from `entries` instead. */
  entryCount: number;
  entries: HabitEntry[];
}

export type HabitAnswer = "yes" | "no";

/** One question's answer for one calendar day. */
export interface HabitDay {
  date: DateKey;
  answer: HabitAnswer;
  /** Usually one. WHOOP dates a cycle by the day it ends, so a short cycle
   * (a nap-to-bed day) can put two cycles, each with its own answer, on one
   * date; 2026-01-13 has two in the live data. */
  entries: HabitEntry[];
  /** True when that day's cycles disagree (one yes, one no). */
  mixed: boolean;
}

/**
 * Each question's entries folded into one answer per date.
 *
 * A date whose cycles disagree counts as **yes**: the questions ask whether
 * something happened ("Consumed caffeine?", "Experienced a headache?"), and
 * a yes in either cycle means it happened on that date. The day keeps both
 * entries and a `mixed` flag so the grid can show the disagreement rather
 * than hide it.
 */
export function answersByDay(
  entries: readonly HabitEntry[],
): Map<DateKey, HabitDay> {
  const days = new Map<DateKey, HabitDay>();
  const sorted = [...entries].sort((a, b) =>
    a.cycleStartLocal.localeCompare(b.cycleStartLocal),
  );
  for (const entry of sorted) {
    const existing = days.get(entry.date);
    const answer: HabitAnswer = entry.answeredYes ? "yes" : "no";
    if (!existing) {
      days.set(entry.date, {
        date: entry.date,
        answer,
        entries: [entry],
        mixed: false,
      });
      continue;
    }
    existing.entries.push(entry);
    if (existing.answer !== answer) existing.mixed = true;
    if (answer === "yes") existing.answer = "yes";
  }
  return days;
}

/**
 * A habit as an `/explore` series: yes = 1, no = 0, and a day with no
 * answer is simply not in the list. A date with two cycles follows the
 * `answersByDay` rule (any yes makes it a yes day).
 */
export function habitSeries(
  entries: readonly { date: DateKey; answeredYes: boolean }[],
): { date: DateKey; value: number }[] {
  const byDate = new Map<DateKey, number>();
  for (const entry of entries) {
    const value = entry.answeredYes ? 1 : 0;
    byDate.set(entry.date, Math.max(byDate.get(entry.date) ?? 0, value));
  }
  return [...byDate]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

const within = (date: DateKey, from: DateKey | null, to: DateKey | null) =>
  (from === null || date >= from) && (to === null || date <= to);

export interface HabitRangeStats {
  /** Entries (cycle answers) in the range. */
  responses: number;
  /** Distinct dates with at least one answer. */
  answeredDays: number;
  yesDays: number;
  noDays: number;
  /** Dates whose cycles disagreed, counted in `yesDays`. */
  mixedDays: number;
}

/** Counts for one question between `from` and `to` (inclusive; `null` is
 * unbounded). */
export function habitRangeStats(
  entries: readonly HabitEntry[],
  from: DateKey | null,
  to: DateKey | null,
): HabitRangeStats {
  const inRange = entries.filter((entry) => within(entry.date, from, to));
  const days = [...answersByDay(inRange).values()];
  const yesDays = days.filter((day) => day.answer === "yes").length;
  return {
    responses: inRange.length,
    answeredDays: days.length,
    yesDays,
    noDays: days.length - yesDays,
    mixedDays: days.filter((day) => day.mixed).length,
  };
}

/**
 * Journal notes by date, de-duplicated. WHOOP attaches the day's journal
 * note to every question's entry for that day (the live data repeats each
 * note eight times), so it is really one note per day.
 */
export function notesByDay(habits: readonly Habit[]): Map<DateKey, string[]> {
  const notes = new Map<DateKey, Set<string>>();
  for (const habit of habits) {
    for (const entry of habit.entries) {
      const text = entry.notes?.trim();
      if (!text) continue;
      const set = notes.get(entry.date) ?? new Set<string>();
      set.add(text);
      notes.set(entry.date, set);
    }
  }
  return new Map([...notes].map(([date, set]) => [date, [...set]]));
}

/** The most recent answer date across all questions (all-time), or `null`
 * when there are none. */
export function latestResponseDate(
  habits: readonly { lastSeenDate: DateKey; entryCount: number }[],
): DateKey | null {
  let latest: DateKey | null = null;
  for (const habit of habits) {
    if (habit.entryCount === 0) continue;
    if (latest === null || habit.lastSeenDate > latest) {
      latest = habit.lastSeenDate;
    }
  }
  return latest;
}

/** The earliest and latest answer dates across all questions (all-time). */
export function responseSpan(
  habits: readonly {
    firstSeenDate: DateKey;
    lastSeenDate: DateKey;
    entryCount: number;
  }[],
): { from: DateKey; to: DateKey } | null {
  const answered = habits.filter((habit) => habit.entryCount > 0);
  if (answered.length === 0) return null;
  return {
    from: answered.map((habit) => habit.firstSeenDate).sort()[0]!,
    to: answered
      .map((habit) => habit.lastSeenDate)
      .sort()
      .at(-1)!,
  };
}

// ---------------------------------------------------------------------------
// Periods and columns

export const HABIT_VIEWS = ["week", "month", "all"] as const;
export type HabitView = (typeof HABIT_VIEWS)[number];

export interface HabitPeriod {
  view: HabitView;
  /** Inclusive bounds; `null` for the "all" view, which is unbounded. */
  from: DateKey | null;
  to: DateKey | null;
}

const DAY_MS = 86_400_000;

/** 0 = Monday … 6 = Sunday. */
function weekdayIndex(date: DateKey) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Monday of the ISO week containing `date`. */
export function weekStart(date: DateKey): DateKey {
  return shiftDate(date, -weekdayIndex(date));
}

function monthStart(date: DateKey): DateKey {
  return `${date.slice(0, 7)}-01`;
}

function monthEnd(date: DateKey): DateKey {
  const [year, month] = date.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year!, month, 0)).toISOString().slice(0, 10);
}

/** The week (Monday–Sunday) or calendar month containing `anchor`. */
export function periodFor(view: HabitView, anchor: DateKey): HabitPeriod {
  switch (view) {
    case "week": {
      const from = weekStart(anchor);
      return { view, from, to: shiftDate(from, 6) };
    }
    case "month":
      return { view, from: monthStart(anchor), to: monthEnd(anchor) };
    case "all":
      return { view, from: null, to: null };
  }
}

/** The anchor one period earlier (`-1`) or later (`1`). A month step lands
 * on the 1st, so Jan 31 + 1 month is February, not March 3. */
export function stepAnchor(
  view: HabitView,
  anchor: DateKey,
  direction: -1 | 1,
): DateKey {
  switch (view) {
    case "week":
      return shiftDate(weekStart(anchor), 7 * direction);
    case "month": {
      const [year, month] = anchor.split("-").map(Number);
      return new Date(Date.UTC(year!, month! - 1 + direction, 1))
        .toISOString()
        .slice(0, 10);
    }
    case "all":
      return anchor;
  }
}

/**
 * The `$range` for a period. The backend compares each entry's calendar date,
 * read as UTC midnight, against `[start, endExclusive)`, so a date-key period
 * maps onto it exactly with no time-zone padding. `null` is all history.
 */
export function periodQueryRange(
  period: HabitPeriod,
): { start: string; endExclusive: string } | null {
  if (period.from === null || period.to === null) return null;
  return {
    start: `${period.from}T00:00:00Z`,
    endExclusive: `${shiftDate(period.to, 1)}T00:00:00Z`,
  };
}

export interface HabitColumn {
  /** First date the column covers (also its React key). */
  from: DateKey;
  /** Last date, inclusive. Equal to `from` for a day column. */
  to: DateKey;
  kind: "day" | "week";
}

/** Every date from `from` to `to`, inclusive. */
export function datesBetween(from: DateKey, to: DateKey): DateKey[] {
  const dates: DateKey[] = [];
  for (let date = from; date <= to; date = shiftDate(date, 1)) dates.push(date);
  return dates;
}

/**
 * Grid columns: one per day for a week or month, and one per ISO week for
 * "all", where daily columns would be ~90 mostly-empty slivers. Week
 * columns are clipped to `[from, to]`, so the first and last may be short.
 */
export function habitColumns(
  view: HabitView,
  from: DateKey,
  to: DateKey,
): HabitColumn[] {
  if (from > to) return [];
  if (view !== "all") {
    return datesBetween(from, to).map((date) => ({
      from: date,
      to: date,
      kind: "day",
    }));
  }
  const columns: HabitColumn[] = [];
  for (let start = weekStart(from); start <= to; start = shiftDate(start, 7)) {
    const end = shiftDate(start, 6);
    columns.push({
      from: start < from ? from : start,
      to: end > to ? to : end,
      kind: "week",
    });
  }
  return columns;
}

/** How many calendar days `[from, to]` spans. */
export function daySpan(from: DateKey, to: DateKey) {
  return (
    Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        DAY_MS,
    ) + 1
  );
}

// ---------------------------------------------------------------------------
// URL state

export interface HabitsSelection {
  view: HabitView;
  /** Any date inside the period to show. `null` means "the period with the
   * most recent answer", resolved on the server. */
  date: DateKey | null;
}

/**
 * Month, not week: answers are sparse (18 answered days across Jan–Apr 2026
 * in the live data), so a week shows at most a handful of columns while a
 * month shows the rhythm. Either way the default period is the one holding
 * the latest answer, never an empty "this week".
 */
export const DEFAULT_HABIT_VIEW: HabitView = "month";

/** A real calendar date in `YYYY-MM-DD` form (rejects 2026-02-31). */
export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(time) && new Date(time).toISOString().startsWith(value)
  );
}

function isHabitView(value: unknown): value is HabitView {
  return HABIT_VIEWS.some((view) => view === value);
}

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Forgiving, like `/explore`: a bad value falls back to its default. */
export function parseHabitsParams(params: RawParams): HabitsSelection {
  const view = read(params, "view");
  const date = read(params, "date");
  return {
    view: isHabitView(view) ? view : DEFAULT_HABIT_VIEW,
    date: isValidDateKey(date) ? date : null,
  };
}

/** Query string (no "?"). The "all" view has no date; it would mean
 * nothing. */
export function habitsSearch(selection: HabitsSelection): string {
  const params = new URLSearchParams({ view: selection.view });
  if (selection.view !== "all" && selection.date) {
    params.set("date", selection.date);
  }
  return params.toString();
}

// ---------------------------------------------------------------------------
// Labels

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const monthDayYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const utc = (date: DateKey) => new Date(`${date}T00:00:00Z`);

/** "Jan 9 – Apr 8, 2026", "Dec 29, 2025 – Jan 4, 2026", "Apr 6 – 12, 2026". */
export function formatDateSpan(from: DateKey, to: DateKey): string {
  if (from === to) return monthDayYear.format(utc(from));
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  if (!sameYear) {
    return `${monthDayYear.format(utc(from))} – ${monthDayYear.format(utc(to))}`;
  }
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const end = sameMonth
    ? `${Number(to.slice(8))}, ${to.slice(0, 4)}`
    : monthDayYear.format(utc(to));
  return `${monthDay.format(utc(from))} – ${end}`;
}

/** The heading for a period: "April 2026", "Apr 6 – 12, 2026", or the
 * answer span for "all". */
export function formatPeriod(
  period: HabitPeriod,
  span: { from: DateKey; to: DateKey } | null,
): string {
  if (period.view === "month" && period.from) {
    return monthYear.format(utc(period.from));
  }
  if (period.from && period.to) return formatDateSpan(period.from, period.to);
  return span ? `All answers · ${formatDateSpan(span.from, span.to)}` : "All";
}
