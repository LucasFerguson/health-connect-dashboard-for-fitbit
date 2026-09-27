"use client";

import { useRef } from "react";
import { Card } from "~/components/ui/Card";
import type { HealthDay } from "~/domain/dayView";
import { slotHourLabel } from "~/domain/dayViewTime";
import { HeartRateLane } from "./HeartRateLane";
import { HoverCrosshair } from "./HoverCrosshair";
import { MovementLane } from "./MovementLane";
import { PlanLane } from "./PlanLane";
import { SleepStageLane } from "./SleepStageLane";
import { TimeAxisLabels } from "./TimeAxisLabels";
import { TimelineGutter } from "./TimelineGutter";
import { TimelineOverlays } from "./TimelineOverlays";
import { HR_RAMP } from "./timelineConstants";

/**
 * The 24-hour timeline — the core of the day view. Four lanes (HR
 * candlesticks, sleep stages, movement, plan) share one time axis built
 * from `~/domain/dayViewTime`'s shared math, so a heart-rate bump can be
 * read straight down into "REM". Lane data comes straight from
 * `day.timeline.*` as the backend bucketed it — no local bucketing.
 */
export function DayViewTimeline({
  day,
  dayStartHour,
  isToday,
  isPastDay,
  nowIso,
  nowPercent,
  timeZone,
  restingHeartRateBpm,
}: {
  day: HealthDay;
  dayStartHour: number;
  isToday: boolean;
  isPastDay: boolean;
  nowIso: string;
  nowPercent: number;
  timeZone: string;
  restingHeartRateBpm: number | null;
}) {
  const plotRef = useRef<HTMLDivElement>(null);

  return (
    <Card
      notchSize={16}
      padding="px-5 pt-3.5 pb-3"
      className="flex min-h-[500px] flex-1 flex-col md:min-h-0"
    >
      <div className="mb-[11px] flex items-baseline gap-3.5">
        <span className="font-display text-[17px] tracking-[.12em]">
          24-HOUR TIMELINE
        </span>
        <span className="text-ink-200 hidden font-mono text-[9px] tracking-[.08em] sm:inline">
          {slotHourLabel(0, dayStartHour)} → {slotHourLabel(24, dayStartHour)} ·
          HR CANDLES · SLEEP STAGES · MOVEMENT · PLAN
        </span>
        <div className="text-ink-200 ml-auto hidden items-center gap-2 font-mono text-[8.5px] sm:flex">
          <span>40</span>
          <div className="flex h-[7px] w-[120px]">
            {HR_RAMP.map((color) => (
              <div
                key={color}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>180 BPM AVG</span>
        </div>
      </div>

      {/* Below `sm`, the plot needs its full desktop width to stay legible
          (candles/labels don't reflow), so it gets a min-width and scrolls
          horizontally inside this wrapper instead of shrinking. The gutter
          stays outside the scroll area and pinned via `sticky left-0` so
          the HR/lane axis labels remain visible while lanes scroll under
          them. */}
      <div className="flex min-h-0 flex-1 gap-[9px] overflow-x-auto sm:overflow-x-visible">
        <div className="bg-ink-800 sticky left-0 z-[9] flex shrink-0">
          <TimelineGutter />
        </div>
        <div
          ref={plotRef}
          className="relative flex min-h-0 min-w-[640px] flex-1 flex-col sm:min-w-0"
        >
          <HeartRateLane
            heartRate={day.timeline.heartRate}
            restingHeartRateBpm={restingHeartRateBpm}
          />
          <TimeAxisLabels dayStartHour={dayStartHour} />
          <SleepStageLane
            segments={day.timeline.sleepStages}
            date={day.date}
            dayStartHour={dayStartHour}
            timeZone={timeZone}
          />
          <MovementLane
            hours={day.timeline.steps}
            dayStartHour={dayStartHour}
          />
          <PlanLane schedule={day.timeline.schedule} />

          {isToday ? (
            <TimelineOverlays
              nowIso={nowIso}
              nowPercent={nowPercent}
              timeZone={timeZone}
            />
          ) : isPastDay ? null : (
            <div className="pointer-events-none absolute inset-0 z-[4] bg-[rgba(12,10,17,.55)]" />
          )}

          <HoverCrosshair plotRef={plotRef} dayStartHour={dayStartHour} />
        </div>
      </div>
    </Card>
  );
}
