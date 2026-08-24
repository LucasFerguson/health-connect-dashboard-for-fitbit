import { env } from "~/env";
import type {
  HealthDayResponse,
  SyncStatusResponse,
} from "./dayAnalyticsSchema";
import { getDayAnalyticsCached } from "./dayAnalyticsCache";
import { HealthConnectClient } from "./healthConnectClient";
import { FixtureHealthRepository } from "./fixtureRepository";
import { buildFixtureDayResponse } from "./fixtureDayAnalytics";

/**
 * Single entrypoint for the new `health-day-v1` contract, mirroring
 * `createHealthRepository`'s API_URL/API_USERNAME/API_PASSWORD gate: talk to
 * the real HCGateway analytics API when configured, otherwise fall back to
 * the fixture/demo path — reshaped into the exact same `HealthDayResponse`
 * type so callers don't need to branch on source.
 *
 * This does not read or write anything under `pipeline/` or
 * `src/domain/analytics.ts`; it is a parallel, additive path for the
 * upcoming UI migration and does not affect `getDayViewSnapshot.ts` or the
 * current `/day/[date]` page.
 */

function getConfiguredClient(): HealthConnectClient | null {
  const baseUrl = env.API_URL;
  const username = env.API_USERNAME;
  const password = env.API_PASSWORD;
  if (baseUrl && username && password) {
    return new HealthConnectClient({ baseUrl, username, password });
  }
  return null;
}

/**
 * Returns the day-view contract for `date` plus `radius` days of
 * low-resolution neighbors on each side. Backed by the tiered in-memory
 * cache (`dayAnalyticsCache.ts`) when talking to the real API; the fixture
 * path is cheap enough (in-memory JSON, no network) that it is recomputed
 * on every call.
 */
export async function getDayAnalytics(
  date: string,
  radius: number,
): Promise<HealthDayResponse> {
  const client = getConfiguredClient();
  if (client) {
    return getDayAnalyticsCached(client, date, radius);
  }
  const raw = await new FixtureHealthRepository().getHealthData();
  return buildFixtureDayResponse(raw, date, radius);
}

/**
 * Returns the phone-upload sync heartbeat. The fixture path has no
 * concept of live phone uploads, so it reports the same honest
 * `never_observed` state the real API would report for a user who has
 * never synced.
 */
export async function getSyncStatus(): Promise<SyncStatusResponse> {
  const client = getConfiguredClient();
  if (client) {
    return client.getSyncStatus();
  }
  return {
    observedActive: false,
    state: "never_observed",
    lastUploadAt: null,
    activeUntil: null,
    secondsSinceLastUpload: null,
    lastRecordType: null,
    lastRecordCount: null,
    totalUploadRequests: 0,
    totalRecordsReceived: 0,
    activityWindowSeconds: 120,
    note: "Fixture data source has no phone-upload activity to report.",
  };
}
