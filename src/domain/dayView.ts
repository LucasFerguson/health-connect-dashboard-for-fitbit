import type { DateKey, ISODateTime, SleepStageKind } from "./health";

/**
 * View model for the `/day` screen: exactly what `components/day-view` reads,
 * already translated out of the GraphQL schema's SCREAMING_CASE enums by
 * `server/health/adapters/dayAdapter.ts`.
 *
 * Why a hand-written view model rather than the generated `DayPageQuery`
 * type: the components predate GraphQL and were written against the REST
 * `health-day-v1` contract's lowercase vocabulary, and a few fields the UI
 * needs don't exist in GraphQL as-is (`availabilityNotes`, the full 15-day
 * strip, usable zone thresholds). The adapter is the one place that knows
 * about both sides; everything here is plain data, safe to import from
 * client components.
 *
 * Nullable, never defaulted: every `value` stays `null` when the backend has
 * no number, so a missing health value can't be rendered as a zero.
 */

/**
 * Every metric status the backend can emit, lowercased.
 *
 * The first six are the REST contract's original set. GraphQL adds two:
 *
 * - `unavailable` is what the strain engine reports when it has no zone
 *   calibration at all. It's kept distinct rather than folded into `missing`
 *   or `blocked` because it means "can't be computed for this account", which
 *   is neither "no data recorded today" nor "waiting on another metric".
 * - `sample_time_only` is the `timeline.now` marker's "we know when the last
 *   sample was observed, but not how late it arrived". Nothing on the day
 *   view currently reads it, but it's representable so a total mapping from
 *   the schema's enum is possible.
 *
 * Both count as NOT displayable (`isDisplayableStatus`), so neither can let a
 * null value through as a number.
 */
export type MetricStatus =
  | "available"
  | "partial"
  | "missing"
  | "insufficient_data"
  | "not_implemented"
  | "blocked"
  | "unavailable"
  | "sample_time_only";

/** `future` is after "today" in the account's home time zone; everything
 * else, including a past date with no data, is `recorded`. */
export type DayState = "recorded" | "future";

/** A metric that only ever renders as a status plus the backend's own
 * explanation (e.g. `timeline.schedule`). */
export interface StatusNote {
  status: MetricStatus;
  note: string | null;
}

export interface NumericMetric extends StatusNote {
  value: number | null;
}

export interface SleepStageMinutes {
  deep: number;
  light: number;
  rem: number;
  asleep: number;
  awake: number;
  unknown: number;
}

export interface SleepDurationMetric extends NumericMetric {
  window: { startAt: ISODateTime; endAt: ISODateTime } | null;
  stageMinutes: SleepStageMinutes | null;
}

/** Personal heart-rate zone thresholds (bpm, ascending). `thresholds` is
 * null whenever `status` isn't displayable. */
export interface HeartRateZonesMetric extends StatusNote {
  thresholds: number[] | null;
  /** The backend has calibrated zones for this day, whether or not the
   * thresholds reached us. */
  calibrated: boolean;
}

export interface HeartRateHour {
  hour: number;
  status: MetricStatus;
  sampleCount: number;
  min: number | null;
  p25: number | null;
  mean: number | null;
  p75: number | null;
  max: number | null;
}

export interface HeartRateTimeline extends StatusNote {
  hours: HeartRateHour[];
}

export interface SleepStageSegment {
  startAt: ISODateTime;
  endAt: ISODateTime;
  kind: SleepStageKind;
}

/** A workout/exercise session on the timeline. */
export interface WorkoutSpan {
  startAt: ISODateTime;
  endAt: ISODateTime;
  /** Human-readable activity name, e.g. "Running". */
  label: string;
}

export interface StepsHour {
  hour: number;
  count: number;
  status: MetricStatus;
}

/** One non-displayable metric, by its dotted path in the day payload (e.g.
 * `headlineScores.recovery`), with the backend's explanation. */
export interface AvailabilityNote extends StatusNote {
  field: string;
}

export interface HealthDay {
  date: DateKey;
  dayState: DayState;
  timeZone: string;
  headlineScores: {
    sleepDuration: SleepDurationMetric;
    sleepNeed: NumericMetric;
    recovery: NumericMetric;
    strain: NumericMetric;
    strainTarget: NumericMetric;
  };
  supportingMetrics: {
    hrv: NumericMetric;
    restingHeartRate: NumericMetric;
    respiratoryRate: NumericMetric;
    oxygenSaturation: NumericMetric;
    skinTemperatureDeviation: NumericMetric;
    steps: NumericMetric;
    calories: NumericMetric;
    zone3AndAbove: NumericMetric;
  };
  heartRateZones: HeartRateZonesMetric;
  timeline: {
    heartRate: HeartRateTimeline;
    sleepStages: SleepStageSegment[];
    steps: StepsHour[];
    /** Workouts overlapping this day. Optional because the GraphQL day
     * query doesn't select `timeline.workouts` yet, so `dayAdapter.ts`
     * doesn't fill it; absent means "unknown", not "no workouts". */
    workouts?: WorkoutSpan[];
    schedule: StatusNote;
    targetWakeTime: StatusNote;
    targetBedTime: StatusNote;
  };
  /** Every non-displayable metric, in the order the REST contract listed
   * them; the SIGNALS panel shows the first one's note. */
  availabilityNotes: AvailabilityNote[];
}

/** One day-strip cell. `sleepDuration`/`strain` are null when the backend has
 * no stored analytics for that date at all (so the cell draws no bars). */
export interface NearbyDay {
  date: DateKey;
  dayState: DayState;
  sleepDuration: NumericMetricValue | null;
  strain: NumericMetricValue | null;
}

export interface NumericMetricValue {
  status: MetricStatus;
  value: number | null;
}

export interface DayViewData {
  day: HealthDay;
  /** Always the full window around `day.date`, oldest first, focused day
   * included. */
  nearbyDays: NearbyDay[];
}

// ---------------------------------------------------------------------------
// Phone sync heartbeat (`/api/sync-status`)
// ---------------------------------------------------------------------------

export type SyncStatusState = "receiving" | "idle" | "never_observed";

/** JSON body of `GET /api/sync-status`. Its shape predates GraphQL (it was
 * the REST `/api/v2/sync/status` body) and is kept so the nav and the Docker
 * HEALTHCHECK don't have to change with the backend. */
export interface SyncStatus {
  observedActive: boolean;
  state: SyncStatusState;
  lastUploadAt: ISODateTime | null;
  activeUntil: ISODateTime | null;
  secondsSinceLastUpload: number | null;
  lastRecordType: string | null;
  lastRecordCount: number | null;
  totalUploadRequests: number;
  totalRecordsReceived: number;
  activityWindowSeconds: number;
  note: string;
}
