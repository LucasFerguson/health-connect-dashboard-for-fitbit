"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { HealthDay } from "~/domain/dayView";
import { valuesAtInstant, type InstantValues } from "~/domain/dayViewInstant";
import {
  formatClock,
  formatHourLabel,
  percentToInstantMs,
} from "~/domain/dayViewTime";
import { formatSteps } from "~/features/health/metricFormatters";
import { SLEEP_STAGE_STYLE } from "./timelineConstants";

/** Gap between the crosshair line and the readout card, px. */
const CARD_OFFSET_PX = 8;
/** Minimum distance the card keeps from the visible edge, px. */
const EDGE_MARGIN_PX = 4;
/** Width assumed before the card has been measured once. */
const FALLBACK_CARD_WIDTH_PX = 160;

interface HoverPosition {
  percent: number;
  /** Cursor x in viewport coordinates. */
  clientX: number;
  /** Horizontal extent actually visible on screen: the plot's scroll
   * container (it scrolls sideways on phones) intersected with the
   * viewport. */
  visibleLeft: number;
  visibleRight: number;
}

/**
 * A shared crosshair across all four lanes, following the pointer: one
 * vertical line plus a floating readout card with the time at the cursor
 * (in the day's own `timeZone`) and what each lane says at that instant —
 * sleep stage, the hour's heart rate and steps, an active workout — per the
 * design spec's "Timeline hover" behavior (one crosshair every lane reports
 * against, not a per-lane tooltip system). Lanes with nothing at that
 * instant are left out of the card rather than shown as zero; the lookup is
 * `valuesAtInstant` in `~/domain/dayViewInstant`.
 *
 * The card sits to the right of the line and flips to the left when it
 * would run past the visible edge. Mouse and pen follow the pointer; on
 * touch a tap pins the crosshair at that spot (a tap outside the plot clears
 * it), and nothing happens on drag, so touch scrolling is left to the
 * browser.
 *
 * `plotRef` is the same relatively-positioned plot column every other
 * overlay is absolutely positioned against, so the line's `left: %` lines
 * up with the lanes underneath it without any extra coordinate math.
 */
export function HoverCrosshair({
  plotRef,
  day,
  dayStartHour,
}: {
  plotRef: RefObject<HTMLDivElement | null>;
  day: Pick<HealthDay, "date" | "timeZone" | "timeline">;
  dayStartHour: number;
}) {
  const [hover, setHover] = useState<HoverPosition | null>(null);
  const [cardWidth, setCardWidth] = useState(FALLBACK_CARD_WIDTH_PX);
  const cardRef = useRef<HTMLDivElement>(null);

  const positionFor = (clientX: number): HoverPosition | null => {
    const plot = plotRef.current;
    const bounds = plot?.getBoundingClientRect();
    if (!plot || !bounds || bounds.width === 0) return null;
    const clip = plot.parentElement?.getBoundingClientRect() ?? bounds;
    const percent = ((clientX - bounds.left) / bounds.width) * 100;
    return {
      percent: Math.min(100, Math.max(0, percent)),
      clientX,
      visibleLeft: Math.max(0, clip.left),
      visibleRight: Math.min(window.innerWidth, clip.right),
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    setHover(positionFor(event.clientX));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    // A touch that turned into a scroll ends in `pointercancel`, not
    // `pointerup`, so only real taps land here.
    if (event.pointerType !== "touch") return;
    setHover(positionFor(event.clientX));
  };

  // Clear a tap-pinned crosshair when the user taps anywhere else.
  const pinned = hover !== null;
  useEffect(() => {
    if (!pinned) return;
    const clearOnOutsideTap = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (plotRef.current?.contains(event.target as Node)) return;
      setHover(null);
    };
    document.addEventListener("pointerdown", clearOnOutsideTap);
    return () => document.removeEventListener("pointerdown", clearOnOutsideTap);
  }, [pinned, plotRef]);

  useLayoutEffect(() => {
    const width = cardRef.current?.offsetWidth;
    if (width && width !== cardWidth) setCardWidth(width);
  }, [hover, cardWidth]);

  let readout: {
    time: string;
    values: InstantValues;
    placeLeft: boolean;
  } | null = null;
  if (hover) {
    const instantMs = percentToInstantMs(
      hover.percent,
      day.date,
      dayStartHour,
      day.timeZone,
    );
    const fitsRight =
      hover.clientX + CARD_OFFSET_PX + cardWidth <=
      hover.visibleRight - EDGE_MARGIN_PX;
    const fitsLeft =
      hover.clientX - CARD_OFFSET_PX - cardWidth >=
      hover.visibleLeft + EDGE_MARGIN_PX;
    readout = {
      time: formatClock(instantMs, day.timeZone),
      values: valuesAtInstant(day, instantMs, dayStartHour),
      placeLeft: !fitsRight && fitsLeft,
    };
  }

  return (
    <div
      className="absolute inset-0 z-[8]"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") setHover(null);
      }}
    >
      {hover === null || readout === null ? null : (
        <>
          <div
            className="bg-ink-50 pointer-events-none absolute top-0 bottom-0 w-px opacity-60"
            style={{ left: `${hover.percent}%` }}
          />
          <div
            ref={cardRef}
            role="status"
            aria-live="polite"
            className="bg-ink-500 border-ink-400 pointer-events-none absolute top-[38px] border px-2 py-[5px] font-mono text-[8.5px] leading-[1.6] tracking-[.04em] whitespace-nowrap shadow-[0_4px_14px_rgba(0,0,0,.45)]"
            style={{
              left: `${hover.percent}%`,
              transform: readout.placeLeft
                ? `translateX(calc(-100% - ${CARD_OFFSET_PX}px))`
                : `translateX(${CARD_OFFSET_PX}px)`,
            }}
          >
            <ReadoutBody time={readout.time} values={readout.values} />
          </div>
        </>
      )}
    </div>
  );
}

