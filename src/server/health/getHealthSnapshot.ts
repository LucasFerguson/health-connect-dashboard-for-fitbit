import type { HealthSnapshot } from "~/domain/health";
import { MongoAnalyticsStore } from "../../../pipeline/adapters/mongoAnalyticsStore";
import { runPipeline } from "../../../pipeline/runPipeline";
import { createHealthRepository } from "./createHealthRepository";

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const { repository, source } = createHealthRepository();
  const sleepSessions = await repository.getSleepSessions();
  const analyticsStore = process.env.ANALYTICS_MONGO_URI
    ? new MongoAnalyticsStore(
        process.env.ANALYTICS_MONGO_URI,
        process.env.ANALYTICS_DATABASE ?? "health_analytics",
      )
    : undefined;
  const { analytics } = await runPipeline(sleepSessions, analyticsStore);

  return {
    generatedAt: new Date().toISOString(),
    source,
    sleepSessions,
    analytics,
  };
}
