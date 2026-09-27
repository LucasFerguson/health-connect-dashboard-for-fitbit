/**
 * Maps the `DayPage` GraphQL query onto the day view's model
 * (`~/domain/dayView`).
 *
 * Mostly a mechanical translation: live GraphQL and the retired REST
 * `health-day-v1` endpoint agree field for field apart from enum casing
 * (checked on an empty past day, today, a future day and a data-rich day).
 * Three things need real work, each explained where it happens:
 *
 * - the day strip, because `days(range:)` omits dates without stored data;
 * - `availabilityNotes`, which GraphQL doesn't serve and is derived here;
 * - heart-rate zones, whose thresholds GraphQL doesn't expose.
 *
 * Pure (no fetching, `now` passed in) so it's unit-testable against synthetic
 * payloads; see `dayAdapter.test.ts`.
 */
import type {
  DayPageQuery,
  DayState as GraphQLDayState,
  MetricStatus as GraphQLMetricStatus,
  SleepStageKind as GraphQLSleepStageKind,
} from "~/types/__generated__/graphql";
import type {
  AvailabilityNote,
  DayState,
  DayViewData,
  HealthDay,
  HeartRateZonesMetric,
  MetricStatus,
  NearbyDay,
  NumericMetric,
  NumericMetricValue,
  StatusNote,
} from "~/domain/dayView";
import type { DateKey, SleepStageKind } from "~/domain/health";
import { dateKeyOf } from "~/domain/dayViewTime";

type Analytics = DayPageQuery["viewer"]["analytics"];
type GraphQLDay = NonNullable<Analytics["day"]>;
type GraphQLStripDay = Analytics["days"][number];

/** Days either side of the focused date in the strip: 7 + 1 + 7 = 15 cells,
 * the same window REST's `radius=7` produced. */
export const DAY_STRIP_RADIUS = 7;

/**
 * The `TimeRange` to pass to `days(range:)` for `date`'s strip.
 *
 * UTC midnights, not local ones: the resolver tests each stored day's
 * *calendar date* read as UTC midnight against `[start, endExclusive)`, so
 * local-time bounds would drop or add a day at the edges depending on the
 * home zone's offset.
 */
export function dayStripRange(date: DateKey): {
  start: string;
  endExclusive: string;
} {
  return {
    start: `${shiftDate(date, -DAY_STRIP_RADIUS)}T00:00:00Z`,
    endExclusive: `${shiftDate(date, DAY_STRIP_RADIUS + 1)}T00:00:00Z`,
  };
}

// ---------------------------------------------------------------------------
// Enum translation. Total `Record`s, so a value added to the schema is a
// compile error here instead of an unmapped string reaching the UI.
// ---------------------------------------------------------------------------

const metricStatusByEnum: Record<GraphQLMetricStatus, MetricStatus> = {
  AVAILABLE: "available",
  PARTIAL: "partial",
  MISSING: "missing",
  INSUFFICIENT_DATA: "insufficient_data",
  NOT_IMPLEMENTED: "not_implemented",
  BLOCKED: "blocked",
  // See `MetricStatus` in `~/domain/dayView` for why these two are kept
  // rather than folded into one of the six above.
  UNAVAILABLE: "unavailable",
  SAMPLE_TIME_ONLY: "sample_time_only",
};

const dayStateByEnum: Record<GraphQLDayState, DayState> = {
  RECORDED: "recorded",
  FUTURE: "future",
};

const sleepStageKindByEnum: Record<GraphQLSleepStageKind, SleepStageKind> = {
  AWAKE: "awake",
  LIGHT: "light",
  DEEP: "deep",
  REM: "rem",
  ASLEEP: "asleep",
  UNKNOWN: "unknown",
};

/**
 * Shown on TIME IN ZONE when the backend says zones ARE calibrated. REST sent
 * the six bpm thresholds as `heartRateZones.value`; GraphQL types that field
 * as a single `Float` and returns null while still reporting AVAILABLE. The
 * panel can't draw zones without thresholds, and an AVAILABLE status with no
 * value would otherwise fall through to a generic "not available" message
 * that hides the real reason.
 */
