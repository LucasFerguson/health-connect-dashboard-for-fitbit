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
import { createHash } from "node:crypto";
import type { HealthAnalytics } from "../src/domain/analytics";
import type { RawHealthData } from "../src/domain/health";
import { PIPELINE_ALGORITHM_VERSION } from "./config";
import { createPipelineContext, type PipelineContext } from "./context";
import { aggregateDailySleep } from "./stages/aggregateDailySleep";
import { calculateSleepDebt } from "./stages/calculateSleepDebt";
import { calculateSleepConsistency } from "./stages/calculateSleepConsistency";
import { calculateHealthspan } from "./stages/calculateHealthspan";
import { compareDevices } from "./stages/compareDevices";
import { reconcileSleepEvents } from "./stages/reconcileSleepEvents";
import { aggregateIntervalMetric } from "./stages/metrics/aggregateIntervalMetric";
import { aggregatePointMetric } from "./stages/metrics/aggregatePointMetric";

export function processHealthData(
  healthData: RawHealthData,
  context: PipelineContext = createPipelineContext(),
): HealthAnalytics {
  const sleepEvents = reconcileSleepEvents(healthData.sleepSessions, context);
  const dailySleep = aggregateDailySleep(sleepEvents);
  const sleepConsistency = calculateSleepConsistency(sleepEvents, context);
  const steps = aggregateIntervalMetric(
    healthData.steps,
    "steps",
    (record) => record.count,
    context,
  );
  const activeCalories = aggregateIntervalMetric(
    healthData.activeCalories,
    "kcal",
    (record) => record.energyKcal,
    context,
  );
  const totalCalories = aggregateIntervalMetric(
    healthData.totalCalories,
    "kcal",
    (record) => record.energyKcal,
    context,
  );
  const restingHeartRate = aggregatePointMetric(
    healthData.restingHeartRates,
    "bpm",
    (record) => record.bpm,
    "median",
    context,
  );
  const weight = aggregatePointMetric(
    healthData.weights,
    "kg",
    (record) => record.kilograms,
    "latest",
    context,
  );
  return {
    algorithmVersion: PIPELINE_ALGORITHM_VERSION,
    sourceFingerprint: fingerprint(healthData),
    configurationFingerprint: fingerprint(context),
    processedAt: new Date().toISOString(),
    sleepEvents,
    dailySleep,
    sleepDebt: calculateSleepDebt(dailySleep, context.sleepTargetMinutes),
    sleepConsistency,
    healthspan: calculateHealthspan(
      { dailySleep, sleepConsistency, steps, restingHeartRate },
      context,
    ),
    deviceSleep: compareDevices(sleepEvents),
    steps,
    activeCalories,
    totalCalories,
    restingHeartRate,
    weight,
  };
}

function fingerprint(value: RawHealthData | PipelineContext): string {
  const stableInput =
    "sleepSessions" in value
      ? Object.fromEntries(
          Object.entries(value).map(([metric, observations]) => [
            metric,
            [...observations].sort((left, right) =>
              left.id.localeCompare(right.id),
            ),
          ]),
        )
      : value;
  return createHash("sha256").update(JSON.stringify(stableInput)).digest("hex");
}
