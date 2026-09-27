import type { HealthDay } from "~/domain/dayView";
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
        footerLabels={["HRV", "RHR", "RESP", "SKIN"]}
        status={recovery.status}
        note={recovery.note}
      />
      <PlaceholderPillarCard
        label="STRAIN"
        hue="var(--color-strain)"
        footerLabels={["STEPS", "KCAL", "ZONE 3+"]}
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
