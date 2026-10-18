"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { Card } from "~/components/ui/Card";
import { Spinner } from "~/components/ui/Spinner";
import type { DayRawRecords, HealthDay } from "~/domain/dayView";
import type { StepSource } from "~/domain/stepDetail";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import { HeartRateLane, type HeartRateChartMode } from "./HeartRateLane";
import { HoverCrosshair } from "./HoverCrosshair";
import { MovementLane } from "./MovementLane";
import { PlanLane } from "./PlanLane";
import { SleepStageLane } from "./SleepStageLane";
import { TimeAxisLabels } from "./TimeAxisLabels";
import { TimelineGutter } from "./TimelineGutter";
import { TimelineOverlays } from "./TimelineOverlays";
import { HR_RAMP } from "./timelineConstants";

const MODE_STORAGE_KEY = "day-view:hr-chart-mode";

/** The viewer's last candles/line choice. Storage can throw (private
 * windows, blocked site data), so it falls back to candles. */
function useHeartRateChartMode() {
  const [mode, setMode] = useState<HeartRateChartMode>("candles");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "candles" || saved === "line") setMode(saved);
    } catch {}
  }, []);
  const choose = (next: HeartRateChartMode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {}
  };
  return [mode, choose] as const;
}

/** How finely a step source records, from its typical record length. */
function stepResolutionLabel(source: StepSource): string {
  const minutes = source.typicalMinutes;
  if (minutes < 0.95) return "SUB-MINUTE RECORDS";
  if (minutes < 90) return `${Math.round(minutes)}-MIN RECORDS`;
  return `${Math.round(minutes / 60)}-HOUR RECORDS`;
}

const selectClass =
  "border-ink-500 bg-ink-850 text-ink-0 hover:border-ink-300 focus-visible:outline-brand-400 max-w-[11rem] cursor-pointer border px-1.5 py-1 font-mono text-[11px] tracking-[.06em] disabled:cursor-not-allowed disabled:opacity-60 sm:py-0.5 sm:text-[9px]";

interface TimelineProps {
  day: HealthDay;
  dayStartHour: number;
  isToday: boolean;
  isPastDay: boolean;
  nowIso: string;
  nowPercent: number;
  timeZone: string;
  restingHeartRateBpm: number | null;
}

/** The viewer's dropdown choices, kept above the Suspense boundary so they
 * survive the swap from the hourly placeholder to the detailed lanes. */
interface TimelineChoices {
  chosenMode: HeartRateChartMode;
  setMode: (mode: HeartRateChartMode) => void;
  chosenStepSource: string | null;
  setStepSource: (source: string) => void;
}

/**
 * The 24-hour timeline — the core of the day view. Four lanes (HR, sleep
 * stages, movement, plan) share one time axis built from
 * `~/domain/dayViewTime`'s shared math, so a heart-rate bump can be read
 * straight down into "REM".
 *
 * The HR and steps lanes draw the day's raw samples and step records
 * (`rawRecords`), which the page streams in after everything else: until
 * they arrive (or if they can't be read) those lanes show the backend's
 * hourly `day.timeline.*` aggregates. The other lanes always come from
 * `day.timeline.*`. Auto-refreshes and other transitions keep the detailed
 * lanes on screen rather than dropping back to the placeholder.
 */
export function DayViewTimeline({
  rawRecords,
  ...props
}: TimelineProps & { rawRecords: Promise<DayRawRecords> }) {
  const [chosenMode, setMode] = useHeartRateChartMode();
  const [chosenStepSource, setStepSource] = useState<string | null>(null);
  const choices = { chosenMode, setMode, chosenStepSource, setStepSource };
  return (
    <Suspense
      fallback={
        <TimelineCard {...props} {...choices} raw={null} loadingDetail />
      }
    >
      <DetailedTimeline {...props} {...choices} rawRecords={rawRecords} />
    </Suspense>
  );
}

