import type { RawHealthData } from "~/domain/health";

export interface HealthRepository {
  getHealthData(): Promise<RawHealthData>;
}
