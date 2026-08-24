import type {
  HealthSnapshot,
  RawHealthData,
  SleepSession,
  StepsObservation,
} from "~/domain/health";
import { runPipeline } from "../../../pipeline/runPipeline";
import { createHealthRepository } from "./createHealthRepository";

export interface DayViewSnapshot {
  snapshot: HealthSnapshot;
  /** Raw steps interval observations. Not part of `HealthSnapshot` today —
   * only daily step totals are threaded into the shared analytics — but the
   * day view's movement lane needs hour-level buckets, so this fetches the
   * raw observations directly from the repository alongside the rest of
   * the snapshot. */
  steps: StepsObservation[];
  /** Raw sleep sessions (same data as `snapshot.sleepSessions`, re-exported
   * here for call-site clarity since the sleep lane reads it directly). */
  sleepSessions: SleepSession[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * The Health Connect API returns full history in one call (no date
 * filtering) and every page in this app currently re-runs that full
 * login-plus-six-fetch round trip on every request (`force-dynamic`
 * everywhere). That makes each page load pay the same live-network cost
 * regardless of whether the requested day already closed. Cache the raw
 * response in-memory (module scope, single Node process) so repeated loads
 * within the window — e.g. stepping back and forth across recent days —
 * don't each re-hit the upstream server.
 *
 * Next's `unstable_cache` was tried first but rejects payloads over 2MB;
 * this dataset runs ~9MB, so it silently fell through to an uncached fetch
 * on every request. A plain in-memory cache has no such limit and is a
 * better fit for a single self-hosted process anyway.
 *
 * A short TTL (rather than "forever" for past days) keeps today's
 * still-arriving data reasonably fresh without extra plumbing to detect
 * "has this day closed".
 */
let cachedHealthData: { data: RawHealthData; fetchedAt: number } | null = null;

async function getCachedHealthData(): Promise<RawHealthData> {
  if (
    cachedHealthData &&
    Date.now() - cachedHealthData.fetchedAt < CACHE_TTL_MS
  ) {
    return cachedHealthData.data;
  }
  const { repository } = createHealthRepository();
  const data = await repository.getHealthData();
  cachedHealthData = { data, fetchedAt: Date.now() };
  return data;
}

/**
 * Fetches everything the day view needs in one repository call: the shared
 * `HealthSnapshot` (pillar/panel analytics, daily summaries for the strip)
 * plus the raw steps observations required to bucket movement by hour,
 * which the shared snapshot doesn't currently carry.
 */
export async function getDayViewSnapshot(): Promise<DayViewSnapshot> {
  const { source } = createHealthRepository();
  const healthData = await getCachedHealthData();
  const { analytics } = await runPipeline(healthData);

  return {
    snapshot: {
      generatedAt: new Date().toISOString(),
      source,
      sleepSessions: healthData.sleepSessions,
      analytics,
    },
    steps: healthData.steps,
    sleepSessions: healthData.sleepSessions,
  };
}
