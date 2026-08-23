import type { HealthSnapshot } from "~/domain/health";
import { runPipeline } from "../../../pipeline/runPipeline";
import { createHealthRepository } from "./createHealthRepository";

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const { repository, source } = createHealthRepository();
  const healthData = await repository.getHealthData();
  const { analytics } = await runPipeline(healthData);

  return {
    generatedAt: new Date().toISOString(),
    source,
    sleepSessions: healthData.sleepSessions,
    analytics,
  };
}
