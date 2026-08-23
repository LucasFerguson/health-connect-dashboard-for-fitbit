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
