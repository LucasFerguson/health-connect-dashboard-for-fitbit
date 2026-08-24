import type {
  RawHealthData,
  SleepSession,
  SleepStageKind,
} from "~/domain/health";
import type {
  HealthDay,
  HealthDayResponse,
  MetricStatus,
  NearbyDay,
  SleepStageMinutes,
} from "./dayAnalyticsSchema";

/**
 * Adapts the existing fixture/demo data path (`FixtureHealthRepository`,
 * see `src/server/health/fixtureRepository.ts`) into the same
 * `HealthDayResponse` view-model the real HCGateway `analytics/day`
 * endpoint produces, so downstream UI code can consume one type regardless
 * of source.
 *
 * The fixture only models sleep sessions (see `RawHealthData` returned by
 * `FixtureHealthRepository.getHealthData()` — steps/calories/resting-HR/
 * weight arrays are always empty there today). Everything the fixture
 * doesn't model is represented with the same honest `missing` /
 * `not_implemented` placeholders the real API uses for genuine absence —
 * this mirrors `day_dashboard.py`'s `empty_day()` template rather than
 * inventing fixture data for signals the demo path has never populated.
 */

const CONTRACT_VERSION = "health-day-v1" as const;
const FIXTURE_TIME_ZONE = "UTC";
const FIXTURE_RUN_ID = "fixture:health-day-v1";
const SLEEP_TARGET_MINUTES = 480;

function missingMetric(unit: string | null, note: string) {
  return {
    status: "missing" as MetricStatus,
    value: null,
    unit,
    source: null,
    qualityFlags: [] as string[],
    note,
  };
}

function notImplementedMetric(unit: string | null, note: string) {
  return {
    status: "not_implemented" as MetricStatus,
    value: null,
    unit,
    source: null,
    qualityFlags: [] as string[],
    note,
  };
}

function blockedMetric(unit: string | null, note: string) {
  return {
    status: "blocked" as MetricStatus,
    value: null,
    unit,
    source: null,
    qualityFlags: [] as string[],
    note,
  };
}

const stageKindToBucket: Record<SleepStageKind, keyof SleepStageMinutes> = {
  deep: "deep",
  light: "light",
  rem: "rem",
  asleep: "asleep",
  awake: "awake",
  unknown: "unknown",
};

function stageMinutesFor(session: SleepSession): SleepStageMinutes {
  const totals: SleepStageMinutes = {
    deep: 0,
    light: 0,
    rem: 0,
    asleep: 0,
    awake: 0,
    unknown: 0,
  };
  for (const stage of session.stages) {
    const minutes = Math.max(
      0,
      (Date.parse(stage.endAt) - Date.parse(stage.startAt)) / 60_000,
    );
    const bucket = stageKindToBucket[stage.kind];
    totals[bucket] = Math.round((totals[bucket] + minutes) * 10) / 10;
  }
  return totals;
}

function totalSleepMinutes(session: SleepSession): number {
  return Math.max(
    0,
    (Date.parse(session.endAt) - Date.parse(session.startAt)) / 60_000,
  );
}

/** Sleep "belongs" to the local date on which it ends, matching the real
 * engine's rule (see `frontend-data-model.md`: "Sleep belongs to the local
 * date on which it ends."). The fixture has no configured home time zone,
 * so this uses UTC calendar dates. */
function sleepEndDate(session: SleepSession): string {
  return session.endAt.slice(0, 10);
}

