import { MongoAnalyticsStore } from "../adapters/mongoAnalyticsStore";
import { runPipeline } from "../runPipeline";
import { createHealthRepository } from "../../src/server/health/createHealthRepository";

const { repository, source } = createHealthRepository();
const healthData = await repository.getHealthData();
const mongoUri = process.env.ANALYTICS_MONGO_URI;
const store = mongoUri
  ? new MongoAnalyticsStore(
      mongoUri,
      process.env.ANALYTICS_DATABASE ?? "health_analytics",
    )
  : undefined;
const result = await runPipeline(healthData, store);

console.log({
  source,
  sourceRecords: Object.values(healthData).reduce(
    (total, records) => total + records.length,
    0,
  ),
  sleepEvents: result.analytics.sleepEvents.length,
  dailySummaries: result.analytics.dailySleep.length,
  deviceComparisons: result.analytics.deviceSleep.length,
  metricDays: {
    steps: result.analytics.steps.daily.length,
    activeCalories: result.analytics.activeCalories.daily.length,
    totalCalories: result.analytics.totalCalories.daily.length,
    restingHeartRate: result.analytics.restingHeartRate.daily.length,
    weight: result.analytics.weight.daily.length,
  },
  algorithmVersion: result.analytics.algorithmVersion,
  sourceFingerprint: result.analytics.sourceFingerprint,
  persistence: result.persistence,
});
