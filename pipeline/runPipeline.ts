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
import type { HealthAnalytics } from "../src/domain/analytics";
import type { RawHealthData } from "../src/domain/health";
import type { AnalyticsStore } from "./ports/analyticsStore";
import { processHealthData } from "./processHealthData";

export async function runPipeline(
  healthData: RawHealthData,
  store?: AnalyticsStore,
): Promise<{
  analytics: HealthAnalytics;
  persistence: "saved" | "unchanged" | "disabled";
}> {
  const analytics = processHealthData(healthData);
  return {
    analytics,
    persistence: store ? await store.save(analytics) : "disabled",
  };
}
