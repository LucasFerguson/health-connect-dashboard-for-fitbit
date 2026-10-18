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
import { buildStepDetail, type StepDetail } from "~/domain/stepDetail";
import { adaptDayView, dayStripRange } from "./adapters/dayAdapter";
import { withAnalytics, withViewer } from "./graphql/fetchAnalytics";
import {
  DAY_RAW_RECORDS_QUERY,
  DAY_QUERY,
  DAY_TIME_ZONE_QUERY,
} from "./graphql/dayQuery";

/** The day view model for `date`, with its 15-day strip and, when the raw
 * records can be read, the full-resolution HR and step series. Throws when
 * GraphQL can't serve the day itself; see `withAnalytics`. */
export async function getDayView(date: string): Promise<DayViewData> {
  const data = await withAnalytics(
    "day",
    DAY_QUERY,
    (analytics) => adaptDayView(analytics, new Date()),
    { date, range: dayStripRange(date) },
  );
  // Needs the day's time zone to find local midnight, so it runs after the
  // day query rather than beside it.
  const raw = await getRawRecords(axisStartMs(date, 0, data.day.timeZone));
  return { ...data, ...raw };
}

/** Nulls when the records can't be read or there are none; the lanes then
 * fall back to the backend's hourly aggregates. */
async function getRawRecords(startMs: number): Promise<{
  heartRateDetail: HeartRateDetail | null;
  stepDetail: StepDetail | null;
}> {
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
    // Lets a sign-in redirect through instead of swallowing it.
    unstable_rethrow(error);
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
