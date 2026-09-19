import { Spinner } from "~/components/ui/Spinner";

interface DashboardStatusBarProps {
  state: "loading" | "ready" | "stale";
  generatedAt?: string;
}

export function DashboardStatusBar({
  state,
  generatedAt,
}: DashboardStatusBarProps) {
  const loading = state === "loading";
  const stale = state === "stale";

  return (
    <section
      className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-sm"
      aria-live="polite"
      aria-busy={loading}
      aria-label="Dashboard loading status"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {loading ? (
          <Spinner size={13} color="var(--color-brand-text)" />
        ) : (
          <span
            className={`block size-2 ${
              stale
                ? "bg-amber-400 shadow-[0_0_10px_theme(colors.amber.400)]"
                : "bg-recovery shadow-[0_0_10px_var(--color-recovery)]"
            }`}
            aria-hidden
          />
        )}
        <div>
          <p className="font-mono text-[10px] font-medium tracking-[.12em] text-white/90 uppercase">
            {loading
              ? "Assembling your overview"
              : stale
                ? "Showing last known data"
                : "Dashboard ready"}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {loading
              ? "The page frame is ready. Health data and charts are loading."
              : stale
                ? "The latest refresh failed. Retrying in the background."
                : "Health data and interactive charts are available."}
          </p>
        </div>
      </div>

      <ol
        className="flex items-center gap-2 font-mono text-[9px] tracking-[.08em] uppercase"
        aria-label="Loading stages"
      >
        <Stage label="Frame" state="complete" />
        <Connector />
        <Stage label="Data" state={loading ? "active" : "complete"} />
        <Connector />
        <Stage label="Charts" state={loading ? "waiting" : "complete"} />
      </ol>

      {!loading && generatedAt ? (
        <time
          dateTime={generatedAt}
          title={generatedAt}
          className="w-full font-mono text-[9px] tracking-[.08em] text-white/35 uppercase sm:w-auto"
        >
          Snapshot {formatUtcTimestamp(generatedAt)}
        </time>
      ) : null}
    </section>
  );
}

function Stage({
  label,
  state,
}: {
  label: string;
  state: "complete" | "active" | "waiting";
}) {
  const tone =
    state === "complete"
      ? "text-recovery"
      : state === "active"
        ? "text-brand-text"
        : "text-white/25";

  return (
    <li className={`flex items-center gap-1.5 ${tone}`}>
      <span
        className={`block size-1.5 ${
          state === "active"
            ? "dashboard-status-pulse bg-brand-400"
            : state === "complete"
              ? "bg-recovery"
              : "bg-white/20"
        }`}
        aria-hidden
      />
      {label}
    </li>
  );
}

function Connector() {
  return <li className="h-px w-3 bg-white/10" aria-hidden />;
}

function formatUtcTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "loaded";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
