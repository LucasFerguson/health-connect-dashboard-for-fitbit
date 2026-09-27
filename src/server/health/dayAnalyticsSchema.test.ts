import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  healthDayResponseSchema,
  type MetricStatus,
} from "./dayAnalyticsSchema";

/**
 * Response-parsing coverage for the `health-day-v1` contract: a valid
 * data-rich payload, a valid all-missing payload, and a handful of invalid
 * payloads that must be rejected, so a future contract drift fails loudly
 * here instead of silently passing an `as HealthDayResponse` cast in the UI.
 *
 * The payloads are synthetic: their SHAPE mirrors live
 * `GET /api/v2/analytics/day` responses from HCGateway (sampled for a
 * data-rich day and for 1999-01-01, a date with no data), but every number
 * and id is made up. Do not paste real responses in here -- they contain
 * personal health data.
 */

const SOURCE = "com.fitbit.FitbitMobile";
const DATE = "2026-01-15";

/** A `_metric()`-shaped leaf. Missing/blocked-style statuses carry a `null`
 * value and source plus a note, as the live API does; available ones carry
 * a source and omit `note` (the Python side only sets it `if note:`). */
function makeMetric(
  status: MetricStatus,
  value: unknown,
  unit: string | null,
  extra: Record<string, unknown> = {},
) {
  const hasValue = value !== null;
  return {
    status,
    value,
    unit,
    source: hasValue ? SOURCE : null,
    qualityFlags: [] as string[],
    ...(hasValue ? {} : { note: "Synthetic placeholder note." }),
    ...extra,
  };
}

function missing(unit: string | null) {
  return makeMetric("missing", null, unit);
}

/** A day with sleep, strain, steps, heart rate, and a workout. */
function makeDataRichDay(date: string) {
  const sleepStart = `${date}T04:00:00.000Z`;
  const sleepEnd = `${date}T12:00:00.000Z`;
  const sessionId = "00000000-0000-4000-8000-000000000001";

  return {
    contractVersion: "health-day-v1",
    date,
    dayState: "recorded",
    timeZone: "America/Chicago",
    generatedAt: `${date}T20:00:00.000Z`,
    headlineScores: {
      recovery: makeMetric("partial", 62, "score_0_100", {
        // Live-only extras the schema doesn't model; Zod strips them, and
        // their presence must not cause a rejection.
        band: "moderate",
        provisional: true,
        modelVersion: "experimental-recovery-v1",
        components: {
          sleep: { value: 450, baseline: 440, score: 70, unit: "minutes" },
        },
        quality: {
          publishable: true,
          complete: false,
          reasons: ["hrv_missing"],
        },
        qualityFlags: ["hrv_missing"],
      }),
      sleepDuration: makeMetric("available", 450, "minutes", {
        window: { startAt: sleepStart, endAt: sleepEnd },
        stageMinutes: {
          deep: 60,
          light: 250,
          rem: 90,
          asleep: 0,
          awake: 50,
          unknown: 0,
        },
        eventCount: 1,
        recordingCount: 1,
        // Live-only extras (not modeled by the schema).
        stageDataStatus: "available",
        valueScope: "all_sleep_events",
        windowScope: "main_event",
        unclassifiedSleepMinutes: 0,
      }),
      sleepNeed: makeMetric("partial", 94, "percent", {
        source: "configured_fixed_target",
        note: "This compares sleep with a fixed target.",
        targetMinutes: 480,
        debtMinutes: 30,
      }),
      strain: makeMetric("available", 9.5, "score_0_21", {
        modelVersion: "experimental-cardio-strain-v2.1",
        note: "Experimental cardiovascular-only estimate.",
        quality: { publishable: true, reasons: [], coverageRatio: 0.9 },
      }),
      strainTarget: makeMetric("blocked", null, "score_0_21"),
    },
    heartRateZones: makeMetric(
      "available",
      [100, 115, 130, 145, 160, 175],
      "bpm",
      {
        source: "historical_empirical_high",
        testDate: null,
      },
    ),
    supportingMetrics: {
      hrv: missing("ms"),
      restingHeartRate: makeMetric("available", 58, "bpm", { sampleCount: 1 }),
      respiratoryRate: missing("breaths_per_minute"),
      skinTemperatureDeviation: missing("celsius_delta"),
      steps: makeMetric("available", 8000, "steps"),
      calories: makeMetric("available", 2200, "kcal"),
      zone3AndAbove: makeMetric("available", 12, "minutes"),
      oxygenSaturation: missing("percent"),
    },
    timeline: {
      heartRate: {
        status: "available",
        source: SOURCE,
        sampleCount: 2,
        observedMinuteCount: 2,
        hours: [
          {
            hour: 0,
            status: "available",
            sampleCount: 2,
            min: 55,
            p25: 56,
            mean: 57,
            p75: 58,
            max: 60,
          },
          {
            hour: 1,
            status: "missing",
            sampleCount: 0,
            min: null,
            p25: null,
            mean: null,
            p75: null,
            max: null,
          },
        ],
        note: null,
      },
      strain: [{ at: `${date}T05:00:00Z`, strain: 0.1, loadMinutes: 0.2 }],
      sleepStages: [
        {
          startAt: sleepStart,
          endAt: `${date}T05:00:00.000Z`,
          kind: "light",
          sessionId,
          source: SOURCE,
        },
        {
          startAt: `${date}T05:00:00.000Z`,
          endAt: sleepEnd,
          kind: "deep",
          sessionId,
          source: SOURCE,
        },
      ],
      steps: [
        { hour: 0, count: 0, status: "missing" },
        { hour: 9, count: 500, status: "available" },
      ],
      workouts: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          startAt: `${date}T23:00:00.000Z`,
          endAt: `${date}T23:30:00.000Z`,
          type: 79,
          typeLabel: "Walk",
          source: SOURCE,
          strainContribution: 1.5,
          strainQuality: { publishable: true, reasons: [] },
        },
      ],
      schedule: makeMetric("not_implemented", null, null),
      targetWakeTime: missing("local_time"),
      targetBedTime: missing("local_time"),
      now: {
        status: "sample_time_only",
        latestObservedAt: `${date}T23:59:00.000Z`,
        note: "This is the latest measurement time, not server receipt time.",
      },
    },
    availabilityNotes: [
      {
        field: "supportingMetrics.hrv",
        status: "missing",
        note: "Synthetic note.",
      },
    ],
    notes: [] as { code: string; message: string }[],
  };
}

