import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { ExploreView } from "~/components/explore/ExploreView";
import { isCoreMetricId } from "~/domain/exploreMetrics";
import {
  parseExploreParams,
  rangeDays,
  resolveSelection,
} from "~/domain/exploreParams";
import { settle } from "~/server/health/backendDiagnostics";
import { getExploreSeries } from "~/server/health/getExploreSeries";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = parseExploreParams(await searchParams);
  const result = await settle(getExploreSeries(rangeDays(parsed.range)));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  const { habitMetrics, series, window } = result.data;
  const selection = resolveSelection(
    parsed,
    (id) => isCoreMetricId(id) || habitMetrics.some((m) => m.id === id),
  );
  return (
    <ExploreView
      initialSelection={selection}
      habitMetrics={habitMetrics}
      series={series}
      window={window}
    />
  );
}
