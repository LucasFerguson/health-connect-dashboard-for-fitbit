import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HealthDay, HeartRateHour, StepsHour } from "./dayView";
import { valuesAtInstant } from "./dayViewInstant";

type TimelineDay = Pick<HealthDay, "date" | "timeZone" | "timeline">;

const ZONE = "America/New_York"; // UTC-4 in July
const DATE = "2026-07-10";
/** Local wall time on DATE (EDT) as epoch ms. */
const at = (hhmm: string) => Date.parse(`${DATE}T${hhmm}:00-04:00`);
const iso = (hhmm: string) => new Date(at(hhmm)).toISOString();

function hrHour(hour: number, overrides: Partial<HeartRateHour> = {}) {
  return {
    hour,
    status: "available",
    sampleCount: 60,
    min: 50,
    p25: 55,
    mean: 58,
    p75: 62,
    max: 70,
    ...overrides,
  } satisfies HeartRateHour;
}

function stepsHour(hour: number, count: number, status = "available") {
  return { hour, count, status } as StepsHour;
}

function syntheticDay(
  overrides: Partial<TimelineDay["timeline"]> = {},
): TimelineDay {
  return {
    date: DATE,
    timeZone: ZONE,
    timeline: {
      heartRate: {
        status: "available",
        note: null,
        hours: [
          hrHour(3),
          hrHour(4, { status: "missing", min: null, max: null, mean: null }),
          hrHour(14, { mean: 120, min: 95, max: 150 }),
        ],
      },
      sleepStages: [
        { startAt: iso("01:00"), endAt: iso("02:30"), kind: "light" },
        { startAt: iso("02:30"), endAt: iso("03:30"), kind: "deep" },
        { startAt: iso("03:30"), endAt: iso("04:00"), kind: "unknown" },
        { startAt: iso("04:00"), endAt: iso("04:20"), kind: "rem" },
        { startAt: iso("04:20"), endAt: iso("04:30"), kind: "awake" },
      ],
      steps: [stepsHour(3, 0), stepsHour(4, 0, "missing"), stepsHour(14, 1200)],
      workouts: [
        { startAt: iso("14:05"), endAt: iso("14:50"), label: "Running" },
      ],
      schedule: { status: "not_implemented", note: null },
      targetWakeTime: { status: "not_implemented", note: null },
      targetBedTime: { status: "not_implemented", note: null },
      ...overrides,
    },
  };
}

void describe("valuesAtInstant", () => {
  const day = syntheticDay();

  void it("reports the sleep stage, HR and steps mid-sleep", () => {
    assert.deepEqual(valuesAtInstant(day, at("03:10")), {
      sleepStage: "deep",
      heartRate: { hour: 3, mean: 58, min: 50, max: 70 },
      steps: { hour: 3, count: 0 },
      workout: null,
    });
  });

  void it("uses half-open segments so a boundary belongs to the next stage", () => {
    assert.equal(valuesAtInstant(day, at("02:30")).sleepStage, "deep");
    assert.equal(valuesAtInstant(day, at("04:20")).sleepStage, "awake");
    assert.equal(valuesAtInstant(day, at("04:30")).sleepStage, null);
  });

  void it("treats unknown stages and non-available hours as no data, never zero", () => {
    const values = valuesAtInstant(day, at("04:10"));
    assert.equal(values.sleepStage, "rem");
    assert.equal(values.heartRate, null);
    assert.equal(values.steps, null);
    assert.equal(valuesAtInstant(day, at("03:45")).sleepStage, null);
  });

  void it("reports an active workout", () => {
    const values = valuesAtInstant(day, at("14:30"));
    assert.equal(values.workout, "Running");
    assert.deepEqual(values.steps, { hour: 14, count: 1200 });
    assert.equal(values.heartRate?.mean, 120);
    assert.equal(valuesAtInstant(day, at("14:55")).workout, null);
  });

  void it("returns all nulls for hours with no data at all", () => {
    assert.deepEqual(valuesAtInstant(day, at("09:00")), {
      sleepStage: null,
      heartRate: null,
      steps: null,
      workout: null,
    });
  });

  void it("returns all nulls outside the axis", () => {
    const before = valuesAtInstant(day, at("00:00") - 1);
    const after = valuesAtInstant(day, at("00:00") + 24 * 3_600_000);
    for (const values of [before, after]) {
      assert.equal(values.heartRate, null);
      assert.equal(values.steps, null);
    }
  });

  void it("matches hours in the day's zone, not UTC", () => {
    // 03:10 EDT is 07:10 UTC; hour 7 has no data, hour 3 does.
    assert.equal(valuesAtInstant(day, at("03:10")).heartRate?.hour, 3);
  });

  void it("maps slots through a pivoted day start", () => {
    // With an 18:00 start, 03:10 the next morning is slot 9 -> clock hour 3.
    const pivoted = { ...day, date: "2026-07-09" };
    assert.equal(valuesAtInstant(pivoted, at("03:10"), 18).steps?.hour, 3);
  });

  void it("tolerates a timeline without workouts", () => {
    const noWorkouts = syntheticDay({ workouts: undefined });
    assert.equal(valuesAtInstant(noWorkouts, at("14:30")).workout, null);
  });
});
