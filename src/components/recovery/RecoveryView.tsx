import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import type {
  RecoveryDay,
  RecoverySummary,
} from "~/server/health/getRecoveryAnalytics";
import { RecoveryChart } from "./RecoveryChart";

type Component = RecoveryDay["components"]["sleep"];

const COMPONENTS = [
  { key: "sleep", label: "SLEEP" },
  { key: "restingHeartRate", label: "RHR" },
  { key: "hrv", label: "HRV" },
  { key: "sleepConsistency", label: "CONSISTENCY" },
] as const;

const RECENT_DAYS = 30;

/** `/recovery`: the recovery model's disclosure, trend and recent days. */
export function RecoveryView({ recovery }: { recovery: RecoverySummary }) {
  const { availability, weights } = recovery;
  const recent = [...recovery.daily]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENT_DAYS);

  return (
    <PageShell maxWidth="max-w-5xl" className="flex flex-col gap-4">
      <Card topAccent="var(--color-recovery)" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-recovery text-2xl tracking-[.12em]">
            RECOVERY
          </h1>
          <Label>
            STATUS {recovery.status.toUpperCase()} · MODEL{" "}
            {recovery.algorithmVersion}
          </Label>
          {recovery.provisional ? (
            <span className="border-strain/60 text-strain-text border px-2 py-0.5 font-mono text-[10px] tracking-[.1em]">
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
          <ul className="text-ink-200 list-disc pl-5 text-xs">
            {recovery.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Stat label="WEIGHTS">
            Sleep {pct(weights.sleep)} · HRV {pct(weights.hrv)} · RHR{" "}
            {pct(weights.restingHeartRate)} · Consistency{" "}
            {pct(weights.sleepConsistency)}
          </Stat>
          <Stat label="PUBLISHABLE DAYS">
            {availability.publishableDayCount}
          </Stat>
          <Stat label="COMPLETE DAYS">{availability.completeDayCount}</Stat>
          <Stat label="AVAILABLE">{availability.available ? "Yes" : "No"}</Stat>
        </div>
        {availability.reasons.length > 0 ? (
          <p className="text-ink-200 text-xs">
            {availability.reasons.join(" · ")}
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <Label>SCORE TREND · SCORED DAYS ONLY</Label>
        <RecoveryChart daily={recovery.daily} />
      </Card>

      <Card className="flex flex-col gap-1">
        <Label>LAST {RECENT_DAYS} DAYS</Label>
        {recent.length === 0 ? (
          <p className="text-ink-200 text-sm">No recovery days yet.</p>
        ) : (
          <ul className="divide-ink-500 divide-y">
            {recent.map((day) => (
              <DayRow key={day.id} day={day} />
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}

function DayRow({ day }: { day: RecoveryDay }) {
  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-sm">{day.date}</span>
        {day.score !== null ? (
          <>
            <span className="text-recovery text-xl font-semibold">
              {day.score}
            </span>
            {day.band ? <Label>{day.band}</Label> : null}
          </>
        ) : null}
        <span className="text-ink-100 text-xs">{statusLabel(day)}</span>
      </div>
      {day.quality.reasons.length > 0 ? (
        <p className="text-ink-200 text-[11px]">
          {day.quality.reasons.join(" · ")}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {COMPONENTS.map(({ key, label }) => (
          <ComponentCell
            key={key}
            label={label}
            component={day.components[key]}
          />
        ))}
      </div>
    </li>
  );
}

function ComponentCell({
  label,
  component,
}: {
  label: string;
  component: Component;
}) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      {component ? (
        <span className="text-ink-50 text-xs">
          {round(component.score)}{" "}
          <span className="text-ink-200">
            · {round(component.value)} vs{" "}
            {component.baseline === null ? "—" : round(component.baseline)}{" "}
            {component.unit}
          </span>
        </span>
      ) : (
        <span className="text-ink-200 text-xs">—</span>
      )}
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <span className="text-ink-50 text-sm">{children}</span>
    </div>
  );
}

function statusLabel(day: RecoveryDay) {
  if (day.score === null || day.status === "insufficient_data") {
    return "Not enough physiological data";
  }
  if (day.status === "partial") return "Provisional · Partial";
  return "";
}

const pct = (weight: number) => `${Math.round(weight * 100)}%`;
const round = (value: number) =>
  Math.abs(value) >= 10 ? Math.round(value).toString() : value.toFixed(1);
