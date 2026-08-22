import { MongoAnalyticsStore } from "../adapters/mongoAnalyticsStore";
import { runPipeline } from "../runPipeline";
import { createHealthRepository } from "../../src/server/health/createHealthRepository";

const { repository, source } = createHealthRepository();
const sessions = await repository.getSleepSessions();
const mongoUri = process.env.ANALYTICS_MONGO_URI;
const store = mongoUri
  ? new MongoAnalyticsStore(
      mongoUri,
      process.env.ANALYTICS_DATABASE ?? "health_analytics",
    )
  : undefined;
const result = await runPipeline(sessions, store);

console.log({
  source,
  sourceRecords: sessions.length,
  sleepEvents: result.analytics.sleepEvents.length,
  dailySummaries: result.analytics.dailySleep.length,
  deviceComparisons: result.analytics.deviceSleep.length,
  algorithmVersion: result.analytics.algorithmVersion,
  sourceFingerprint: result.analytics.sourceFingerprint,
  persistence: result.persistence,
});
