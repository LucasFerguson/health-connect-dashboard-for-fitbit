/**
 * Plan lane (46px) — there is no calendar/schedule/routine data source in
 * this app (see backend-data-questions.md: "the day's schedule as time
 * blocks" is flagged as the one the design doc itself expects is missing).
 * Rather than fabricate plan blocks, this renders an honest empty lane
 * with a short explanation so the layout stays correct and ready for
 * whichever plan-block source gets picked later (calendar, inferred, or
 * user-declared routine).
 */
export function PlanLane() {
  return (
    <div className="border-ink-500 bg-ink-850 relative mt-2 flex h-[46px] shrink-0 items-center justify-center border-l">
      <span className="text-ink-200 px-4 text-center font-mono text-[9px] tracking-[.04em]">
        No schedule source connected yet — plan blocks aren&apos;t modeled.
      </span>
    </div>
  );
}
