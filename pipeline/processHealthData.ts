import { createHash } from "node:crypto";
import type { HealthAnalytics } from "../src/domain/analytics";
import type { RawHealthData } from "../src/domain/health";
import { PIPELINE_ALGORITHM_VERSION } from "./config";
import { createPipelineContext, type PipelineContext } from "./context";
import { aggregateDailySleep } from "./stages/aggregateDailySleep";
import { compareDevices } from "./stages/compareDevices";
import { reconcileSleepEvents } from "./stages/reconcileSleepEvents";
import { aggregateIntervalMetric } from "./stages/metrics/aggregateIntervalMetric";
import { aggregatePointMetric } from "./stages/metrics/aggregatePointMetric";

export function processHealthData(
  healthData: RawHealthData,
  context: PipelineContext = createPipelineContext(),
): HealthAnalytics {
  const sleepEvents = reconcileSleepEvents(healthData.sleepSessions, context);
  return {
    algorithmVersion: PIPELINE_ALGORITHM_VERSION,
    sourceFingerprint: fingerprint(healthData),
    processedAt: new Date().toISOString(),
    sleepEvents,
    dailySleep: aggregateDailySleep(sleepEvents),
    deviceSleep: compareDevices(sleepEvents),
    steps: aggregateIntervalMetric(
      healthData.steps,
      "steps",
      (record) => record.count,
      context,
    ),
    activeCalories: aggregateIntervalMetric(
      healthData.activeCalories,
      "kcal",
      (record) => record.energyKcal,
      context,
    ),
    totalCalories: aggregateIntervalMetric(
      healthData.totalCalories,
      "kcal",
      (record) => record.energyKcal,
      context,
    ),
    restingHeartRate: aggregatePointMetric(
      healthData.restingHeartRates,
      "bpm",
      (record) => record.bpm,
      "median",
      context,
    ),
    weight: aggregatePointMetric(
      healthData.weights,
      "kg",
      (record) => record.kilograms,
      "latest",
      context,
    ),
  };
}

function fingerprint(healthData: RawHealthData): string {
  const stableInput = Object.fromEntries(
    Object.entries(healthData).map(([metric, observations]) => [
      metric,
      [...observations].sort((left, right) => left.id.localeCompare(right.id)),
    ]),
  );
  return createHash("sha256").update(JSON.stringify(stableInput)).digest("hex");
}
