import { env } from "~/env";
import {
  BackendRequestError,
  NotConfiguredError,
  configSnapshot,
  diagnose,
  missingConfig,
  type RequestContext,
} from "./backendDiagnostics";
import type {
  HealthDayResponse,
  SyncStatusResponse,
} from "./dayAnalyticsSchema";
import { getDayAnalyticsCached } from "./dayAnalyticsCache";
import { HealthConnectClient } from "./healthConnectClient";

/**
 * Entrypoint for the day view's `health-day-v1` REST contract. Failures are
 * rethrown as `BackendRequestError` with the same diagnosis the GraphQL pages
 * get, so the day view's error screen is just as explicit.
 */
async function withRestClient<T>(
  label: string,
  path: string,
  run: (client: HealthConnectClient) => Promise<T>,
): Promise<T> {
  const config = configSnapshot(env);
  const context: RequestContext = {
    transport: "rest",
    label,
    operation: `GET ${path}`,
    selections: [],
    endpoint: config.apiUrl ? `${config.apiUrl}${path}` : null,
    loginUrl: config.apiUrl ? `${config.apiUrl}/api/v2/login` : null,
    config,
    startedAt: Date.now(),
  };
  try {
    const missing = missingConfig(config);
    if (missing.length > 0) throw new NotConfiguredError(missing);
    return await run(
      new HealthConnectClient({
        baseUrl: env.API_URL!,
        username: env.API_USERNAME!,
        password: env.API_PASSWORD!,
      }),
    );
  } catch (error) {
    const diagnostics = diagnose(error, context);
    console.error(
      `REST ${label} failed: ${diagnostics.title}`,
      JSON.stringify({
        kind: diagnostics.kind,
        endpoint: context.endpoint,
        causes: diagnostics.causes,
      }),
    );
    throw new BackendRequestError(diagnostics);
  }
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
  return withRestClient(
    "day",
    `/api/v2/analytics/day?date=${date}&radius=${radius}`,
    (client) => getDayAnalyticsCached(client, date, radius),
  );
}

/** Returns the phone-upload sync heartbeat. */
export function getSyncStatus(): Promise<SyncStatusResponse> {
  return withRestClient("sync-status", "/api/v2/sync/status", (client) =>
    client.getSyncStatus(),
  );
}
