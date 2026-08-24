/**
 * SHARED — used by both the legacy local-analytics-pipeline path (most
 * pages) and the newer HCGateway-backed day view (`/day/[date]`). Do not
 * assume this is safe to delete or purely legacy; check both call sites
 * before changing its behavior. See README.md's "Architecture and data
 * flow" section for the two-path split.
 */
import rawSleepData from "~/utils/sleep_data.json";
import type { HealthRepository } from "./healthRepository";
import { mapSleepSession } from "./healthConnectRepository";

export class FixtureHealthRepository implements HealthRepository {
  getHealthData() {
    return Promise.resolve({
      sleepSessions: rawSleepData.map(mapSleepSession),
      steps: [],
      activeCalories: [],
      totalCalories: [],
      restingHeartRates: [],
      weights: [],
    });
  }
}
