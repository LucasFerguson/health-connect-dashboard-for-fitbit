import rawSleepData from "~/utils/sleep_data.json";
import type { HealthRepository } from "./healthRepository";
import { mapSleepSession } from "./healthConnectRepository";

export class FixtureHealthRepository implements HealthRepository {
  getSleepSessions() {
    return Promise.resolve(rawSleepData.map(mapSleepSession));
  }
}
