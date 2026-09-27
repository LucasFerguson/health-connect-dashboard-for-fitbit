import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { ExploreView } from "~/components/explore/ExploreView";
import { parseExploreParams, rangeDays } from "~/domain/exploreParams";
import { settle } from "~/server/health/backendDiagnostics";
import { getExploreSeries } from "~/server/health/getExploreSeries";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const selection = parseExploreParams(await searchParams);
  const result = await settle(getExploreSeries(rangeDays(selection.range)));
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <ExploreView
      initialSelection={selection}
      series={result.data.series}
      window={result.data.window}
    />
  );
}
