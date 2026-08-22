import { createHash } from "node:crypto";
import type { HealthAnalytics } from "../src/domain/analytics";
import type { SleepSession } from "../src/domain/health";
import { PIPELINE_ALGORITHM_VERSION } from "./config";
import { aggregateDailySleep } from "./stages/aggregateDailySleep";
import { compareDevices } from "./stages/compareDevices";
import { reconcileSleepEvents } from "./stages/reconcileSleepEvents";

export function processHealthData(
  sleepSessions: SleepSession[],
): HealthAnalytics {
  const sleepEvents = reconcileSleepEvents(sleepSessions);
  return {
    algorithmVersion: PIPELINE_ALGORITHM_VERSION,
    sourceFingerprint: fingerprint(sleepSessions),
    processedAt: new Date().toISOString(),
    sleepEvents,
    dailySleep: aggregateDailySleep(sleepEvents),
    deviceSleep: compareDevices(sleepEvents),
  };
}

function fingerprint(sessions: SleepSession[]): string {
  const stableInput = sessions
    .map((session) => ({
      id: session.id,
      source: session.source,
      startAt: session.startAt,
      endAt: session.endAt,
      stages: session.stages,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return createHash("sha256").update(JSON.stringify(stableInput)).digest("hex");
}
