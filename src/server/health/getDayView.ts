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
import type { DayRawRecords, DayViewData } from "~/domain/dayView";
import { axisStartMs } from "~/domain/dayViewTime";
import { buildHeartRateDetail } from "~/domain/heartRateDetail";
import { buildStepDetail } from "~/domain/stepDetail";
import { adaptDayView, dayStripRange } from "./adapters/dayAdapter";
import { withAnalytics, withViewer } from "./graphql/fetchAnalytics";
import {
  DAY_RAW_RECORDS_QUERY,
  DAY_QUERY,
  DAY_TIME_ZONE_QUERY,
} from "./graphql/dayQuery";

/** The day view model for `date`, with its 15-day strip. Throws when
 * GraphQL can't serve it; see `withAnalytics`. */
export function getDayView(date: string): Promise<DayViewData> {
  return withAnalytics(
    "day",
    DAY_QUERY,
    (analytics) => adaptDayView(analytics, new Date()),
    { date, range: dayStripRange(date) },
  );
}

/**
 * The day's raw HR samples and step records, bucketed for the timeline. The
 * page streams this in after the rest of the day view (it's ~1.6 MB of
 * samples a day from GraphQL), so it never rejects: any failure, including
 * an expired session, resolves to nulls and the lanes keep the backend's
 * hourly aggregates. The day query has already handled sign-in by then.
 */
export async function getDayRawRecords(
  date: string,
  timeZone: string,
): Promise<DayRawRecords> {
  const startMs = axisStartMs(date, 0, timeZone);
  const range = {
    start: new Date(startMs).toISOString(),
    endExclusive: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  };
  try {
    return await withViewer(
      "day-raw-records",
      DAY_RAW_RECORDS_QUERY,
      ({ sourceRecords }) => ({
        heartRateDetail: buildHeartRateDetail(
          sourceRecords.heartRate.records,
          startMs,
        ),
        stepDetail: buildStepDetail(sourceRecords.steps, startMs),
      }),
      { range },
    );
  } catch (error) {
    console.error("[day] raw records unavailable", error);
    return { heartRateDetail: null, stepDetail: null };
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
