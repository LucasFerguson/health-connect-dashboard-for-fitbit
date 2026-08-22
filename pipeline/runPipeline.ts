import type { HealthAnalytics } from "../src/domain/analytics";
import type { SleepSession } from "../src/domain/health";
import type { AnalyticsStore } from "./ports/analyticsStore";
import { processHealthData } from "./processHealthData";

export async function runPipeline(
  sleepSessions: SleepSession[],
  store?: AnalyticsStore,
): Promise<{
  analytics: HealthAnalytics;
  persistence: "saved" | "unchanged" | "disabled";
}> {
  const analytics = processHealthData(sleepSessions);
  return {
    analytics,
    persistence: store ? await store.save(analytics) : "disabled",
  };
}
