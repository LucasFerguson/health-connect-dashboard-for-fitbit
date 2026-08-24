import type {
  HeartRateHour,
  MetricStatus,
  NearbyDay,
  SyncStatusResponse,
} from "~/server/health/dayAnalyticsSchema";

/**
 * Pure presentation helpers for the `/day` view's `health-day-v1` contract.
 * Kept dependency-free (no React, no fetching) so they're easy to unit test
 * and reuse across components — every function here maps API-shaped data to
 * a display-ready value without inventing any new copy: absence messaging
 * always comes from the metric's own `note`, per the migration spec's
 * requirement that we never fabricate explanation strings.
 */

/** True when a metric's status means "there is a real value to render".
 * `partial` still carries a real (if caveated) value — e.g. sleepNeed is
 * always `partial` by design — so it counts as displayable; everything else
 * (`missing`, `insufficient_data`, `not_implemented`, `blocked`) must never
 * be rendered as a numeric zero. */
export function isDisplayableStatus(status: MetricStatus): boolean {
  return status === "available" || status === "partial";
}

/** The em-dash placeholder used everywhere a metric isn't displayable,
 * matching the existing component convention (`SleepPillarCard`,
 * `PlaceholderPillarCard`) rather than a numeric zero. */
export const ABSENT_VALUE_DISPLAY = "—";

/** Resolves the explanatory string for an unavailable metric: the API's own
 * `note` when present, otherwise a generic status label — never a
 * hand-authored explanation, per the migration spec. */
export function absenceReason(
  status: MetricStatus,
  note: string | null | undefined,
): string {
  if (note) return note;
  switch (status) {
    case "missing":
      return "No data recorded.";
    case "insufficient_data":
      return "Not enough data yet.";
    case "not_implemented":
      return "Not available.";
    case "blocked":
      return "Unavailable.";
    default:
      return "Not available.";
  }
}

// ---------------------------------------------------------------------------
// Heart-rate candlesticks
// ---------------------------------------------------------------------------

export interface HrCandleGeometry {
  hour: number;
  /** Wick top/bottom = min/max. */
  min: number;
  max: number;
  /** Body = interquartile range p25 -> p75. */
  p25: number;
  p75: number;
  mean: number;
  sampleCount: number;
}

/**
 * Maps `timeline.heartRate.hours[]` to candle geometry, skipping any hour
 * whose status isn't `"available"` (gap in the lane) or that is missing a
 * required numeric field despite an `available` status (defensive — the
 * schema allows `null` on every candle field).
 */
export function buildHrCandles(hours: HeartRateHour[]): HrCandleGeometry[] {
  const candles: HrCandleGeometry[] = [];
  for (const hour of hours) {
    if (hour.status !== "available") continue;
    const { min, max, p25, p75, mean } = hour;
    if (min === null || max === null || p25 === null || p75 === null) {
      continue;
    }
    candles.push({
      hour: hour.hour,
      min,
      max,
      p25,
      p75,
      mean: mean ?? (p25 + p75) / 2,
      sampleCount: hour.sampleCount,
    });
  }
  return candles;
}

/** Picks a color stop from the existing HR ramp keyed by the candle's mean
 * bpm, using the same `HR_SCALE_MIN`/`HR_SCALE_MAX` bounds the lane's axis
 * uses so the color and the vertical position agree. */
export function hrRampColorForMean(
  mean: number,
  ramp: readonly string[],
  scaleMin: number,
  scaleMax: number,
): string {
  const clamped = Math.min(scaleMax, Math.max(scaleMin, mean));
  const fraction = (clamped - scaleMin) / (scaleMax - scaleMin);
  const index = Math.min(ramp.length - 1, Math.floor(fraction * ramp.length));
  return ramp[index]!;
}

// ---------------------------------------------------------------------------
// Day strip
// ---------------------------------------------------------------------------

export interface DayStripCellData {
  date: string;
  isFuture: boolean;
  isSelected: boolean;
  /** Sleep-duration fraction of the fixed reference (0-1), or null if the
   * day has no displayable sleep duration. */
  sleepFraction: number | null;
  /** Strain fraction of the 0-21 scale (0-1), or null if strain isn't
   * displayable for that day. */
  strainFraction: number | null;
}

const SLEEP_REFERENCE_MINUTES = 480;
const STRAIN_SCALE_MAX = 21;

/**
 * Builds all 15 day-strip cells (radius=7: 7 before + selected + 7 after)
 * directly from the response's `nearbyDays` array plus the focused day,
 * rather than locally synthesizing a date range — `nearbyDays` is already
 * the authoritative 15-day window the API computed.
 */
export function buildDayStripCells(
  nearbyDays: NearbyDay[],
  selectedDate: string,
): DayStripCellData[] {
  return [...nearbyDays]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const sleepValue =
        typeof day.sleepDuration.value === "number" &&
        isDisplayableStatus(day.sleepDuration.status)
          ? day.sleepDuration.value
          : null;
      const strainValue =
        typeof day.strain.value === "number" &&
        isDisplayableStatus(day.strain.status)
          ? day.strain.value
          : null;
      return {
        date: day.date,
        isFuture: day.dayState === "future",
        isSelected: day.date === selectedDate,
        sleepFraction:
          sleepValue === null
            ? null
            : Math.min(1, sleepValue / SLEEP_REFERENCE_MINUTES),
        strainFraction:
          strainValue === null
            ? null
            : Math.min(1, strainValue / STRAIN_SCALE_MAX),
      };
    });
}

// ---------------------------------------------------------------------------
// Sync status
// ---------------------------------------------------------------------------

export interface SyncStatusDisplay {
  label: string;
  /** Relative or clock-time description of the last upload, or null if
   * there has never been one. */
  detail: string | null;
}

/** Formats `lastUploadAt` (an ISO instant) as a short relative-time string
 * ("just now", "5m ago", "3h ago", "12d ago") against `now`. Falls back to
 * the plain calendar age in days beyond that. Kept intentionally simple
 * (no Intl.RelativeTimeFormat dependency injection needed) since this is
 * chrome, not a primary metric. */
export function formatRelativeTime(iso: string, now: Date): string {
  const deltaMs = now.getTime() - Date.parse(iso);
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return "just now";
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Maps a `SyncStatusResponse` to the small mono chrome label + detail text
 * shown in the menu bar. Labels are our own short chrome vocabulary (not
 * API `note` text) since requirement #4 only requires surfacing API notes
 * for *metric* unavailability explanations, not for this ambient status
 * indicator — but the underlying state enum and timestamp are always read
 * straight from the response. */
export function describeSyncStatus(
  status: SyncStatusResponse,
  now: Date,
): SyncStatusDisplay {
  const detail = status.lastUploadAt
    ? formatRelativeTime(status.lastUploadAt, now)
    : null;
  switch (status.state) {
    case "receiving":
      return { label: "RECEIVING", detail };
    case "idle":
      return { label: "IDLE", detail };
    case "never_observed":
      return { label: "NEVER SYNCED", detail: null };
    default:
      return { label: "UNKNOWN", detail };
  }
}
