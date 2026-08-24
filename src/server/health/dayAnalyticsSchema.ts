import { z } from "zod";

/**
 * Zod schema for the `health-day-v1` frontend contract served by
 * `GET /api/v2/analytics/day` on the HCGateway analytics API (see
 * `/root/HCGateway/doc/frontend-data-model.md` and
 * `/root/HCGateway/api/analytics_engine/day_dashboard.py`, the Python
 * source of truth this schema was modeled against, cross-checked with
 * several live responses).
 *
 * The shape is dominated by one recurring pattern (the Python `_metric()`
 * helper): a leaf object with `status`, `value`, `unit`, `source`,
 * `qualityFlags`, an optional `note`, and sometimes extra fields layered on
 * top. We model that as a base schema plus `.extend()`s rather than
 * repeating the five common fields everywhere.
 *
 * A few shape notes confirmed against live data (see task report for the
 * full list):
 * - `note` is omitted entirely (not `null`) when the Python side has no
 *   note to attach (`_metric` only sets the key `if note:`). It is
 *   therefore modeled as `.optional()` (may be absent) *and* `.nullable()`
 *   (a couple of hand-built objects, e.g. `timeline.heartRate` and
 *   `timeline.now`, do send an explicit `note: null`).
 * - Every other field on a metric object (`value`, `unit`, `source`) is
 *   always present but frequently `null`, matching this API's convention
 *   of explicit `null` over omission.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Confirmed against the Python source: `_metric()` status values used across
 * headline scores, supporting metrics, and misc timeline placeholders. */
export const metricStatusSchema = z.enum([
  "available",
  "partial",
  "missing",
  "insufficient_data",
  "not_implemented",
  "blocked",
]);
export type MetricStatus = z.infer<typeof metricStatusSchema>;

/** Base shape shared by every `_metric()`-built object. */
const baseMetricSchema = z.object({
  status: metricStatusSchema,
  value: z.unknown().nullable(),
  unit: z.string().nullable(),
  source: z.string().nullable(),
  qualityFlags: z.array(z.string()),
  note: z.string().nullable().optional(),
});

/** Generic metric with a typed `value`, no extra fields. */
function metric<V extends z.ZodTypeAny>(valueSchema: V) {
  return baseMetricSchema.extend({ value: valueSchema.nullable() });
}

const numericMetricSchema = metric(z.number());
export type NumericMetric = z.infer<typeof numericMetricSchema>;

const stringMetricSchema = metric(z.string());
export type StringMetric = z.infer<typeof stringMetricSchema>;

/** `heartRateZones` value is an array of six increasing bpm thresholds when
 * available (`calibration.get("thresholds")`), otherwise `null`. */
const heartRateZonesMetricSchema = baseMetricSchema.extend({
  value: z.array(z.number()).nullable(),
  testDate: z.string().nullable().optional(),
});
export type HeartRateZonesMetric = z.infer<typeof heartRateZonesMetricSchema>;

// ---------------------------------------------------------------------------
// headlineScores
// ---------------------------------------------------------------------------

const sleepStageMinutesSchema = z.object({
  deep: z.number(),
  light: z.number(),
  rem: z.number(),
  asleep: z.number(),
  awake: z.number(),
  unknown: z.number(),
});
export type SleepStageMinutes = z.infer<typeof sleepStageMinutesSchema>;

const sleepWindowSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
});

/** `headlineScores.sleepDuration` — extends the numeric metric with the
 * sleep window, per-stage minute totals, and event/recording counts. Only
 * present with these extra fields when `status: "available"`; when missing,
 * these keys are absent (Python only calls `.update(details)` on the
 * available branch), so all extras are optional. */
const sleepDurationMetricSchema = numericMetricSchema.extend({
  window: sleepWindowSchema.optional(),
  stageMinutes: sleepStageMinutesSchema.optional(),
  eventCount: z.number().int().optional(),
  recordingCount: z.number().int().optional(),
});
export type SleepDurationMetric = z.infer<typeof sleepDurationMetricSchema>;

/** `headlineScores.sleepNeed` — fixed-target percentage, always `status:
 * "partial"` when available per the Python source. Extra fields present
 * only when available. */
const sleepNeedMetricSchema = numericMetricSchema.extend({
  targetMinutes: z.number().optional(),
  debtMinutes: z.number().optional(),
});
export type SleepNeedMetric = z.infer<typeof sleepNeedMetricSchema>;

