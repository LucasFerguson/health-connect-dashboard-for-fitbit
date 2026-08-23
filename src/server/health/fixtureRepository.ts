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