function buildHeadlineScores(sleepForDate: SleepSession | undefined) {
  if (!sleepForDate) {
    return {
      recovery: notImplementedMetric(
        "score_0_100",
        "Recovery requires HRV and a validated personal-baseline model; HRV is not ingested.",
      ),
      sleepDuration: missingMetric(
        "minutes",
        "No sleep ending on this date was recorded.",
      ),
      sleepNeed: missingMetric(
        "percent",
        "No sleep record is available to compare with the configured target.",
      ),
      strain: missingMetric(
        "score_0_21",
        "No usable heart-rate strain result is available for this day.",
      ),
      strainTarget: blockedMetric(
        "score_0_21",
        "A strain target depends on a trustworthy Recovery score.",
      ),
    };
  }
  const minutes = Math.round(totalSleepMinutes(sleepForDate) * 10) / 10;
  const percent =
    Math.round(Math.min(100, (minutes / SLEEP_TARGET_MINUTES) * 100) * 10) / 10;
  return {
    recovery: notImplementedMetric(
      "score_0_100",
      "Recovery requires HRV and a validated personal-baseline model; HRV is not ingested.",
    ),
    sleepDuration: {
      status: "available" as MetricStatus,
      value: minutes,
      unit: "minutes",
      source: sleepForDate.source,
      qualityFlags: [] as string[],
      window: { startAt: sleepForDate.startAt, endAt: sleepForDate.endAt },
      stageMinutes: stageMinutesFor(sleepForDate),
      eventCount: 1,
      recordingCount: 1,
    },
    sleepNeed: {
      status: "partial" as MetricStatus,
      value: percent,
      unit: "percent",
      source: "configured_fixed_target",
      qualityFlags: [] as string[],
      note: "This compares sleep with a fixed target; recent strain and debt do not yet adjust sleep need.",
      targetMinutes: SLEEP_TARGET_MINUTES,
      debtMinutes: Math.max(
        0,
        Math.round((SLEEP_TARGET_MINUTES - minutes) * 10) / 10,
      ),
    },
    strain: missingMetric(
      "score_0_21",
      "No usable heart-rate strain result is available for this day.",
    ),
    strainTarget: blockedMetric(
      "score_0_21",
      "A strain target depends on a trustworthy Recovery score.",
    ),
  };
}

function buildSupportingMetrics() {
  return {
    hrv: missingMetric(
      "ms",
      "HRV is not currently ingested from Health Connect.",
    ),
    restingHeartRate: missingMetric(
      "bpm",
      "No resting-heart-rate measurement was recorded for this day.",
    ),
    respiratoryRate: missingMetric(
      "breaths_per_minute",
      "No respiratory-rate measurement was recorded for this day.",
    ),
    skinTemperatureDeviation: missingMetric(
      "celsius_delta",
      "Skin temperature is not currently present in the database.",
    ),
    steps: missingMetric("steps", "No steps were recorded for this day."),
    calories: missingMetric(
      "kcal",
      "No calorie total was recorded for this day.",
    ),
    zone3AndAbove: missingMetric(
      "minutes",
      "Heart-rate zones are not calibrated for this day.",
    ),
    oxygenSaturation: missingMetric(
      "percent",
      "No oxygen-saturation measurement was recorded for this day.",
    ),
  };
}

function buildTimeline(sleepForDate: SleepSession | undefined) {
  const sleepStages = sleepForDate
    ? sleepForDate.stages.map((stage) => ({
        startAt: stage.startAt,
        endAt: stage.endAt,
        kind: stage.kind,
        sessionId: sleepForDate.id,
        source: sleepForDate.source,
      }))
    : [];
  return {
    heartRate: {
      status: "missing" as const,
      source: null,
      sampleCount: 0,
      observedMinuteCount: 0,
      hours: [],
      note: "No heart-rate samples were recorded for this day.",
    },
    strain: [],
    sleepStages,
    steps: [],
    workouts: [],
    schedule: notImplementedMetric(
      null,
      "No calendar, location inference, or user-declared routine source is connected.",
    ),
    targetWakeTime: missingMetric(
      "local_time",
      "No wake-time preference or phone-alarm integration exists.",
    ),
    targetBedTime: missingMetric(
      "local_time",
      "No bedtime preference exists; sleep target duration is stored separately.",
    ),
    now: sleepForDate
      ? {
          status: "sample_time_only" as const,
          latestObservedAt: sleepForDate.endAt,
          note: "This is the latest measurement time, not server receipt time; transport lag cannot be measured.",
        }
      : {
          status: "missing" as const,
          latestObservedAt: null,
          note: "Raw records do not include a server receipt timestamp, so transport lag cannot be measured.",
        },
  };
}

