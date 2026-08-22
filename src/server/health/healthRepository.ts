import type { SleepSession } from "~/domain/health";

export interface HealthRepository {
  getSleepSessions(): Promise<SleepSession[]>;
}
