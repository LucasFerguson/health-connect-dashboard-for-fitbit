import type {
  HealthDayResponse,
  SyncStatusResponse,
} from "~/server/health/dayAnalyticsSchema";
import {
  buildDayStripCells,
  isDisplayableStatus,
} from "~/domain/dayViewPresentation";
import { timeToPercent } from "~/domain/dayViewTime";
import { AutoRefresh } from "./AutoRefresh";
import { ContextBar } from "./ContextBar";
import { DayStrip } from "./DayStrip";
import { DayViewTimeline } from "./DayViewTimeline";
import { MenuBar } from "./MenuBar";
import { PanelRow } from "./PanelRow";
import { PillarRow } from "./PillarRow";

const DAY_START_HOUR = 0;

/**
 * The DAY view screen: composes the menu bar, context bar, day strip,
 * pillar row, 24-hour timeline, and panel row from the `health-day-v1`
 * contract (`HealthDayResponse`). Every metric renders according to its own
 * `status` — a `missing`/`not_implemented` value never becomes a displayed
 * zero (see `~/domain/dayViewPresentation`'s `isDisplayableStatus`) — and
 * every explanatory string for an unavailable metric comes from the API's
 * own `note`/`availabilityNotes`, never a hardcoded frontend string.
 */
export function DayView({
  response,
  syncStatus,
}: {
  response: HealthDayResponse;
  /** Optional: the phone-ingestion heartbeat for the small sync indicator
   * in the menu bar's right cluster. Fetched separately from the day
   * analytics so a slow/erroring sync-status call never blocks the day
   * itself from rendering. */
  syncStatus: SyncStatusResponse | null;
}) {
  const { day, nearbyDays } = response;
  const { date, timeZone, dayState } = day;

  const isToday =
    dayState !== "future" && day.date === newestRecordedDate(nearbyDays, date);
  const isFuture = dayState === "future";
  const isPastDay = !isFuture && !isToday;

  const now = new Date();
  const nowIso = now.toISOString();
  const nowPercent = isToday
    ? timeToPercent(nowIso, date, DAY_START_HOUR, timeZone)
    : 0;

  const stripCells = buildDayStripCells(nearbyDays, date);

  const restingHeartRate = day.supportingMetrics.restingHeartRate;
  const restingHeartRateBpm =
    isDisplayableStatus(restingHeartRate.status) &&
    typeof restingHeartRate.value === "number"
      ? restingHeartRate.value
      : null;

  return (
    <div className="bg-ink-900 text-ink-0 flex h-screen min-h-[720px] flex-col overflow-hidden">
      <AutoRefresh active={isToday} />
      <MenuBar syncStatus={syncStatus} />
      <ContextBar selectedDate={date} dayState={dayState} />
      <DayStrip cells={stripCells} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-3.5">
        <PillarRow day={day} timeZone={timeZone} />
        <DayViewTimeline
          day={day}
          dayStartHour={DAY_START_HOUR}
          isToday={isToday}
          isPastDay={isPastDay}
          nowIso={nowIso}
          nowPercent={nowPercent}
          timeZone={timeZone}
          restingHeartRateBpm={restingHeartRateBpm}
        />
        <PanelRow day={day} />
      </div>
    </div>
  );
}

/**
 * "Is this the open/current day" is derived from the response itself
 * (never recomputed from the browser/server clock, per requirement #2):
 * the newest date among the fetched days that isn't in the future is the
 * open day. This matches the server-side cache's own `isProbablyOpen`
 * high-water-mark heuristic in `dayAnalyticsCache.ts`, applied here purely
 * for display (e.g. whether to show the NOW line) rather than for caching.
 */
function newestRecordedDate(
  nearbyDays: HealthDayResponse["nearbyDays"],
  focusedDate: string,
): string {
  let newest = focusedDate;
  for (const day of nearbyDays) {
    if (day.dayState !== "future" && day.date > newest) {
      newest = day.date;
    }
  }
  return newest;
}