export const ZONE_THRESHOLDS_NOT_EXPOSED_NOTE =
  "Heart-rate zones are calibrated, but the zone thresholds aren't exposed by HCGateway's GraphQL API yet.";

function status(value: GraphQLMetricStatus): MetricStatus {
  return metricStatusByEnum[value];
}

function statusNote(metric: {
  status: GraphQLMetricStatus;
  note: string | null;
}): StatusNote {
  return { status: status(metric.status), note: metric.note };
}

function numeric(metric: {
  status: GraphQLMetricStatus;
  value: number | null;
  note: string | null;
}): NumericMetric {
  return { ...statusNote(metric), value: metric.value };
}

function isDisplayable(value: MetricStatus): boolean {
  return value === "available" || value === "partial";
}

// ---------------------------------------------------------------------------
// Focused day
// ---------------------------------------------------------------------------

function heartRateZones(
  zones: GraphQLDay["heartRateZones"],
): HeartRateZonesMetric {
  const zoneStatus = status(zones.status);
  if (isDisplayable(zoneStatus)) {
    // Forced to missing: see ZONE_THRESHOLDS_NOT_EXPOSED_NOTE.
    return {
      status: "missing",
      note: ZONE_THRESHOLDS_NOT_EXPOSED_NOTE,
      thresholds: null,
      calibrated: true,
    };
  }
  // Not calibrated: the backend's own status and note are already accurate.
  return {
    status: zoneStatus,
    note: zones.note,
    thresholds: null,
    calibrated: false,
  };
}

/**
 * Rebuilds REST's `availabilityNotes`, which GraphQL doesn't serve: every
 * metric that isn't displayable, as `{ field, status, note }`.
 *
 * The order is REST's (`availability_notes()` in HCGateway's
 * `apiVersions/v2/routes.py`) — headline scores, then supporting metrics,
 * then the plan metrics, then heart-rate zones — because SIGNALS shows only
 * the first entry, so a different order would change what the panel says.
 * REST substituted "Data is unavailable." for a missing note; this keeps the
 * null instead, so the panel falls back to its own empty-state copy rather
 * than presenting a made-up explanation as the backend's.
 */
function availabilityNotes(
  day: Omit<HealthDay, "availabilityNotes">,
): AvailabilityNote[] {
  const entries: [string, StatusNote][] = [
    ...Object.entries(day.headlineScores).map(
      ([field, metric]): [string, StatusNote] => [
        `headlineScores.${field}`,
        metric,
      ],
    ),
    ...Object.entries(day.supportingMetrics).map(
      ([field, metric]): [string, StatusNote] => [
        `supportingMetrics.${field}`,
        metric,
      ],
    ),
    ["timeline.schedule", day.timeline.schedule],
    ["timeline.targetWakeTime", day.timeline.targetWakeTime],
    ["timeline.targetBedTime", day.timeline.targetBedTime],
    ["heartRateZones", day.heartRateZones],
  ];
  return entries
    .filter(([, metric]) => !isDisplayable(metric.status))
    .map(([field, metric]) => ({
      field,
      status: metric.status,
      note: metric.note,
    }));
}

/** Maps `day(date:)`. Object keys are built in REST's order on purpose:
 * `availabilityNotes` walks them with `Object.entries`. */
