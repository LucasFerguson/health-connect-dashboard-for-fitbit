import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { LeaderboardView } from "~/components/leaderboard/LeaderboardView";
import { dateKeyOf } from "~/domain/dayViewTime";
import { getLeaderboards } from "~/server/health/getLeaderboards";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const result = await settle(getLeaderboards());
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;
  // "Today" in the viewer's own home time zone, for the staleness notes.
  const viewer = result.data
    .flatMap((board) => board.members)
    .find((member) => member.isViewer);
  const today = dateKeyOf(new Date().toISOString(), viewer?.timeZone ?? "UTC");
  return <LeaderboardView boards={result.data} today={today} />;
}
