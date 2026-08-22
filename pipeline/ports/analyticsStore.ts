import type { HealthAnalytics } from "../../src/domain/analytics";

export interface AnalyticsStore {
  save(analytics: HealthAnalytics): Promise<"saved" | "unchanged">;
}