function ReadoutBody({
  time,
  values,
}: {
  time: string;
  values: InstantValues;
}) {
  const { sleepStage, heartRate, steps, workout } = values;
  const hourlyHour = heartRate?.hour ?? steps?.hour ?? null;

  return (
    <>
      <div className="text-ink-0 font-medium tracking-[.06em]">{time}</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-2.5">
        {sleepStage ? (
          <Row label="SLEEP">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-[6px] w-[6px]"
                style={{ backgroundColor: stageColor(sleepStage) }}
              />
              {stageLabel(sleepStage)}
            </span>
          </Row>
        ) : null}
        {heartRate ? (
          <Row label="HR">
            {[
              heartRate.mean !== null ? (
                <span key="avg">AVG {Math.round(heartRate.mean)}</span>
              ) : null,
              heartRate.max !== null ? (
                <span key="max" className="text-alert">
                  MAX {Math.round(heartRate.max)}
                </span>
              ) : null,
              heartRate.min !== null ? (
                <span key="min" className="text-ink-100">
                  MIN {Math.round(heartRate.min)}
                </span>
              ) : null,
            ]
              .filter((part) => part !== null)
              .flatMap((part, index) =>
                index === 0
                  ? [part]
                  : [
                      <span key={`sep-${index}`} className="text-ink-200">
                        {" · "}
                      </span>,
                      part,
                    ],
              )}
          </Row>
        ) : null}
        {steps ? <Row label="STEPS">{formatSteps(steps.count)}</Row> : null}
        {workout ? <Row label="WORKOUT">{workout}</Row> : null}
      </dl>
      {hourlyHour !== null ? (
        <div className="text-ink-200 text-[7.5px]">
          HR/STEPS FOR {formatHourLabel(hourlyHour)}–
          {formatHourLabel((hourlyHour + 1) % 24)}
        </div>
      ) : null}
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-200">{label}</dt>
      <dd className="text-ink-50">{children}</dd>
    </>
  );
}

function stageLabel(stage: NonNullable<InstantValues["sleepStage"]>): string {
  return stage === "asleep" ? "ASLEEP" : SLEEP_STAGE_STYLE[stage].label;
}

function stageColor(stage: NonNullable<InstantValues["sleepStage"]>): string {
  return stage === "asleep"
    ? "var(--color-sleep-light)"
    : SLEEP_STAGE_STYLE[stage].color;
}