function availabilityNotesFor(day: Omit<HealthDay, "availabilityNotes">) {
  const notes: HealthDay["availabilityNotes"] = [];
  const headline = day.headlineScores as unknown as Record<
    string,
    { status: MetricStatus; note?: string | null }
  >;
  for (const [field, metricValue] of Object.entries(headline)) {
    if (
      metricValue.status !== "available" &&
      metricValue.status !== "partial"
    ) {
      notes.push({
        field: `headlineScores.${field}`,
        status: metricValue.status,
        note: metricValue.note ?? "Data is unavailable.",
      });
    }
  }
  const supporting = day.supportingMetrics as unknown as Record<
    string,
    { status: MetricStatus; note?: string | null }
  >;
  for (const [field, metricValue] of Object.entries(supporting)) {
    if (
      metricValue.status !== "available" &&
      metricValue.status !== "partial"
    ) {
      notes.push({
        field: `supportingMetrics.${field}`,
        status: metricValue.status,
        note: metricValue.note ?? "Data is unavailable.",
      });
    }
  }
  for (const field of [
    "schedule",
    "targetWakeTime",
    "targetBedTime",
  ] as const) {
    const value = day.timeline[field];
    if (value.status !== "available" && value.status !== "partial") {
      notes.push({
        field: `timeline.${field}`,
        status: value.status,
        note: value.note ?? "Data is unavailable.",
      });
    }
  }
  if (
    day.heartRateZones.status !== "available" &&
    day.heartRateZones.status !== "partial"
  ) {
    notes.push({
      field: "heartRateZones",
      status: day.heartRateZones.status,
      note: day.heartRateZones.note ?? "Data is unavailable.",
    });
  }
  return notes;
}

function buildDay(
  date: string,
  dayState: "recorded" | "future",
  sleepForDate: SleepSession | undefined,
): HealthDay {
  const headlineScores = buildHeadlineScores(sleepForDate);
  const base = {
    contractVersion: CONTRACT_VERSION,
    date,
    dayState,
    timeZone: FIXTURE_TIME_ZONE,
    generatedAt: dayState === "future" ? null : new Date().toISOString(),
    headlineScores,
    heartRateZones: missingMetric(
      null,
      "No personal zone thresholds or lactate-threshold test date are configured.",
    ),
    supportingMetrics: buildSupportingMetrics(),
    timeline: buildTimeline(sleepForDate),
    notes: dayState === "recorded" ? [] : [],
  };
  return {
    ...base,
    availabilityNotes: availabilityNotesFor(base),
  };
}

function buildNearbyDay(
  date: string,
  dayState: "recorded" | "future",
  sleepForDate: SleepSession | undefined,
): NearbyDay {
  const headline = buildHeadlineScores(sleepForDate);
  return {
    date,
    dayState,
    recovery: headline.recovery,
    sleepDuration: headline.sleepDuration,
    sleepNeed: headline.sleepNeed,
    strain: headline.strain,
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, delta: number): string {
  const instant = new Date(`${date}T00:00:00Z`);
  instant.setUTCDate(instant.getUTCDate() + delta);
  return instant.toISOString().slice(0, 10);
}

/**
 * Builds a `HealthDayResponse` for `date`/`radius` from the fixture
 * repository's `RawHealthData`, matching the shape `getDayAnalytics()`
 * returns for the real API so both sources can share one consumer type.
 */
export function buildFixtureDayResponse(
  raw: RawHealthData,
  date: string,
  radius: number,
): HealthDayResponse {
  const sleepByEndDate = new Map<string, SleepSession>();
  for (const session of raw.sleepSessions) {
    const key = sleepEndDate(session);
    const existing = sleepByEndDate.get(key);
    if (!existing || totalSleepMinutes(session) > totalSleepMinutes(existing)) {
      sleepByEndDate.set(key, session);
    }
  }

  const today = todayIsoDate();
  const dayStateFor = (d: string): "recorded" | "future" =>
    d > today ? "future" : "recorded";

  const focusDate = date;
  const focusDay = buildDay(
    focusDate,
    dayStateFor(focusDate),
    sleepByEndDate.get(focusDate),
  );

  const nearbyDays: NearbyDay[] = [];
  for (let offset = -radius; offset <= radius; offset++) {
    const nearbyDate = addDays(focusDate, offset);
    nearbyDays.push(
      buildNearbyDay(
        nearbyDate,
        dayStateFor(nearbyDate),
        sleepByEndDate.get(nearbyDate),
      ),
    );
  }

  return {
    contractVersion: CONTRACT_VERSION,
    day: focusDay,
    nearbyDays,
    runId: FIXTURE_RUN_ID,
  };
}
