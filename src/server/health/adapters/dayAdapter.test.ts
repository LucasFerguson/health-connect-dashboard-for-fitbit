import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DayPageQuery, MetricStatus } from "~/types/__generated__/graphql";
import {
  ZONE_THRESHOLDS_NOT_EXPOSED_NOTE,
  adaptDayView,
  dayStripRange,
} from "./dayAdapter";

/**
 * Coverage for the GraphQL -> day-view mapping: a data-rich day, an empty
 * past day, a future day, and the three places the adapter does more than
 * translate enums (the day strip, `availabilityNotes`, heart-rate zones).
 *
 * The payloads are synthetic: their SHAPE mirrors live `DayPage` responses
 * from HCGateway's GraphQL API (sampled for a data-rich day, for 1999-01-01,
 * a date with no data, and for a future date), but every number is made up.
 * Do not paste real responses in here -- they contain personal health data.
 */

type Analytics = DayPageQuery["viewer"]["analytics"];
type Day = NonNullable<Analytics["day"]>;
type StripDay = Analytics["days"][number];

const TIME_ZONE = "America/Chicago";
/** 2026-01-15 18:00 in Chicago; "today" for every test below. */
const NOW = new Date("2026-01-16T00:00:00Z");

function metric(status: MetricStatus, value: number | null, note?: string) {
  return {
    status,
    value,
    note: note ?? (value === null ? "Synthetic note." : null),
  };
}

function missing(note = "Synthetic missing note.") {
  return metric("MISSING", null, note);
}

/** Mirrors the backend's `empty_day()`: every metric missing, value null. */
function emptyDay(date: string, dayState: Day["dayState"]): Day {
  return {
    date,
    timeZone: TIME_ZONE,
    dayState,
    headlineScores: {
      sleepDuration: {
        ...missing("No sleep."),
        window: null,
        stageMinutes: null,
      },
      sleepNeed: missing("No sleep to compare."),
      recovery: metric("INSUFFICIENT_DATA", null, "Recovery needs baselines."),
      strain: missing("No strain."),
      strainTarget: metric("BLOCKED", null, "Strain target needs Recovery."),
    },
    supportingMetrics: {
      hrv: missing(),
      restingHeartRate: missing(),
      respiratoryRate: missing(),
      oxygenSaturation: missing(),
      skinTemperatureDeviation: missing(),
      steps: missing(),
      calories: missing(),
      zone3AndAbove: missing(),
    },
    heartRateZones: {
      status: "MISSING",
      note: "No zone thresholds configured.",
    },
    timeline: {
      heartRate: {
        status: "MISSING",
        note: "No heart-rate samples.",
        hours: [],
      },
      sleepStages: [],
      steps: [],
      schedule: { status: "NOT_IMPLEMENTED", note: "No schedule source." },
      targetWakeTime: { status: "MISSING", note: "No wake-time preference." },
      targetBedTime: { status: "MISSING", note: "No bedtime preference." },
    },
  };
}

function dataRichDay(date: string): Day {
  const empty = emptyDay(date, "RECORDED");
  return {
    ...empty,
    headlineScores: {
      ...empty.headlineScores,
      sleepDuration: {
        ...metric("AVAILABLE", 450),
        window: {
          startAt: `${date}T10:00:00.000Z`,
          endAt: `${date}T17:30:00.000Z`,
        },
        stageMinutes: {
          deep: 60,
          light: 250,
          rem: 90,
          asleep: 0,
          awake: 50,
          unknown: 0,
        },
      },
      sleepNeed: metric("PARTIAL", 94, "Compared with a fixed target."),
      strain: metric("AVAILABLE", 9.5, "Experimental estimate."),
    },
    supportingMetrics: {
      ...empty.supportingMetrics,
      restingHeartRate: metric("AVAILABLE", 58),
      steps: metric("AVAILABLE", 8000),
      zone3AndAbove: metric("AVAILABLE", 12.5),
    },
    heartRateZones: { status: "AVAILABLE", note: "Estimated thresholds." },
    timeline: {
      ...empty.timeline,
      heartRate: {
        status: "AVAILABLE",
        note: null,
        hours: [
          {
            hour: 0,
            status: "AVAILABLE",
            sampleCount: 120,
            min: 50,
            p25: 55,
            mean: 58,
            p75: 61,
            max: 70,
          },
          {
            hour: 1,
            status: "MISSING",
            sampleCount: 0,
            min: null,
            p25: null,
            mean: null,
            p75: null,
            max: null,
          },
        ],
      },
      sleepStages: [
        {
          startAt: `${date}T10:00:00.000Z`,
          endAt: `${date}T11:00:00.000Z`,
          kind: "DEEP",
        },
        {
          startAt: `${date}T11:00:00.000Z`,
          endAt: `${date}T11:10:00.000Z`,
          kind: "AWAKE",
        },
      ],
      steps: [
        { hour: 0, count: 120, status: "AVAILABLE" },
        { hour: 1, count: 0, status: "MISSING" },
      ],
    },
  };
}