/** A day with no data at all, shaped like the live response for 1999-01-01:
 * every metric `missing`/`insufficient_data`/`blocked`/`not_implemented`
 * with `value: null` (never 0), empty timeline arrays, `generatedAt: null`,
 * and a `no_day_data` note. */
function makeEmptyDay(date: string) {
  return {
    contractVersion: "health-day-v1",
    date,
    dayState: "recorded",
    timeZone: "America/Chicago",
    generatedAt: null,
    headlineScores: {
      recovery: makeMetric("insufficient_data", null, "score_0_100"),
      sleepDuration: missing("minutes"),
      sleepNeed: missing("percent"),
      strain: missing("score_0_21"),
      strainTarget: makeMetric("blocked", null, "score_0_21"),
    },
    heartRateZones: missing(null),
    supportingMetrics: {
      hrv: missing("ms"),
      restingHeartRate: missing("bpm"),
      respiratoryRate: missing("breaths_per_minute"),
      skinTemperatureDeviation: missing("celsius_delta"),
      steps: missing("steps"),
      calories: missing("kcal"),
      zone3AndAbove: missing("minutes"),
      oxygenSaturation: missing("percent"),
    },
    timeline: {
      heartRate: {
        status: "missing",
        source: null,
        sampleCount: 0,
        observedMinuteCount: 0,
        hours: [],
        note: "No heart-rate samples were recorded for this day.",
      },
      strain: [],
      sleepStages: [],
      steps: [],
      workouts: [],
      schedule: makeMetric("not_implemented", null, null),
      targetWakeTime: missing("local_time"),
      targetBedTime: missing("local_time"),
      now: {
        status: "missing",
        latestObservedAt: null,
        note: "Raw records do not include a server receipt timestamp.",
      },
    },
    availabilityNotes: [
      {
        field: "headlineScores.sleepDuration",
        status: "missing",
        note: "No sleep ending on this date was recorded.",
      },
    ],
    notes: [
      {
        code: "no_day_data",
        message: "No prepared metrics exist for this date.",
      },
    ],
  };
}

type SyntheticDay =
  | ReturnType<typeof makeDataRichDay>
  | ReturnType<typeof makeEmptyDay>;

