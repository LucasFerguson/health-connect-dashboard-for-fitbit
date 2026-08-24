import type { DateKey, ISODateTime } from "./health";

/**
 * Shared time-axis math for the 24-hour timeline. Every lane and overlay on
 * the day view maps a moment in time to a horizontal percentage using these
 * functions, so they stay pixel-aligned per the design spec's explicit
 * requirement that the axis be implemented once and shared.
 *
 * The axis always spans exactly 24 hours, anchored to a **local calendar
 * day** in `timeZone` (the same IANA zone the analytics pipeline uses via
 * `HEALTH_HOME_TIME_ZONE` — see `pipeline/context.ts` and
 * `pipeline/shared/dateKey.ts`), not UTC midnight. `dayStartHour` pivots
 * the origin within that local day (0 = midnight-to-midnight, 18 =
 * 18:00-to-18:00) so a night can be viewed whole; it is a parameter, not a
 * constant, per the open design question on the default.
 */

const MINUTES_PER_DAY = 24 * 60;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const clockFormatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function clockFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = clockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    clockFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The `YYYY-MM-DD` calendar-day key for an instant, in `timeZone`. Mirrors
 * `dateKeyInTimeZone` in `pipeline/shared/dateKey.ts` so the day view buckets
 * dates the same way the analytics pipeline does. */
export function dateKeyOf(iso: ISODateTime, timeZone: string): DateKey {
  const parts = dateFormatterFor(timeZone).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Minutes since local midnight, in `timeZone`, for an instant. */
function localMinuteOfDay(iso: ISODateTime, timeZone: string): number {
  const parts = clockFormatterFor(timeZone).formatToParts(new Date(iso));
  const value = (type: "hour" | "minute") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

/** The instant (epoch ms) at which the axis for `date` begins, given the
 * configured day-start hour (0-23), anchored to `date`'s local midnight in
 * `timeZone` rather than UTC midnight. */
export function axisStartMs(
  date: DateKey,
  dayStartHour: number,
  timeZone: string,
): number {
  // Find the instant whose local calendar date in `timeZone` is `date` and
  // whose local time is 00:00, by probing a UTC-midnight guess and
  // correcting for the zone's offset at that instant (handles all
  // fixed-offset and DST zones without a date library).
  const utcGuessMs = Date.parse(`${date}T00:00:00Z`);
  const guessLocalMinutes = localMinuteOfDay(
    new Date(utcGuessMs).toISOString(),
    timeZone,
  );
  const guessDateKey = dateKeyOf(new Date(utcGuessMs).toISOString(), timeZone);
  // Offset (in minutes) to add to the UTC guess to reach local midnight of
  // `date`: if the local calendar date at the UTC guess is already `date`,
  // subtract however far into that local day we are; if the UTC guess
  // landed on the previous local day (zone is behind UTC), add the
  // remainder to reach the next local midnight.
  const dayDiff = guessDateKey === date ? 0 : guessDateKey < date ? 1 : -1;
  const localMidnightMs =
    utcGuessMs -
    guessLocalMinutes * 60_000 +
    dayDiff * MINUTES_PER_DAY * 60_000;
  return localMidnightMs + dayStartHour * 60 * 60 * 1000;
}

/** Converts an ISO timestamp to a percentage (0-100) along the day's
 * 24-hour axis, pivoted at `dayStartHour`. Values before the axis start
 * wrap to the previous day's position (i.e. they clamp to 0) and values
 * past the axis end clamp to 100 — callers that need clipped segments
 * (e.g. lane rendering) should clamp themselves before calling this. */
export function timeToPercent(
  iso: ISODateTime,
  date: DateKey,
  dayStartHour: number,
  timeZone: string,
): number {
  const start = axisStartMs(date, dayStartHour, timeZone);
  const instant = Date.parse(iso);
  const minutesFromStart = (instant - start) / 60_000;
  const clamped = Math.min(MINUTES_PER_DAY, Math.max(0, minutesFromStart));
  return (clamped / MINUTES_PER_DAY) * 100;
}

/** Percentage width of a duration in minutes, along the same 24-hour axis. */
export function minutesToPercentWidth(minutes: number): number {
  return (minutes / MINUTES_PER_DAY) * 100;
}

/** Inverse of `timeToPercent`: the `HH:MM` clock label for a position along
 * the axis (0-100), pivoted at `dayStartHour`. Used for the hover
 * crosshair, where the cursor position is already axis-relative rather
 * than an absolute instant, so this skips the timezone round trip that
 * `timeToPercent`/`formatClock` need for real timestamps. */
export function percentToClockLabel(
  percent: number,
  dayStartHour: number,
): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const totalMinutes = Math.round((clamped / 100) * MINUTES_PER_DAY);
  const minutesOfDay = (dayStartHour * 60 + totalMinutes) % MINUTES_PER_DAY;
  const hours = Math.floor(minutesOfDay / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (minutesOfDay % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** The 24 hourly slot boundaries (as ISO instants) for `date`, pivoted at
 * `dayStartHour`. Slot `i` runs from `boundaries[i]` to `boundaries[i+1]`. */
export function hourlySlotBoundaries(
  date: DateKey,
  dayStartHour: number,
  timeZone: string,
): ISODateTime[] {
  const start = axisStartMs(date, dayStartHour, timeZone);
  return Array.from({ length: 25 }, (_, hour) =>
    new Date(start + hour * 60 * 60 * 1000).toISOString(),
  );
}

/** The clock-hour label (0-23) for slot `i`, accounting for the pivot. */
export function hourLabelForSlot(
  slotIndex: number,
  dayStartHour: number,
): number {
  return (dayStartHour + slotIndex) % 24;
}

/** Formats an ISO instant as a local `HH:MM` string in `timeZone`. */
export function formatClock(iso: ISODateTime, timeZone: string): string {
  const parts = clockFormatterFor(timeZone).formatToParts(new Date(iso));
  const value = (type: "hour" | "minute") =>
    (parts.find((part) => part.type === type)?.value ?? "00").padStart(2, "0");
  return `${value("hour")}:${value("minute")}`;
}

/** True when `iso` falls within [axisStart, axisStart + 24h) for `date`. */
export function isWithinAxis(
  iso: ISODateTime,
  date: DateKey,
  dayStartHour: number,
  timeZone: string,
): boolean {
  const start = axisStartMs(date, dayStartHour, timeZone);
  const instant = Date.parse(iso);
  return instant >= start && instant < start + MINUTES_PER_DAY * 60_000;
}