function stripDay(
  date: string,
  sleep: number | null,
  strain: number | null,
): StripDay {
  return {
    date,
    dayState: "RECORDED",
    headlineScores: {
      sleepDuration:
        sleep === null
          ? { status: "MISSING", value: null }
          : { status: "AVAILABLE", value: sleep },
      strain:
        strain === null
          ? { status: "MISSING", value: null }
          : { status: "AVAILABLE", value: strain },
    },
  };
}

function analytics(day: Day | null, days: StripDay[] = []): Analytics {
  return { timeZone: TIME_ZONE, day, days };
}

void describe("adaptDayView: focused day", () => {
  void it("lowercases every enum and keeps values as they are", () => {
    const { day } = adaptDayView(analytics(dataRichDay("2026-01-14")), NOW);
    assert.equal(day.dayState, "recorded");
    assert.deepEqual(day.headlineScores.sleepDuration, {
      status: "available",
      value: 450,
      note: null,
      window: {
        startAt: "2026-01-14T10:00:00.000Z",
        endAt: "2026-01-14T17:30:00.000Z",
      },
      stageMinutes: {
        deep: 60,
        light: 250,
        rem: 90,
        asleep: 0,
        awake: 50,
        unknown: 0,
      },
    });
    assert.deepEqual(day.headlineScores.sleepNeed, {
      status: "partial",
      value: 94,
      note: "Compared with a fixed target.",
    });
    assert.deepEqual(
      day.timeline.sleepStages.map((segment) => segment.kind),
      ["deep", "awake"],
    );
    assert.deepEqual(
      day.timeline.heartRate.hours.map((hour) => hour.status),
      ["available", "missing"],
    );
    assert.deepEqual(day.timeline.steps[1], {
      hour: 1,
      count: 0,
      status: "missing",
    });
    assert.deepEqual(day.timeline.schedule, {
      status: "not_implemented",
      note: "No schedule source.",
    });
  });

  void it("keeps a missing metric's value null rather than zero", () => {
    const { day } = adaptDayView(
      analytics(emptyDay("1999-01-01", "RECORDED")),
      NOW,
    );
    assert.equal(day.headlineScores.sleepDuration.value, null);
    assert.equal(day.headlineScores.sleepDuration.window, null);
    assert.equal(day.headlineScores.sleepDuration.stageMinutes, null);
    assert.equal(day.supportingMetrics.steps.value, null);
    assert.equal(day.headlineScores.recovery.status, "insufficient_data");
  });

  void it("maps the two statuses the REST contract never had", () => {
    const empty = emptyDay("2026-01-14", "RECORDED");
    const { day } = adaptDayView(
      analytics({
        ...empty,
        headlineScores: {
          ...empty.headlineScores,
          strain: metric("UNAVAILABLE", null, "Zones not calibrated."),
        },
        timeline: {
          ...empty.timeline,
          heartRate: {
            status: "SAMPLE_TIME_ONLY",
            note: null,
            hours: [],
          },
        },
      }),
      NOW,
    );
    assert.equal(day.headlineScores.strain.status, "unavailable");
    assert.equal(day.timeline.heartRate.status, "sample_time_only");
  });

  void it("throws when the backend returns no day at all", () => {
    assert.throws(() => adaptDayView(analytics(null), NOW), /returned null/);
  });
});

void describe("adaptDayView: heart-rate zones", () => {
  void it("forces calibrated zones to missing, since GraphQL doesn't expose the thresholds", () => {
    const { day } = adaptDayView(analytics(dataRichDay("2026-01-14")), NOW);
    assert.deepEqual(day.heartRateZones, {
      status: "missing",
      note: ZONE_THRESHOLDS_NOT_EXPOSED_NOTE,
      thresholds: null,
      calibrated: true,
    });
  });

  void it("keeps the backend's own status and note when zones aren't calibrated", () => {
    const { day } = adaptDayView(
      analytics(emptyDay("2026-01-14", "RECORDED")),
      NOW,
    );
    assert.deepEqual(day.heartRateZones, {
      status: "missing",
      note: "No zone thresholds configured.",
      thresholds: null,
      calibrated: false,
    });
  });
});

