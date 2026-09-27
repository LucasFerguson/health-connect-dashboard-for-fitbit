import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { HabitsView } from "~/components/habits/HabitsView";
import { parseHabitsParams } from "~/domain/habits";
import { settle } from "~/server/health/backendDiagnostics";
import { getHabits } from "~/server/health/getHabits";

export const dynamic = "force-dynamic";

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const selection = parseHabitsParams(await searchParams);
  const result = await settle(getHabits(selection));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <HabitsView
      habits={result.data.habits}
      period={result.data.period}
      anchor={result.data.anchor}
    />
  );
}
