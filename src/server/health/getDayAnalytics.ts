import { env } from "~/env";
import type {
  HealthDayResponse,
  SyncStatusResponse,
} from "./dayAnalyticsSchema";
import { getDayAnalyticsCached } from "./dayAnalyticsCache";
import { HealthConnectClient } from "./healthConnectClient";

/**
 * Entrypoint for the day view's `health-day-v1` REST contract. Throws when
 * credentials are missing, the same way `withAnalytics` does for the GraphQL
 * pages, so the root error boundary renders a "couldn't load" state rather
 * than an empty day.
 */
function getClient(): HealthConnectClient {
  const baseUrl = env.API_URL;
  const username = env.API_USERNAME;
  const password = env.API_PASSWORD;
  if (!baseUrl || !username || !password) {
    throw new Error(
      "HCGateway is not configured: API_URL, API_USERNAME and API_PASSWORD must all be set",
    );
  }
  return new HealthConnectClient({ baseUrl, username, password });
}

/**
 * Returns the day-view contract for `date` plus `radius` days of
 * low-resolution neighbors on each side, backed by the tiered in-memory cache
 * in `dayAnalyticsCache.ts`.
 */
export function getDayAnalytics(
  date: string,
  radius: number,
): Promise<HealthDayResponse> {
  return getDayAnalyticsCached(getClient(), date, radius);
}

/** Returns the phone-upload sync heartbeat. */
export function getSyncStatus(): Promise<SyncStatusResponse> {
  return getClient().getSyncStatus();
}
