import { PlaceholderPillarCard } from "./PlaceholderPillarCard";
import { SleepPillarCard, type SleepPillarData } from "./SleepPillarCard";

export function PillarRow({
  sleep,
  timeZone,
}: {
  sleep: SleepPillarData | null;
  timeZone: string;
}) {
  return (
    <div className="grid shrink-0 grid-cols-3 gap-3">
      <SleepPillarCard data={sleep} timeZone={timeZone} />
      <PlaceholderPillarCard
        label="RECOVERY"
        hue="var(--color-recovery)"
        footerLabels={["HRV", "RHR", "RESP", "SKIN"]}
      />
      <PlaceholderPillarCard
        label="STRAIN"
        hue="var(--color-strain)"
        footerLabels={["STEPS", "KCAL", "ZONE 3+"]}
      />
    </div>
  );
}
