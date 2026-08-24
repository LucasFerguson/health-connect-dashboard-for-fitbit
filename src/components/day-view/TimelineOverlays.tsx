import { formatClock } from "~/domain/dayViewTime";

/**
 * Overlays spanning all lanes: the "now" line (real — derived from the
 * actual current time) and the future-dim wash from now to the right
 * edge. The design also specifies alarm and bed-target lines, but there's
 * no alarm/bed-target config in this app (see backend-data-questions.md —
 * "are these stored preferences... or would they need to be entered in
 * the app?"), so they're omitted rather than drawn against a fabricated
 * default. Only rendered when the selected date is today; a past day
 * shows neither the line nor the dim, a future day is dimmed entirely by
 * the caller instead (see DayViewTimeline).
 */
export function TimelineOverlays({
  nowIso,
  nowPercent,
  timeZone,
}: {
  nowIso: string;
  nowPercent: number;
  timeZone: string;
}) {
  return (
    <>
      <div
        className="bg-ink-0 absolute top-0 bottom-0 z-[5] w-px"
        style={{ left: `${nowPercent}%` }}
      />
      <div
        className="text-ink-0 absolute top-0 z-[5] translate-x-1 font-mono text-[8px] leading-[1.4] font-medium tracking-[.06em] whitespace-nowrap"
        style={{ left: `${nowPercent}%` }}
      >
        NOW
        <br />
        {formatClock(nowIso, timeZone)}
      </div>
      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 z-[4]"
        style={{
          left: `${nowPercent}%`,
          backgroundColor: "rgba(12,10,17,.55)",
        }}
      />
    </>
  );
}