function DetailedTimeline({
  rawRecords,
  ...props
}: TimelineProps & TimelineChoices & { rawRecords: Promise<DayRawRecords> }) {
  return (
    <TimelineCard {...props} raw={use(rawRecords)} loadingDetail={false} />
  );
}

function TimelineCard({
  day,
  raw,
  loadingDetail,
  chosenMode,
  setMode,
  chosenStepSource,
  setStepSource,
  dayStartHour,
  isToday,
  isPastDay,
  nowIso,
  nowPercent,
  timeZone,
  restingHeartRateBpm,
}: TimelineProps &
  TimelineChoices & {
    raw: DayRawRecords | null;
    /** The raw records are still on their way. */
    loadingDetail: boolean;
  }) {
  const heartRateDetail = raw?.heartRateDetail ?? null;
  const stepDetail = raw?.stepDetail ?? null;
  const plotRef = useRef<HTMLDivElement>(null);
  // The line needs the raw samples; without them only hourly candles exist.
  const mode = heartRateDetail ? chosenMode : "candles";
  const hrLabel = !heartRateDetail
    ? "HOURLY CANDLES"
    : mode === "line"
      ? "EVERY SAMPLE"
      : `${heartRateDetail.candleMinutes}-MIN CANDLES`;
  // Several apps count the same steps, so the lane shows one at a time;
  // the default is the finest-grained (`stepDetail.sources[0]`).
  const stepSource =
    stepDetail?.sources.find((item) => item.source === chosenStepSource) ??
    stepDetail?.sources[0] ??
    null;
  const stepsLabel = stepSource ? stepResolutionLabel(stepSource) : "HOURLY";

  return (
    <Card
      notchSize={16}
      padding="px-5 pt-3.5 pb-3"
      className="flex min-h-[500px] flex-1 flex-col md:min-h-0"
    >
      <div className="mb-[11px] flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <span className="font-display text-[17px] tracking-[.12em]">
          24-HOUR TIMELINE
        </span>
        <label className="text-ink-200 flex items-center gap-1.5 font-mono text-[11px] tracking-[.08em] sm:text-[9px]">
          HR
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as HeartRateChartMode)
            }
            disabled={!heartRateDetail}
            title={
              heartRateDetail
                ? undefined
                : loadingDetail
                  ? "Loading this day's heart-rate samples…"
                  : "Raw heart-rate samples couldn't be read for this day, so only the hourly candles are available."
            }
            className={selectClass}
          >
            <option value="candles">CANDLESTICK</option>
            <option value="line">LINE</option>
          </select>
        </label>
        {stepDetail && stepSource ? (
          <label className="text-ink-200 flex items-center gap-1.5 font-mono text-[11px] tracking-[.08em] sm:text-[9px]">
            STEPS
            <select
              value={stepSource.source}
              onChange={(event) => setStepSource(event.target.value)}
              className={selectClass}
            >
              {stepDetail.sources.map((item) => (
                <option key={item.source} value={item.source}>
                  {healthSourceLabel(item.source).toUpperCase()} ·{" "}
                  {item.records.length} RECORDS
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="text-ink-200 flex items-center gap-2 font-mono text-[11px] sm:ml-auto sm:text-[8.5px]">
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
            detail={heartRateDetail}
            mode={mode}
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
            source={stepSource}
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

          <HoverCrosshair
            plotRef={plotRef}
            day={day}
            heartRateDetail={heartRateDetail}
            stepSource={stepSource}
            dayStartHour={dayStartHour}
          />
        </div>
      </div>

      {/* What resolution each lane is drawn at; the dropdowns above pick
          the HR view and the step app. */}
      <p className="text-ink-200 mt-2 flex items-center gap-2 font-mono text-[11px] tracking-[.08em] sm:text-[9px]">
        HR {hrLabel} · STEPS {stepsLabel}
        {loadingDetail ? (
          <>
            <Spinner size={9} />
            LOADING EVERY SAMPLE…
          </>
        ) : null}
      </p>
    </Card>
  );
}
