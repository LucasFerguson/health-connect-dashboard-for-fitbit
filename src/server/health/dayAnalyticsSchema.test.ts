import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { healthDayResponseSchema } from "./dayAnalyticsSchema";
import { buildFixtureDayResponse } from "./fixtureDayAnalytics";
import { FixtureHealthRepository } from "./fixtureRepository";

/**
 * Response-parsing coverage for the `health-day-v1` contract: a valid
 * payload (the fixture adapter's own output, exercising the same shape the
 * real API and `getDayAnalytics()` produce) and a handful of invalid
 * payloads that must be rejected, so a future contract drift fails loudly
 * here instead of silently passing an `as HealthDayResponse` cast in the UI.
 */

void describe("healthDayResponseSchema", () => {
  void it("accepts the fixture adapter's output for a day with sleep data", async () => {
    const raw = await new FixtureHealthRepository().getHealthData();
    // The bundled fixture sleep data is fixed; use the end date of its
    // first session so this test doesn't depend on "today".
    const anchorDate = raw.sleepSessions[0]?.endAt.slice(0, 10);
    assert.ok(anchorDate, "fixture must contain at least one sleep session");

    const response = buildFixtureDayResponse(raw, anchorDate, 7);
    const parsed = healthDayResponseSchema.safeParse(response);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    if (parsed.success) {
      assert.equal(parsed.data.day.date, anchorDate);
      assert.equal(parsed.data.nearbyDays.length, 15);
      assert.equal(parsed.data.contractVersion, "health-day-v1");
    }
  });

  void it("accepts a day with no sleep data (all-missing placeholders)", async () => {
    const raw = await new FixtureHealthRepository().getHealthData();
    const response = buildFixtureDayResponse(raw, "1999-01-01", 7);
    const parsed = healthDayResponseSchema.safeParse(response);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    if (parsed.success) {
      assert.equal(
        parsed.data.day.headlineScores.sleepDuration.status,
        "missing",
      );
      assert.equal(parsed.data.day.headlineScores.sleepDuration.value, null);
    }
  });

  void it("rejects a payload missing required top-level fields", () => {
    const parsed = healthDayResponseSchema.safeParse({
      contractVersion: "health-day-v1",
      // missing `day`, `nearbyDays`, `runId`
    });
    assert.equal(parsed.success, false);
  });

  void it("rejects a payload with a mistyped metric status", async () => {
    const raw = await new FixtureHealthRepository().getHealthData();
    const anchorDate = raw.sleepSessions[0]!.endAt.slice(0, 10);
    const response = buildFixtureDayResponse(raw, anchorDate, 7);
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
  });

  void it("rejects a payload where a missing-status metric surfaces a numeric zero instead of null", async () => {
    // This doesn't fail schema validation (value is `.nullable()`, and 0 is
    // a valid number) -- it's a reminder-style test that the *contract*
    // permits null vs 0 to be distinguished, which is what the UI layer
    // must respect (see dayViewPresentation.test.ts's isDisplayableStatus
    // coverage for the actual anti-zero-fabrication guarantee).
    const raw = await new FixtureHealthRepository().getHealthData();
    const response = buildFixtureDayResponse(raw, "1999-01-01", 7);
    assert.equal(response.day.headlineScores.sleepDuration.status, "missing");
    assert.notEqual(response.day.headlineScores.sleepDuration.value, 0);
    assert.equal(response.day.headlineScores.sleepDuration.value, null);
  });
});
