import type { ReactNode } from "react";
import { Card } from "~/components/ui/Card";
import { PageShell } from "~/components/ui/PageShell";
import type {
  RecoveryDay,
  RecoverySummary,
} from "~/server/health/getRecoveryAnalytics";
import { displayScore, recoveryStatusLabel } from "~/domain/recovery";
import { RecoveryChart } from "./RecoveryChart";

type Component = RecoveryDay["components"]["sleep"];
type Weights = RecoverySummary["weights"];

const COMPONENTS = [
  { key: "sleep", label: "Sleep" },
  { key: "hrv", label: "HRV" },
  { key: "restingHeartRate", label: "RHR" },
  { key: "sleepConsistency", label: "Consistency" },
] as const;

const RECENT_DAYS = 30;

/**
 * Small mono caption. The shared `Label` is 9px, which is too small to read
 * on a phone, so this page uses its own 11px version.
 */
function Caption({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-ink-200 font-mono text-[11px] tracking-[.08em] uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/** `/recovery`: the recovery model's disclosure, trend and recent days. */
export function RecoveryView({ recovery }: { recovery: RecoverySummary }) {
  const { availability, weights } = recovery;
  const recent = [...recovery.daily]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENT_DAYS);

  return (
    <PageShell maxWidth="max-w-5xl" className="flex flex-col gap-4">
      <Card topAccent="var(--color-recovery)" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-display text-recovery text-2xl tracking-[.12em]">
            RECOVERY
          </h1>
          <Caption>
            Status {recovery.status} · Model {recovery.algorithmVersion}
          </Caption>
          {recovery.provisional ? (
            <span className="border-strain/60 text-strain-text border px-2 py-0.5 font-mono text-[11px] tracking-[.1em]">
              PROVISIONAL
            </span>
          ) : null}
        </div>
        {recovery.provisional ? (
          <p className="text-strain-text text-sm">
            Scores are provisional: the model is still being validated and
            values may change.
          </p>
        ) : null}
        <p className="text-ink-100 text-sm">{recovery.methodology}</p>
        {recovery.limitations.length > 0 ? (
          <ul className="text-ink-200 list-disc pl-5 text-xs leading-5">
            {recovery.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap">
          <Stat label="Weights" className="col-span-2">
            Sleep {pct(weights.sleep)} · HRV {pct(weights.hrv)} · RHR{" "}
            {pct(weights.restingHeartRate)} · Consistency{" "}
            {pct(weights.sleepConsistency)}
          </Stat>
          <Stat label="Publishable days">
            {availability.publishableDayCount}
          </Stat>
          <Stat label="Complete days">{availability.completeDayCount}</Stat>
          <Stat label="Available">{availability.available ? "Yes" : "No"}</Stat>
        </div>
        {availability.reasons.length > 0 ? (
          <p className="text-ink-200 text-xs">
            {availability.reasons.join(" · ")}
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <Caption>Score trend · scored days only</Caption>
        <RecoveryChart daily={recovery.daily} />
      </Card>

      <Card className="flex flex-col gap-1">
        <h2 className="text-ink-50 text-sm font-semibold">
          Last {RECENT_DAYS} days
        </h2>
        <p className="text-ink-200 text-xs">
          Each input shows its weight in the model, its score, then the
          day&apos;s value against your baseline. Tap a day for its score
          details.
        </p>
        {recent.length === 0 ? (
          <p className="text-ink-200 mt-2 text-sm">No recovery days yet.</p>
        ) : (
          <ul className="divide-ink-500 divide-y">
            {recent.map((day) => (
              <DayRow key={day.id} day={day} weights={weights} />
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}

function DayRow({ day, weights }: { day: RecoveryDay; weights: Weights }) {
  const score = displayScore(day);
  const status = recoveryStatusLabel(day);
  return (
    <li className="flex flex-col gap-2 py-3">
      {/* The day header doubles as the toggle for the score's quality
          details, so the extra fields cost no space until asked for. */}
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 select-none sm:min-h-9 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden
              className="text-ink-200 inline-block w-3 transition-transform group-open:rotate-90"
            >
              ›
            </span>
            <time
              dateTime={day.date}
              title={day.date}
              className="text-ink-50 text-sm font-semibold"
            >
              {weekday(day.date)}
            </time>
            <span className="text-ink-200 hidden text-xs sm:inline">
              · score details
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {score !== null && day.band ? (
              <span className="border-ink-500 text-ink-100 border px-1.5 py-0.5 font-mono text-[11px] tracking-[.08em] uppercase">
                {day.band}
              </span>
            ) : null}
            <span
              className={
                score === null
                  ? "text-ink-200 text-2xl leading-none font-semibold"
                  : "text-recovery text-2xl leading-none font-semibold tabular-nums"
              }
            >
              {score ?? "—"}
            </span>
          </span>
        </summary>
        <DayDetails day={day} />
      </details>
      {status || day.quality.reasons.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="Flags">
          {status ? <li className="text-ink-100 py-0.5">{status}</li> : null}
          {day.quality.reasons.map((reason) => (
            <li
              key={reason}
              className="border-strain/40 text-strain-text border px-1.5 py-0.5"
            >
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-4 sm:gap-x-3">
        {COMPONENTS.map(({ key, label }) => (
          <ComponentCell
            key={key}
            label={label}
            weight={weights[key]}
            component={day.components[key]}
          />
        ))}
      </div>
    </li>
  );
}

function ComponentCell({
  label,
  weight,
  component,
}: {
  label: string;
  weight: number;
  component: Component;
}) {
  return (
    // A table-like row on phones (input · weight | score | value vs
    // baseline); a small boxed cell in a four-column row from `sm` up.
    <div className="flex items-baseline gap-3 sm:flex-col sm:gap-0.5 sm:border sm:border-white/10 sm:bg-white/[0.02] sm:px-2.5 sm:py-1.5">
      <div className="flex w-32 shrink-0 items-baseline gap-1.5 sm:w-full sm:justify-between">
        <Caption>{label}</Caption>
        <span className="text-ink-200 font-mono text-[11px]">
          {pct(weight)}
        </span>
      </div>
      {component ? (
        <span className="contents sm:flex sm:items-baseline sm:gap-2">
          <span className="text-ink-50 w-9 text-sm font-semibold tabular-nums sm:w-auto sm:text-base">
            {round(component.score)}
          </span>
          <span className="text-ink-200 ml-auto text-right text-xs tabular-nums sm:ml-0 sm:text-left">
            {round(component.value)} vs{" "}
            {component.baseline === null ? "—" : round(component.baseline)}{" "}
            {component.unit}
          </span>
        </span>
      ) : (
        <span className="text-ink-200 text-sm sm:text-base">—</span>
      )}
    </div>
  );
}

/** The quality metadata behind a day's score, shown when its header opens. */
function DayDetails({ day }: { day: RecoveryDay }) {
  const { quality } = day;
  return (
    <dl className="text-ink-100 border-ink-500 mt-1 mb-1 grid grid-cols-2 gap-x-4 gap-y-2 border-l-2 py-1 pl-3 text-xs sm:grid-cols-4">
      <Detail label="Day status">{day.status}</Detail>
      <Detail label="Provisional">{yesNo(day.provisional)}</Detail>
      <Detail label="Estimate basis">{quality.estimateBasis}</Detail>
      <Detail label="Publishable">{yesNo(quality.publishable)}</Detail>
      <Detail label="Complete">{yesNo(quality.complete)}</Detail>
      <Detail label="Available weight">{share(quality.availableWeight)}</Detail>
      <Detail label="Baseline window">
        {days(quality.baselineWindowDays)}
      </Detail>
      <Detail label="Min. baseline">{days(quality.minimumBaselineDays)}</Detail>
      {COMPONENTS.map(({ key, label }) => (
        <Detail key={key} label={`${label} baseline`}>
          {days(day.components[key]?.baselineDays)}
        </Detail>
      ))}
    </dl>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt>
        <Caption>{label}</Caption>
      </dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function Stat({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <Caption>{label}</Caption>
      <span className="text-ink-50 text-sm">{children}</span>
    </div>
  );
}

const pct = (weight: number) => `${Math.round(weight * 100)}%`;
const round = (value: number) =>
  Math.abs(value) >= 10 ? Math.round(value).toString() : value.toFixed(1);
/** A weight share: the API sends 0–1 fractions, but tolerate a 0–100 value. */
const share = (value: number) =>
  value <= 1 ? pct(value) : `${Math.round(value)}%`;
const days = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${value} days`;
const yesNo = (value: boolean | null | undefined) =>
  value === null || value === undefined ? "—" : value ? "Yes" : "No";

/** "Sat, Oct 17" from an ISO date, read as a calendar date (no time zone). */
function weekday(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
