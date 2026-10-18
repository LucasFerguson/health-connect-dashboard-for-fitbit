import type { HealthDay } from "~/domain/dayView";
import {
  RECOVERY_GREEN_FROM,
  RECOVERY_YELLOW_FROM,
  RECOVERY_ZONE_COLOR,
  recoveryZone,
  supportingMetricDisplay as show,
} from "~/domain/dayViewPresentation";
import {
  formatHrv,
  formatTemperatureDeviation,
} from "~/features/health/metricFormatters";
import { PlaceholderPillarCard } from "./PlaceholderPillarCard";
import { SleepPillarCard } from "./SleepPillarCard";

export function PillarRow({
  day,
  timeZone,
}: {
  day: HealthDay;
  timeZone: string;
}) {
  const { recovery, strain } = day.headlineScores;
  const supporting = day.supportingMetrics;

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-3">
      <SleepPillarCard
        sleepDuration={day.headlineScores.sleepDuration}
        sleepNeed={day.headlineScores.sleepNeed}
        timeZone={timeZone}
      />
      <PlaceholderPillarCard
        label="RECOVERY"
        hue="var(--color-recovery)"
        footer={[
          ["HRV", show(supporting.hrv, formatHrv)],
          ["RHR", show(supporting.restingHeartRate, formatWhole)],
          ["RESP", show(supporting.respiratoryRate, formatTenths)],
          // Signed deviation from baseline, never an absolute temperature.
          [
            "SKIN",
            show(
              supporting.skinTemperatureDeviation,
              formatTemperatureDeviation,
            ),
          ],
        ]}
        status={recovery.status}
        note={recovery.note}
        value={recovery.value}
        scaleMax={100}
        formatValue={formatWhole}
        hueForValue={(score) => RECOVERY_ZONE_COLOR[recoveryZone(score)]}
        zones={RECOVERY_ZONES}
        // The backend marks every recovery score provisional; `partial`
        // means some inputs were missing and the rest were reweighted.
        qualifier={
          recovery.status === "partial"
            ? "PROVISIONAL · PARTIAL"
            : "PROVISIONAL"
        }
      />
      <PlaceholderPillarCard
        label="STRAIN"
        hue="var(--color-strain)"
        footer={[
          ["STEPS", show(supporting.steps, formatWhole)],
          ["KCAL", show(supporting.calories, formatWhole)],
          ["ZONE 3+", show(supporting.zone3AndAbove, formatMinutes)],
        ]}
        status={strain.status}
        note={strain.note}
        value={strain.status === "available" ? strain.value : null}
        qualifier={
          strain.status === "available" ? "EXPERIMENTAL ESTIMATE" : undefined
        }
      />
    </div>
  );
}

/** WHOOP-style red/yellow/green bands along the recovery bar. */
const RECOVERY_ZONES = [
  { from: 0, to: RECOVERY_YELLOW_FROM, color: RECOVERY_ZONE_COLOR.red },
  {
    from: RECOVERY_YELLOW_FROM,
    to: RECOVERY_GREEN_FROM,
    color: RECOVERY_ZONE_COLOR.yellow,
  },
  { from: RECOVERY_GREEN_FROM, to: 100, color: RECOVERY_ZONE_COLOR.green },
];

const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const tenths = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const formatWhole = (value: number) => whole.format(value);
const formatTenths = (value: number) => tenths.format(value);
const formatMinutes = (value: number) => `${whole.format(value)}m`;