/** `headlineScores.strain` — experimental cardiovascular strain. Carries a
 * `quality` object and `modelVersion` when a strain result exists for the
 * day; on this account's live data strain was always `status: "missing"`,
 * so the extra fields below are modeled directly from the Python source
 * (`day_dashboard.py` ~line 274) rather than observed live. */
const strainQualitySchema = z
  .object({
    reasons: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

const strainMetricSchema = numericMetricSchema.extend({
  modelVersion: z.string().nullable().optional(),
  quality: strainQualitySchema.optional(),
});
export type StrainMetric = z.infer<typeof strainMetricSchema>;

const headlineScoresSchema = z.object({
  recovery: numericMetricSchema,
  sleepDuration: sleepDurationMetricSchema,
  sleepNeed: sleepNeedMetricSchema,
  strain: strainMetricSchema,
  strainTarget: numericMetricSchema,
});
export type HeadlineScores = z.infer<typeof headlineScoresSchema>;

// ---------------------------------------------------------------------------
// supportingMetrics
// ---------------------------------------------------------------------------

/** Some supporting metrics (steps, calories, restingHeartRate) additionally
 * carry `sampleCount` (from `_daily_point`) when available; confirmed absent
 * on the `missing` branch. */
const supportingMetricWithSampleCountSchema = numericMetricSchema.extend({
  sampleCount: z.number().int().optional(),
});

const supportingMetricsSchema = z.object({
  hrv: numericMetricSchema,
  restingHeartRate: numericMetricSchema,
  respiratoryRate: supportingMetricWithSampleCountSchema,
  skinTemperatureDeviation: numericMetricSchema,
  steps: numericMetricSchema,
  calories: numericMetricSchema,
  zone3AndAbove: numericMetricSchema,
  /**
   * Absent (not merely `null`) on days that fall back to the Python
   * `empty_day()` template (`dayState: "future"`, or any date with no
   * prepared row) — confirmed live on 2026-08-24 and 2026-08-30, both of
   * which omit this key entirely from `supportingMetrics`. `empty_day()`
   * simply never seeds it; only `build_day_views()` (which runs for dates
   * that have raw data) adds it via `_daily_point`. Modeled as optional
   * rather than assumed-present so we don't reject a real payload shape.
   */
  oxygenSaturation: supportingMetricWithSampleCountSchema.optional(),
});
export type SupportingMetrics = z.infer<typeof supportingMetricsSchema>;

// ---------------------------------------------------------------------------
// timeline
// ---------------------------------------------------------------------------

const heartRateHourSchema = z.object({
  hour: z.number().int().min(0).max(23),
  status: z.enum(["available", "missing"]),
  sampleCount: z.number().int(),
  min: z.number().nullable(),
  p25: z.number().nullable(),
  mean: z.number().nullable(),
  p75: z.number().nullable(),
  max: z.number().nullable(),
});
export type HeartRateHour = z.infer<typeof heartRateHourSchema>;

/** `timeline.heartRate` is hand-built in `_hourly_heart_rate`, not via
 * `_metric()` — it always sends an explicit `note` key (string or `null`),
 * never omits it. */
const heartRateTimelineSchema = z.object({
  status: z.enum(["available", "missing"]),
  source: z.string().nullable(),
  sampleCount: z.number().int(),
  observedMinuteCount: z.number().int(),
  hours: z.array(heartRateHourSchema),
  note: z.string().nullable(),
});
export type HeartRateTimeline = z.infer<typeof heartRateTimelineSchema>;

const sleepStageSegmentSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  kind: z.enum(["deep", "light", "rem", "asleep", "awake", "unknown"]),
  sessionId: z.string(),
  source: z.string(),
});
export type SleepStageSegment = z.infer<typeof sleepStageSegmentSchema>;

const stepsHourSchema = z.object({
  hour: z.number().int().min(0).max(23),
  count: z.number(),
  status: z.enum(["available", "missing"]),
});
export type StepsHour = z.infer<typeof stepsHourSchema>;

const workoutSchema = z.object({
  id: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  type: z.number().int(),
  typeLabel: z.string(),
  source: z.string(),
  strainContribution: z.number().nullable(),
  strainQuality: z.unknown().nullable(),
});
export type Workout = z.infer<typeof workoutSchema>;

/** Strain timeline entries (`timeline.strain`) come straight from the
 * strain engine's per-day `timeline` list; the day-dashboard layer treats
 * them as opaque, so we do the same rather than guessing an internal shape
 * we have never observed populated. */
