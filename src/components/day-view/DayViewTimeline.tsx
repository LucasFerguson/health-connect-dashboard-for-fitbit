"use client";

import { useRef } from "react";
import { Card } from "~/components/ui/Card";
import type { HourlySteps, SleepStageSegment } from "~/domain/dayViewData";
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
 * read straight down into "REM" even though only the sleep and movement
 * lanes have real backing data today.
 */
export function DayViewTimeline({
  sleepSegments,
  stepBuckets,
  dayStartHour,
  restingHeartRateBpm,
  isToday,
  isPastDay,
  nowIso,
  nowPercent,
  timeZone,
}: {
  sleepSegments: SleepStageSegment[];
  stepBuckets: HourlySteps[];
  dayStartHour: number;
  restingHeartRateBpm: number | null;
  isToday: boolean;
  isPastDay: boolean;
  nowIso: string;
  nowPercent: number;
  timeZone: string;
}) {
  const plotRef = useRef<HTMLDivElement>(null);

  return (
    <Card
      notchSize={16}
      padding="px-5 pt-3.5 pb-3"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="mb-[11px] flex items-baseline gap-3.5">
        <span className="font-display text-[17px] tracking-[.12em]">
          24-HOUR TIMELINE
        </span>
        <span className="text-ink-200 font-mono text-[9px] tracking-[.08em]">
          00:00 → 24:00 · HR CANDLES · SLEEP STAGES · MOVEMENT · PLAN
        </span>
        <div className="text-ink-200 ml-auto flex items-center gap-2 font-mono text-[8.5px]">
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

      <div className="flex min-h-0 flex-1 gap-[9px]">
        <TimelineGutter />
        <div ref={plotRef} className="relative flex min-h-0 flex-1 flex-col">
          <HeartRateLane restingHeartRateBpm={restingHeartRateBpm} />
          <TimeAxisLabels />
          <SleepStageLane segments={sleepSegments} />
          <MovementLane buckets={stepBuckets} dayStartHour={dayStartHour} />
          <PlanLane />

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
