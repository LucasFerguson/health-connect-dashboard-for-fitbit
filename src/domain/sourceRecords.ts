/**
 * Presentation logic for the raw "Source records" sections on /skin-temperature
 * and /hrv. These show every record HCGateway stored, every field, exactly as
 * the source app wrote it — including values that look implausible (Fitbit's
 * skin-temperature `baseline` is ~41.6 °C). Nothing here filters, clamps or
 * drops a value; a missing value renders as "—", never as 0.
 */
import type { DateKey, ISODateTime } from "./health";
import { dateKeyOf } from "./dayViewTime";

/** Rendered for any value the record doesn't carry. */
export const MISSING = "—";

export interface SkinTemperatureSourceRecord {
  id: string;
  source: string;
  startAt: ISODateTime;
  endAt: ISODateTime;
  baselineCelsius: number | null;
  deltas: { observedAt: ISODateTime; celsius: number }[];
  measurementLocation: number | null;
}

export interface HrvSourceReading {
  id: string;
  source: string;
  observedAt: ISODateTime;
  milliseconds: number;
}

// --- Temperature ----------------------------------------------------------

/** An absolute temperature, °C → °F. */
export const celsiusToFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;

/** A temperature *difference*, °C → °F: no +32 offset. */
export const celsiusDeltaToFahrenheit = (celsius: number) => (celsius * 9) / 5;

const twoDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signed(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${twoDecimals.format(Math.abs(rounded))} ${unit}`;
}

/** A delta, signed, to hundredths: "−0.03 °C". */
export const formatDeltaCelsius = (celsius: number) => signed(celsius, "°C");

/** The same delta in Fahrenheit degrees: "−0.05 °F". */
export const formatDeltaFahrenheit = (celsius: number) =>
  signed(celsiusDeltaToFahrenheit(celsius), "°F");

/** An absolute reading in °C, or "—" when absent: "41.61 °C". */
export function formatCelsius(celsius: number | null): string {
  return celsius === null ? MISSING : `${twoDecimals.format(celsius)} °C`;
}

/** An absolute reading converted to °F, or "—" when absent: "106.90 °F". */
export function formatFahrenheit(celsius: number | null): string {
  return celsius === null
    ? MISSING
    : `${twoDecimals.format(celsiusToFahrenheit(celsius))} °F`;
}

/**
 * Health Connect `SkinTemperatureRecord` measurement-location constants
 * (`SkinTemperatureMeasurementLocation` in react-native-health-connect).
 */
const MEASUREMENT_LOCATIONS: Record<number, string> = {
  0: "Unknown",
  1: "Finger",
  2: "Toe",
  3: "Wrist",
};

/** "0 · Unknown", "3 · Wrist"; a number outside the constants is still shown. */
export function formatMeasurementLocation(location: number | null): string {
  if (location === null) return MISSING;
  const label = MEASUREMENT_LOCATIONS[location] ?? "not a Health Connect value";
  return `${location} · ${label}`;
}

// --- Time -----------------------------------------------------------------

const clockFormatters = new Map<string, Intl.DateTimeFormat>();

/** Local clock time with minutes always shown: "7:00 AM", "11:15 PM". */
export function formatClock(instant: ISODateTime, timeZone: string): string {
  let formatter = clockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    clockFormatters.set(timeZone, formatter);
  }
  // ICU separates "AM" with a narrow no-break space; normalize it.
  return formatter.format(new Date(instant)).replace(/\s/g, " ");
}

/** Whole minutes between two instants as "7 h 23 min" / "45 min". */
export function formatDuration(startAt: ISODateTime, endAt: ISODateTime) {
  const minutes = Math.round(
    (Date.parse(endAt) - Date.parse(startAt)) / 60_000,
  );
  if (!Number.isFinite(minutes)) return MISSING;
  const sign = minutes < 0 ? "−" : "";
  const total = Math.abs(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${sign}${rest} min`;
  return `${sign}${hours} h ${rest} min`;
}

// --- Skin temperature -----------------------------------------------------

export interface SkinTemperatureRow {
  record: SkinTemperatureSourceRecord;
  /** Local calendar date the record ends on (the wake date). */
  night: DateKey;
  start: string;
  end: string;
  duration: string;
  deltas: {
    observedAt: ISODateTime;
    time: string;
    celsius: string;
    fahrenheit: string;
  }[];
  baselineCelsius: string;
  baselineFahrenheit: string;
  measurementLocation: string;
}