const strainTimelinePointSchema = z.record(z.string(), z.unknown());

/** `timeline.now` is hand-built (not `_metric()`); status is either
 * `"sample_time_only"` (a real observation exists) or `"missing"` (no
 * observations at all for the day), confirmed against live responses. */
const nowSchema = z.object({
  status: z.enum(["sample_time_only", "missing"]),
  latestObservedAt: z.string().nullable(),
  note: z.string().nullable(),
});
export type NowTimeline = z.infer<typeof nowSchema>;

const timelineSchema = z.object({
  heartRate: heartRateTimelineSchema,
  strain: z.array(strainTimelinePointSchema),
  sleepStages: z.array(sleepStageSegmentSchema),
  steps: z.array(stepsHourSchema),
  workouts: z.array(workoutSchema),
  schedule: stringMetricSchema,
  targetWakeTime: stringMetricSchema,
  targetBedTime: stringMetricSchema,
  now: nowSchema,
});
export type Timeline = z.infer<typeof timelineSchema>;

// ---------------------------------------------------------------------------
// day / availabilityNotes / notes
// ---------------------------------------------------------------------------

/** Confirmed values: `"recorded"` (past or today with a prepared row) and
 * `"future"` (requested date is after today in the home time zone). The
 * Python `empty_day()` only ever assigns one of these two; there is no
 * observed or documented third state, but treat unknown strings
 * permissively via a plain string fallback would hide bugs, so we enumerate
 * the two known values. */
export const dayStateSchema = z.enum(["recorded", "future"]);
export type DayState = z.infer<typeof dayStateSchema>;

const availabilityNoteSchema = z.object({
  field: z.string(),
  status: metricStatusSchema.nullable(),
  note: z.string().nullable().optional(),
});
export type AvailabilityNote = z.infer<typeof availabilityNoteSchema>;

const dayNoteSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type DayNote = z.infer<typeof dayNoteSchema>;

export const healthDaySchema = z.object({
  contractVersion: z.literal("health-day-v1"),
  date: z.string(),
  dayState: dayStateSchema,
  timeZone: z.string(),
  generatedAt: z.string().nullable(),
  headlineScores: headlineScoresSchema,
  heartRateZones: heartRateZonesMetricSchema,
  supportingMetrics: supportingMetricsSchema,
  timeline: timelineSchema,
  availabilityNotes: z.array(availabilityNoteSchema),
  notes: z.array(dayNoteSchema),
});
export type HealthDay = z.infer<typeof healthDaySchema>;

// ---------------------------------------------------------------------------
// nearbyDays
// ---------------------------------------------------------------------------

/** Lower-resolution per-day summary. Confirmed live: exactly `date`,
 * `dayState`, `recovery`, `sleepDuration`, `sleepNeed`, `strain` — nothing
 * else — matching `routes.py`'s `nearby` list comprehension. */
export const nearbyDaySchema = z.object({
  date: z.string(),
  dayState: dayStateSchema,
  recovery: numericMetricSchema,
  sleepDuration: sleepDurationMetricSchema,
  sleepNeed: sleepNeedMetricSchema,
  strain: strainMetricSchema,
});
export type NearbyDay = z.infer<typeof nearbyDaySchema>;

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export const healthDayResponseSchema = z.object({
  contractVersion: z.literal("health-day-v1"),
  day: healthDaySchema,
  nearbyDays: z.array(nearbyDaySchema),
  runId: z.string(),
});
export type HealthDayResponse = z.infer<typeof healthDayResponseSchema>;

// ---------------------------------------------------------------------------
// GET /api/v2/sync/status
// ---------------------------------------------------------------------------

export const syncStatusStateSchema = z.enum([
  "receiving",
  "idle",
  "never_observed",
]);
export type SyncStatusState = z.infer<typeof syncStatusStateSchema>;

export const syncStatusResponseSchema = z.object({
  observedActive: z.boolean(),
  state: syncStatusStateSchema,
  lastUploadAt: z.string().nullable(),
  activeUntil: z.string().nullable(),
  secondsSinceLastUpload: z.number().int().nullable(),
  lastRecordType: z.string().nullable(),
  lastRecordCount: z.number().int().nullable(),
  totalUploadRequests: z.number().int(),
  totalRecordsReceived: z.number().int(),
  activityWindowSeconds: z.number().int(),
  note: z.string(),
});
export type SyncStatusResponse = z.infer<typeof syncStatusResponseSchema>;
