import type { HealthConnectClient } from "./healthConnectClient";
import type { HealthDayResponse } from "./dayAnalyticsSchema";

/**
 * Module-scope in-memory cache for `GET /api/v2/analytics/day`, tuned to
 * this endpoint's shape rather than reusing the old blanket "cache
 * everything for 5 minutes" strategy from `getDayViewSnapshot.ts`.
 *
 * The old cache existed because the legacy endpoint returned the entire
 * history on every call; caching was the only way to avoid re-paying that
 * cost on every page load. The new endpoint is already scoped to one
 * `date` + `radius`, so the caching problem is different: most requested
 * days are closed and only change when the analytics worker completes a
 * rebuild (rare, and self-identifying via `runId`), while the current/open
 * day can have new data arrive continuously as the phone uploads.
 *
 * Strategy (two tiers, chosen from the response itself so we never need to
 * independently compute "is this the user's today" against the home time
 * zone before the first fetch):
 *
 * - A day is "closed" once its response comes back with
 *   `day.dayState !== "future"` AND the requested date is not the
 *   most-recently-observed "today" for this `runId` (see `isProbablyOpen`
 *   below). Closed-day entries get a long TTL (`CLOSED_DAY_TTL_MS`) and are
 *   additionally invalidated the moment the server reports a new `runId`
 *   for that entry's radius, since a rebuild is the only thing that can
 *   change a closed day's numbers.
 * - The open/"today" day (and any `future` day, which is cheap/empty
 *   anyway and worth keeping fresh in case the clock ticks over) gets a
 *   short TTL (`OPEN_DAY_TTL_MS`) so newly-synced data shows up quickly
 *   without hammering the upstream server on every render.
 *
 * This is intentionally simple: two TTL tiers plus a runId check, no
 * invalidation bus, no external cache. Single self-hosted Node process,
 * same constraint as the cache it replaces.
 */

const OPEN_DAY_TTL_MS = 30 * 1000; // 30s — today's data can change continuously.
const CLOSED_DAY_TTL_MS = 6 * 60 * 60 * 1000; // 6h — only a rebuild changes a closed day.

interface CacheEntry {
  response: HealthDayResponse;
  fetchedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(date: string, radius: number): string {
  return `${date}::${radius}`;
}

/**
 * A day counts as still-open (and therefore short-TTL) if it is not in the
 * future AND it is the most recent non-future date this process has seen
 * for any request — i.e. the newest "recorded" day observed so far, which
 * in practice is "today" or the last day with any data. Anything strictly
 * older than that high-water mark is treated as closed.
 */
let newestObservedRecordedDate: string | null = null;

function isProbablyOpen(day: HealthDayResponse["day"]): boolean {
  if (day.dayState === "future") return true;
  if (
    newestObservedRecordedDate === null ||
    day.date >= newestObservedRecordedDate
  ) {
    newestObservedRecordedDate = day.date;
    return true;
  }
  return false;
}

/**
 * Fetches `GET /api/v2/analytics/day`, serving from the in-memory cache
 * when a fresh-enough entry exists. On a cache hit for a "closed" entry, an
 * `runId` change (i.e. an analytics rebuild completed) invalidates it even
 * before the long TTL elapses, since a rebuild is the only way a closed
 * day's numbers change; checking that costs nothing extra because
 * `runId` already comes back on very cheap requests (`radius=0`) — callers
 * that want the cheapest possible staleness check can pass `radius: 0`.
 */
export async function getDayAnalyticsCached(
  client: HealthConnectClient,
  date: string,
  radius: number,
): Promise<HealthDayResponse> {
  const key = cacheKey(date, radius);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < cached.ttlMs) {
    return cached.response;
  }

  const response = await client.getDayAnalytics(date, radius);

  // A cached closed-day entry can go stale before its TTL elapses if a
  // rebuild produced a new runId — drop any same-key entry whose runId no
  // longer matches so the next read repopulates from this response.
  if (cached && cached.response.runId !== response.runId) {
    cache.delete(key);
  }

  const open = isProbablyOpen(response.day);
  cache.set(key, {
    response,
    fetchedAt: Date.now(),
    ttlMs: open ? OPEN_DAY_TTL_MS : CLOSED_DAY_TTL_MS,
  });
  return response;
}

/** Test/debug helper: drop every cached entry. Not used by production code
 * paths, but keeps re-runs of ad-hoc scripts deterministic. */
export function clearDayAnalyticsCache(): void {
  cache.clear();
  newestObservedRecordedDate = null;
}