export function adaptHealthDay(day: GraphQLDay): HealthDay {
  const { headlineScores: headline, supportingMetrics: supporting } = day;
  const { timeline } = day;
  const withoutNotes: Omit<HealthDay, "availabilityNotes"> = {
    date: day.date,
    dayState: dayStateByEnum[day.dayState],
    timeZone: day.timeZone,
    headlineScores: {
      sleepDuration: {
        ...numeric(headline.sleepDuration),
        window: headline.sleepDuration.window,
        stageMinutes: headline.sleepDuration.stageMinutes,
      },
      sleepNeed: numeric(headline.sleepNeed),
      recovery: numeric(headline.recovery),
      strain: numeric(headline.strain),
      strainTarget: numeric(headline.strainTarget),
    },
    supportingMetrics: {
      hrv: numeric(supporting.hrv),
      restingHeartRate: numeric(supporting.restingHeartRate),
      respiratoryRate: numeric(supporting.respiratoryRate),
      oxygenSaturation: numeric(supporting.oxygenSaturation),
      skinTemperatureDeviation: numeric(supporting.skinTemperatureDeviation),
      steps: numeric(supporting.steps),
      calories: numeric(supporting.calories),
      zone3AndAbove: numeric(supporting.zone3AndAbove),
    },
    heartRateZones: heartRateZones(day.heartRateZones),
    timeline: {
      heartRate: {
        ...statusNote(timeline.heartRate),
        hours: timeline.heartRate.hours.map((hour) => ({
          hour: hour.hour,
          status: status(hour.status),
          sampleCount: hour.sampleCount,
          min: hour.min,
          p25: hour.p25,
          mean: hour.mean,
          p75: hour.p75,
          max: hour.max,
        })),
      },
      sleepStages: timeline.sleepStages.map((segment) => ({
        startAt: segment.startAt,
        endAt: segment.endAt,
        kind: sleepStageKindByEnum[segment.kind],
      })),
      steps: timeline.steps.map((hour) => ({
        hour: hour.hour,
        count: hour.count,
        status: status(hour.status),
      })),
      schedule: statusNote(timeline.schedule),
      targetWakeTime: statusNote(timeline.targetWakeTime),
      targetBedTime: statusNote(timeline.targetBedTime),
    },
  };
  return {
    ...withoutNotes,
    availabilityNotes: availabilityNotes(withoutNotes),
  };
}

// ---------------------------------------------------------------------------
// Day strip
// ---------------------------------------------------------------------------

function stripValue(metric: {
  status: GraphQLMetricStatus;
  value: number | null;
}): NumericMetricValue {
  return { status: status(metric.status), value: metric.value };
}

/**
 * Builds every cell of the strip around `focused.date`, oldest first.
 *
 * `days(range:)` returns only dates with stored analytics, so both empty past
 * days and every future day are simply absent. REST filled those gaps with
 * empty days; this does the same: an absent date gets null sleep/strain (no
 * bars) and a `dayState` computed against "today" in the account's home
 * zone, which is how the backend itself decides `future`. The focused cell
 * reuses the focused day's own payload so the strip can't disagree with the
 * page below it.
 */
export function buildNearbyDays(
  focused: HealthDay,
  stripDays: GraphQLStripDay[],
  today: DateKey,
): NearbyDay[] {
  const byDate = new Map(stripDays.map((day) => [day.date, day]));
  const cells: NearbyDay[] = [];
  for (let offset = -DAY_STRIP_RADIUS; offset <= DAY_STRIP_RADIUS; offset++) {
    const date = shiftDate(focused.date, offset);
    if (date === focused.date) {
      cells.push({
        date,
        dayState: focused.dayState,
        sleepDuration: focused.headlineScores.sleepDuration,
        strain: focused.headlineScores.strain,
      });
      continue;
    }
    const stored = byDate.get(date);
    cells.push(
      stored
        ? {
            date,
            dayState: dayStateByEnum[stored.dayState],
            sleepDuration: stripValue(stored.headlineScores.sleepDuration),
            strain: stripValue(stored.headlineScores.strain),
          }
        : {
            date,
            dayState: date > today ? "future" : "recorded",
            sleepDuration: null,
            strain: null,
          },
    );
  }
  return cells;
}

/**
 * The whole `/day/[date]` model. Throws if the backend returns no `day`: its
 * resolver synthesizes an empty day for any date without data, so null means
 * something is genuinely wrong, and an empty page would misreport it as "no
 * health data".
 */
export function adaptDayView(analytics: Analytics, now: Date): DayViewData {
  if (!analytics.day) {
    throw new Error("analytics.day(date:) returned null");
  }
  const day = adaptHealthDay(analytics.day);
  const today = dateKeyOf(now.toISOString(), analytics.timeZone);
  return { day, nearbyDays: buildNearbyDays(day, analytics.days, today) };
}

/** Calendar arithmetic on `YYYY-MM-DD` keys, done in UTC so DST never adds or
 * drops a day. */
function shiftDate(date: DateKey, days: number): DateKey {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
