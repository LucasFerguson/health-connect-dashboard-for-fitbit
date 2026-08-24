import { Spinner } from "~/components/ui/Spinner";

/**
 * Shown automatically by Next during the server round trip for a day
 * navigation (date stepper, TODAY, day-strip cell). Kept intentionally
 * close to the real screen's chrome shell so it doesn't flash as a
 * different-looking page — just the header bands with a spinner where the
 * content will land.
 */
export default function DayViewLoading() {
  return (
    <div className="bg-ink-900 text-ink-0 flex h-screen min-h-[720px] flex-col overflow-hidden">
      <div className="border-ink-600 bg-ink-950 h-[38px] shrink-0 border-b" />
      <div className="border-ink-600 bg-ink-900 h-10 shrink-0 border-b" />
      <div className="border-ink-600 bg-ink-950 h-[54px] shrink-0 border-b" />
      <div className="flex flex-1 items-center justify-center gap-3">
        <Spinner size={18} />
        <span className="text-ink-200 font-mono text-[10px] tracking-[.1em] uppercase">
          Loading day…
        </span>
      </div>
    </div>
  );
}