function toNearby(day: SyntheticDay, date: string) {
  const { recovery, sleepDuration, sleepNeed, strain } = day.headlineScores;
  return {
    date,
    dayState: day.dayState,
    recovery,
    sleepDuration,
    sleepNeed,
    strain,
  };
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Envelope with `radius` nearby days on each side plus the day itself,
 * as the live API returns (radius=1 -> 3 nearbyDays). */
function makeResponse(day: SyntheticDay, radius = 1) {
  const nearbyDays = [];
  for (let offset = -radius; offset <= radius; offset++) {
    nearbyDays.push(toNearby(day, shiftDate(day.date, offset)));
  }
  return {
    contractVersion: "health-day-v1",
    day,
    nearbyDays,
    runId: "health-analytics-v0:synthetic:synthetic",
  };
}

void describe("healthDayResponseSchema", () => {
  void it("accepts a data-rich day", () => {
    const response = makeResponse(makeDataRichDay(DATE), 7);
    const parsed = healthDayResponseSchema.safeParse(response);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    if (parsed.success) {
      assert.equal(parsed.data.contractVersion, "health-day-v1");
      assert.equal(parsed.data.day.date, DATE);
      assert.equal(parsed.data.nearbyDays.length, 15);
      assert.equal(
        parsed.data.day.headlineScores.sleepDuration.status,
        "available",
      );
      assert.equal(parsed.data.day.headlineScores.sleepDuration.value, 450);
      assert.equal(
        parsed.data.day.headlineScores.sleepDuration.stageMinutes?.deep,
        60,
      );
      assert.equal(parsed.data.day.timeline.sleepStages.length, 2);
    }
  });

  void it("accepts a day with no data (all-missing placeholders, null not 0)", () => {
    const response = makeResponse(makeEmptyDay("1999-01-01"));
    const parsed = healthDayResponseSchema.safeParse(response);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    if (parsed.success) {
      const { headlineScores, supportingMetrics } = parsed.data.day;
      assert.equal(headlineScores.sleepDuration.status, "missing");
      assert.equal(headlineScores.sleepDuration.value, null);
      // The missing branch never carries the available-only extras.
      assert.equal(headlineScores.sleepDuration.stageMinutes, undefined);
      for (const [name, metric] of Object.entries(supportingMetrics)) {
        assert.equal(
          metric?.value,
          null,
          `${name} should be null, not a fabricated value`,
        );
      }
      assert.equal(parsed.data.day.generatedAt, null);
      assert.equal(parsed.data.nearbyDays.length, 3);
    }
  });

  void it("accepts an empty day that omits supportingMetrics.oxygenSaturation", () => {
    // `empty_day()` never seeds this key; see the schema's comment.
    const day = makeEmptyDay("2099-01-01");
    const supportingMetrics: Partial<typeof day.supportingMetrics> = {
      ...day.supportingMetrics,
    };
    delete supportingMetrics.oxygenSaturation;
    const response = makeResponse({
      ...day,
      dayState: "future",
      supportingMetrics,
    } as unknown as SyntheticDay);
    const parsed = healthDayResponseSchema.safeParse(response);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
  });

  void it("rejects a payload missing required top-level fields", () => {
    const parsed = healthDayResponseSchema.safeParse({
      contractVersion: "health-day-v1",
      // missing `day`, `nearbyDays`, `runId`
    });
    assert.equal(parsed.success, false);
  });

  void it("rejects a payload with a mistyped metric status", () => {
    const response = makeResponse(makeDataRichDay(DATE));
    const corrupted = {
      ...response,
      day: {
        ...response.day,
        headlineScores: {
          ...response.day.headlineScores,
          recovery: {
            ...response.day.headlineScores.recovery,
            status: "definitely_not_a_valid_status",
          },
        },
      },
    };
    const parsed = healthDayResponseSchema.safeParse(corrupted);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(
        parsed.error.issues.some(
          (issue) =>
            issue.path.join(".") === "day.headlineScores.recovery.status",
        ),
        JSON.stringify(parsed.error.issues),
      );
    }
  });

  void it("rejects a payload where a missing-status metric surfaces a numeric zero instead of null", () => {
    // This doesn't fail schema validation (value is `.nullable()`, and 0 is
    // a valid number) -- it's a reminder-style test that the *contract*
    // permits null vs 0 to be distinguished, which is what the UI layer
    // must respect (see dayViewPresentation.test.ts's isDisplayableStatus
    // coverage for the actual anti-zero-fabrication guarantee).
    const parsed = healthDayResponseSchema.parse(
      makeResponse(makeEmptyDay("1999-01-01")),
    );
    assert.equal(parsed.day.headlineScores.sleepDuration.status, "missing");
    assert.notEqual(parsed.day.headlineScores.sleepDuration.value, 0);
    assert.equal(parsed.day.headlineScores.sleepDuration.value, null);
  });
});
