/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
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
  sleepDebtDays: result.analytics.sleepDebt.daily.length,
  sleepConsistencyDays: result.analytics.sleepConsistency.daily.length,
  scoredSleepConsistencyDays: result.analytics.sleepConsistency.daily.filter(
    (day) => day.score !== null,
  ).length,
  healthspanStatus: result.analytics.healthspan.status,
  healthspanEstimateDays: result.analytics.healthspan.trend.filter(
    (day) => day.healthAgeYears !== null,
  ).length,
  healthAgeYears: result.analytics.healthspan.latest?.healthAgeYears ?? null,
  healthAgeAdjustmentYears:
    result.analytics.healthspan.latest?.ageDeltaYears ?? null,
  healthspanFactors:
    result.analytics.healthspan.latest?.factors.map((factor) => ({
      key: factor.key,
      value: factor.value,
      ageImpactYears: factor.ageImpactYears,
      coverageDays: factor.coverageDays,
    })) ?? [],
  paceOfAging: result.analytics.healthspan.paceOfAging,
  sleepTargetMinutes: result.analytics.sleepDebt.targetMinutes,
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