void describe("adaptDayView: availabilityNotes", () => {
  void it("lists every non-displayable metric in REST's order", () => {
    const { day } = adaptDayView(analytics(dataRichDay("2026-01-14")), NOW);
    assert.deepEqual(
      day.availabilityNotes.map((entry) => entry.field),
      [
        "headlineScores.recovery",
        "headlineScores.strainTarget",
        "supportingMetrics.hrv",
        "supportingMetrics.respiratoryRate",
        "supportingMetrics.oxygenSaturation",
        "supportingMetrics.skinTemperatureDeviation",
        "supportingMetrics.calories",
        "timeline.schedule",
        "timeline.targetWakeTime",
        "timeline.targetBedTime",
        "heartRateZones",
      ],
    );
    assert.deepEqual(day.availabilityNotes[0], {
      field: "headlineScores.recovery",
      status: "insufficient_data",
      note: "Recovery needs baselines.",
    });
  });

  void it("starts with sleep duration on an empty day, as REST did", () => {
    const { day } = adaptDayView(
      analytics(emptyDay("1999-01-01", "RECORDED")),
      NOW,
    );
    assert.deepEqual(day.availabilityNotes[0], {
      field: "headlineScores.sleepDuration",
      status: "missing",
      note: "No sleep.",
    });
    // 5 headline + 8 supporting + 3 plan + zones: everything is missing.
    assert.equal(day.availabilityNotes.length, 17);
  });

  void it("never invents a note the backend didn't send", () => {
    const empty = emptyDay("2026-01-14", "RECORDED");
    const { day } = adaptDayView(
      analytics({
        ...empty,
        headlineScores: {
          ...empty.headlineScores,
          sleepDuration: { ...empty.headlineScores.sleepDuration, note: null },
        },
      }),
      NOW,
    );
    assert.equal(day.availabilityNotes[0]?.note, null);
  });
});

void describe("adaptDayView: day strip", () => {
  void it("asks for a UTC-midnight window of 7 days either side", () => {
    assert.deepEqual(dayStripRange("2026-01-01"), {
      start: "2025-12-25T00:00:00Z",
      endExclusive: "2026-01-09T00:00:00Z",
    });
  });

  void it("builds all 15 cells, filling dates the backend omitted", () => {
    const { nearbyDays } = adaptDayView(
      analytics(dataRichDay("2026-01-14"), [
        stripDay("2026-01-10", 420, 8),
        stripDay("2026-01-13", null, null),
        // `days(range:)` includes the focused date too; the focused cell must
        // come from `day` so the strip can't disagree with the page.
        stripDay("2026-01-14", 1, 1),
      ]),
      NOW,
    );
    assert.equal(nearbyDays.length, 15);
    assert.equal(nearbyDays[0]?.date, "2026-01-07");
    assert.equal(nearbyDays[14]?.date, "2026-01-21");

    const byDate = new Map(nearbyDays.map((cell) => [cell.date, cell]));
    assert.deepEqual(byDate.get("2026-01-10"), {
      date: "2026-01-10",
      dayState: "recorded",
      sleepDuration: { status: "available", value: 420 },
      strain: { status: "available", value: 8 },
    });
    assert.equal(byDate.get("2026-01-13")?.sleepDuration?.status, "missing");
    assert.equal(byDate.get("2026-01-14")?.sleepDuration?.value, 450);

    // Absent and not after today (2026-01-15 in Chicago): an empty past day.
    assert.deepEqual(byDate.get("2026-01-15"), {
      date: "2026-01-15",
      dayState: "recorded",
      sleepDuration: null,
      strain: null,
    });
    // Absent and after today: future.
    assert.equal(byDate.get("2026-01-16")?.dayState, "future");
    assert.equal(byDate.get("2026-01-21")?.dayState, "future");
  });

  void it("judges 'today' in the home time zone, not UTC", () => {
    // 2026-01-16T00:00Z is already the 16th in UTC but still the 15th in
    // Chicago, so the 16th must be future.
    const { nearbyDays } = adaptDayView(
      analytics(emptyDay("2026-01-10", "RECORDED")),
      NOW,
    );
    const byDate = new Map(
      nearbyDays.map((cell) => [cell.date, cell.dayState]),
    );
    assert.equal(byDate.get("2026-01-15"), "recorded");
    assert.equal(byDate.get("2026-01-16"), "future");
  });

  void it("carries a future focused day's own state", () => {
    const { day, nearbyDays } = adaptDayView(
      analytics(emptyDay("2026-02-01", "FUTURE")),
      NOW,
    );
    assert.equal(day.dayState, "future");
    assert.ok(nearbyDays.every((cell) => cell.dayState === "future"));
  });
});
