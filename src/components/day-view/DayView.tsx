import type { HealthAnalytics } from "~/domain/analytics";
import type { SleepSession, StepsObservation } from "~/domain/health";
import {
  bucketStepsByHour,
  buildSleepStageSegments,
  stageMinutesByKind,
} from "~/domain/dayViewData";
import { dateKeyOf, timeToPercent } from "~/domain/dayViewTime";
import { ContextBar } from "./ContextBar";
import { DayStrip, type DayStripCell } from "./DayStrip";
import { DayViewTimeline } from "./DayViewTimeline";
import { MenuBar } from "./MenuBar";
import { PanelRow } from "./PanelRow";
import { PillarRow } from "./PillarRow";
import type { SleepPillarData } from "./SleepPillarCard";

const DAY_START_HOUR = 0;
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** Shifts a `YYYY-MM-DD` calendar-day key by whole days. This is pure
 * calendar-day arithmetic (not an instant), so UTC-anchored parsing is
 * correct here regardless of `timeZone` — it never crosses a DST boundary
 * mid-calculation the way computing "today" from `Date.now()` would. */
function shiftDate(date: string, days: number): string {
  const instant = Date.parse(`${date}T00:00:00Z`);
  return new Date(instant + days * 86_400_000).toISOString().slice(0, 10);
}

function todayKey(timeZone: string): string {
  return dateKeyOf(new Date().toISOString(), timeZone);
}

/**
 * The DAY view screen: composes the menu bar, context bar, day strip,
 * pillar row, 24-hour timeline, and panel row from real data where it
 * exists (sleep sessions/stages, steps observations, daily analytics
 * summaries) and honest placeholder shells everywhere the design calls
 * for a score or dataset this app's backend doesn't have yet (recovery,
 * strain, HR zones, plan blocks, signals — see backend-data-questions.md).
 */
export function DayView({
  date,
  analytics,
  sleepSessions,
  steps,
  timeZone,
}: {
  date: string;
  analytics: HealthAnalytics;
  sleepSessions: SleepSession[];
  steps: StepsObservation[];
  /** IANA time zone (e.g. "America/Chicago") the day is anchored to —
   * `HEALTH_HOME_TIME_ZONE`, the same setting the analytics pipeline uses
   * for local-day bucketing. Every clock label and axis position on this
   * screen is computed against this zone, not the server's or browser's
   * own zone, so a self-hosted deployment shows the same times regardless
   * of where the Node process or the viewer happens to be. */
  timeZone: string;
}) {
  const now = new Date();
  const today = todayKey(timeZone);
  const isToday = date === today;
  const isPastDay = date < today;

  const daySleep = analytics.dailySleep.find((day) => day.date === date);
  const sessionsEndingOnDate = sleepSessions.filter(
    (session) => session.endAt.slice(0, 10) === date,
  );
  const sleepPillar: SleepPillarData | null = daySleep
    ? (() => {
        const stageTotals = stageMinutesByKind(sessionsEndingOnDate);
        const sorted = [...sessionsEndingOnDate].sort((a, b) =>
          a.startAt.localeCompare(b.startAt),
        );
        return {
          totalMinutes: daySleep.sleepMinutes,
          deepMinutes: stageTotals.deep,
          remMinutes: stageTotals.rem,
          lightMinutes: stageTotals.light,
          awakeMinutes: stageTotals.awake,
          windowStartIso: sorted[0]?.startAt ?? null,
          windowEndIso: sorted.at(-1)?.endAt ?? null,
        };
      })()
    : null;

  const sleepSegments = buildSleepStageSegments(
    sleepSessions,
    date,
    DAY_START_HOUR,
    timeZone,
  );
  const stepBuckets = bucketStepsByHour(
    steps,
    date,
    DAY_START_HOUR,
    now,
    timeZone,
  );

  const restingHeartRateBpm =
    analytics.restingHeartRate.daily.find((day) => day.date === date)?.value ??
    null;

  const nowIso = now.toISOString();
  const nowPercent = isToday
    ? timeToPercent(nowIso, date, DAY_START_HOUR, timeZone)
    : 0;

  const stripCells: DayStripCell[] = Array.from({ length: 11 }, (_, index) => {
    const offset = index - 7;
    const cellDate = shiftDate(date, offset);
    const cellIsFuture = cellDate > today;
    const cellDaily = analytics.dailySleep.find((d) => d.date === cellDate);
    const cellSteps = analytics.steps.daily.find((d) => d.date === cellDate);
    const parsed = new Date(`${cellDate}T00:00:00Z`);
    return {
      date: cellDate,
      weekdayLabel: WEEKDAYS[(parsed.getUTCDay() + 6) % 7]!,
      dayLabel: String(parsed.getUTCDate()),
      sleepFraction: cellDaily
        ? Math.min(1, cellDaily.sleepMinutes / 480)
        : null,
      stepsFraction: cellSteps ? Math.min(1, cellSteps.value / 10_000) : null,
      isFuture: cellIsFuture,
      isSelected: cellDate === date,
    };
  });

  return (
    <div className="bg-ink-900 text-ink-0 flex h-screen min-h-[720px] flex-col overflow-hidden">
      <MenuBar />
      <ContextBar selectedDate={date} timeZone={timeZone} />
      <DayStrip cells={stripCells} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-3.5">
        <PillarRow sleep={sleepPillar} timeZone={timeZone} />
        <DayViewTimeline
          sleepSegments={sleepSegments}
          stepBuckets={stepBuckets}
          dayStartHour={DAY_START_HOUR}
          restingHeartRateBpm={restingHeartRateBpm}
          isToday={isToday}
          isPastDay={isPastDay}
          nowIso={nowIso}
          nowPercent={nowPercent}
          timeZone={timeZone}
        />
        <PanelRow />
      </div>
    </div>
  );
}
