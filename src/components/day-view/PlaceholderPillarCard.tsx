import { Card } from "~/components/ui/Card";
import { Track } from "~/components/ui/Track";
import { StatValue } from "~/components/ui/StatValue";
import { PillarFooter, PillarHeader } from "./SleepPillarCard";

/**
 * Shared shell for the RECOVERY and STRAIN pillar cards. Neither score
 * exists in this app's backend yet — there's no HRV, respiratory rate,
 * skin temperature, or a modeled recovery/strain algorithm (see
 * backend-data-questions.md). Rather than fabricate numbers, this renders
 * the correct card geometry with an em-dash value and a visible
 * "not yet modeled" note, so the layout is ready to wire up once those
 * pipelines exist.
 */
export function PlaceholderPillarCard({
  label,
  hue,
  footerLabels,
}: {
  label: string;
  hue: string;
  footerLabels: string[];
}) {
  return (
    <Card topAccent={hue}>
      <PillarHeader label={label} hue={hue} qualifier="NOT YET MODELED" />
      <StatValue value="—" context="No pipeline yet" className="my-[7px]" />
      <Track fillPercent={0} fillColor={hue} heightPx={7} />
      <PillarFooter
        items={footerLabels.map((item): [string, string] => [item, "—"])}
      />
    </Card>
  );
}
