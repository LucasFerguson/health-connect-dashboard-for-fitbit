"use client";

import { useState, type PointerEvent, type RefObject } from "react";
import { percentToClockLabel } from "~/domain/dayViewTime";

/**
 * A shared crosshair across all four lanes, following the pointer: one
 * vertical line plus a floating `HH:MM` label, styled like the NOW overlay
 * (same line/label treatment) so the two read as the same kind of thing —
 * just dimmer, so a live NOW line still reads as "the real one" when both
 * are visible. Per the design spec's "Timeline hover" behavior: a single
 * crosshair each lane can read its value against, rather than a per-lane
 * tooltip system.
 *
 * `plotRef` is the same relatively-positioned plot column every other
 * overlay is absolutely positioned against, so the line's `left: %` lines
 * up with the lanes underneath it without any extra coordinate math.
 */
export function HoverCrosshair({
  plotRef,
  dayStartHour,
}: {
  plotRef: RefObject<HTMLDivElement | null>;
  dayStartHour: number;
}) {
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = plotRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    const percent = ((event.clientX - bounds.left) / bounds.width) * 100;
    setHoverPercent(Math.min(100, Math.max(0, percent)));
  };

  return (
    <div
      className="absolute inset-0 z-[8]"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverPercent(null)}
    >
      {hoverPercent === null ? null : (
        <>
          <div
            className="bg-ink-50 pointer-events-none absolute top-0 bottom-0 w-px opacity-60"
            style={{ left: `${hoverPercent}%` }}
          />
          <div
            className="text-ink-50 pointer-events-none absolute top-[22px] font-mono text-[8px] leading-[1.4] font-medium tracking-[.06em] whitespace-nowrap"
            style={{
              left: `${hoverPercent}%`,
              transform:
                hoverPercent > 92
                  ? "translateX(calc(-100% - 4px))"
                  : "translateX(4px)",
            }}
          >
            {percentToClockLabel(hoverPercent, dayStartHour)}
          </div>
        </>
      )}
    </div>
  );
}
