/**
 * GraphQL-backed reads for `/day` and `/day/[date]`, following the same
 * query-plus-adapter pattern as the other `get*` modules.
 *
 * There is no server-side cache in front of these any more. The REST version
 * kept a two-tier in-memory cache (30s for the open day, 6h for closed ones)
 * because each call paid a fresh REST login; the GraphQL path reuses a cached
 * token and the backend serves prepared day views, so every render reads
 * fresh, like every other page. `AutoRefresh` still re-renders the open day
 * every 30s.
 */
import { unstable_rethrow } from "next/navigation";
import type { DayViewData } from "~/domain/dayView";
import { axisStartMs } from "~/domain/dayViewTime";
import {
  buildHeartRateDetail,
  type HeartRateDetail,
} from "~/domain/heartRateDetail";
import { adaptDayView, dayStripRange } from "./adapters/dayAdapter";
import { withAnalytics, withViewer } from "./graphql/fetchAnalytics";
import {
  DAY_HEART_RATE_QUERY,
  DAY_QUERY,
  DAY_TIME_ZONE_QUERY,
} from "./graphql/dayQuery";

/** The day view model for `date`, with its 15-day strip and, when the raw
 * samples can be read, the high-resolution HR series. Throws when GraphQL
 * can't serve the day itself; see `withAnalytics`. */
export async function getDayView(date: string): Promise<DayViewData> {
  const data = await withAnalytics(
    "day",
    DAY_QUERY,
    (analytics) => adaptDayView(analytics, new Date()),
    { date, range: dayStripRange(date) },
  );
  // Needs the day's time zone to find local midnight, so it runs after the
  // day query rather than beside it.
  const heartRateDetail = await getHeartRateDetail(
    axisStartMs(date, 0, data.day.timeZone),
  );
  return { ...data, heartRateDetail };
}

/** Null when the samples can't be read or there are none; the HR lane then
 * falls back to the backend's hourly candles. */
async function getHeartRateDetail(
  startMs: number,
): Promise<HeartRateDetail | null> {
  const range = {
    start: new Date(startMs).toISOString(),
    endExclusive: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  };
  try {
    return await withViewer(
      "day-heart-rate",
      DAY_HEART_RATE_QUERY,
      (viewer) =>
        buildHeartRateDetail(viewer.sourceRecords.heartRate.records, startMs),
      { range },
    );
  } catch (error) {
    // Lets a sign-in redirect through instead of swallowing it.
    unstable_rethrow(error);
    console.error("[day] heart-rate samples unavailable", error);
    return null;
  }
}

/** The account's home time zone, which decides what "today" is. */
export function getHomeTimeZone() {
  return withAnalytics(
    "day-time-zone",
    DAY_TIME_ZONE_QUERY,
    (analytics) => analytics.timeZone,
  );
}