/** Every record, newest first, with each field formatted for the table. */
export function skinTemperatureRows(
  records: SkinTemperatureSourceRecord[],
  timeZone: string,
): SkinTemperatureRow[] {
  return [...records]
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
    .map((record) => ({
      record,
      night: dateKeyOf(record.endAt, timeZone),
      start: formatClock(record.startAt, timeZone),
      end: formatClock(record.endAt, timeZone),
      duration: formatDuration(record.startAt, record.endAt),
      deltas: [...record.deltas]
        .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
        .map((delta) => ({
          observedAt: delta.observedAt,
          time: formatClock(delta.observedAt, timeZone),
          celsius: formatDeltaCelsius(delta.celsius),
          fahrenheit: formatDeltaFahrenheit(delta.celsius),
        })),
      baselineCelsius: formatCelsius(record.baselineCelsius),
      baselineFahrenheit: formatFahrenheit(record.baselineCelsius),
      measurementLocation: formatMeasurementLocation(
        record.measurementLocation,
      ),
    }));
}

// --- HRV ------------------------------------------------------------------

const TWELVE_HOURS_MS = 12 * 60 * 60_000;

/**
 * The night a reading belongs to, named by its wake date: readings from local
 * noon on D−1 up to local noon on D belong to night D, so a night that crosses
 * midnight stays in one group.
 */
export function hrvNightOf(observedAt: ISODateTime, timeZone: string): DateKey {
  const shifted = new Date(Date.parse(observedAt) + TWELVE_HOURS_MS);
  return dateKeyOf(shifted.toISOString(), timeZone);
}

export interface HrvNight {
  night: DateKey;
  source: string;
  count: number;
  min: number;
  median: number;
  max: number;
  /** Every reading, in time order. */
  readings: { id: string; observedAt: ISODateTime; time: string; ms: number }[];
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/**
 * Groups readings by (night, source), newest night first. Every reading is
 * kept, including any 0 the backend returns for a missing value.
 */
export function groupHrvByNight(
  readings: HrvSourceReading[],
  timeZone: string,
): HrvNight[] {
  const groups = new Map<string, HrvSourceReading[]>();
  for (const reading of readings) {
    const key = `${hrvNightOf(reading.observedAt, timeZone)}\u0000${reading.source}`;
    const group = groups.get(key);
    if (group) group.push(reading);
    else groups.set(key, [reading]);
  }
  const nights = [...groups.entries()].map(([key, group]): HrvNight => {
    const [night = "", source = ""] = key.split("\u0000");
    const sorted = group.sort(
      (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
    );
    const values = sorted.map((reading) => reading.milliseconds);
    return {
      night,
      source,
      count: sorted.length,
      min: Math.min(...values),
      median: median(values),
      max: Math.max(...values),
      readings: sorted.map((reading) => ({
        id: reading.id,
        observedAt: reading.observedAt,
        time: formatClock(reading.observedAt, timeZone),
        ms: reading.milliseconds,
      })),
    };
  });
  return nights.sort((a, b) =>
    a.night === b.night
      ? a.source.localeCompare(b.source)
      : b.night.localeCompare(a.night),
  );
}

const oneDecimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

/** An RMSSD value as reported, to at most one decimal: "196.2 ms". */
export const formatMilliseconds = (ms: number) => `${oneDecimal.format(ms)} ms`;

/** The /hrv source-records window, from `?records=`. */
export type HrvRecordsWindow = "30" | "90" | "all";

export const HRV_RECORDS_WINDOWS: { value: HrvRecordsWindow; label: string }[] =
  [
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
    { value: "all", label: "All" },
  ];

export function parseHrvRecordsWindow(
  value: string | undefined,
): HrvRecordsWindow {
  return value === "90" || value === "all" ? value : "30";
}

/** The query's `TimeRange` for a window, or null for all history. */
export function hrvRecordsRange(
  window: HrvRecordsWindow,
  now: Date,
): { start: ISODateTime; endExclusive: ISODateTime } | null {
  if (window === "all") return null;
  const days = Number(window);
  // One extra hour of headroom past `now` so a just-uploaded reading is kept.
  return {
    start: new Date(now.getTime() - days * 24 * 60 * 60_000).toISOString(),
    endExclusive: new Date(now.getTime() + 60 * 60_000).toISOString(),
  };
}
