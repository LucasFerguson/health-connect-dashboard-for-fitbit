import { MigratedPage } from "~/components/migration/MigratedPage";
import type { MetricAnalytics } from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";
import {
  getMetricSeries,
  selectMetricSeries,
} from "~/server/health/getMetricSeries";
import { MetricDetailPage } from "./MetricDetailPage";

/**
 * The GraphQL field backing each page, for the migration notice. Kept beside
 * the kind switch so the banner can't drift from what is actually read.
 */
const graphqlSource: Record<MetricKind, string> = {
  steps: "viewer.analytics.steps",
  calories: "viewer.analytics.activeCalories",
  "heart-rate": "viewer.analytics.restingHeartRate",
  weight: "viewer.analytics.weight",
};

/**
 * Shared body of /steps, /calories, /resting-heart-rate and /weight.
 *
 * This component owns the fetch, so it also renders `MigratedPage`: the notice
 * has to reflect which path actually served the data, and only the code doing
 * the fetching knows that. The four route files therefore pass a kind and
 * nothing else — they can no longer disagree with reality about their status.
 */
export async function HealthMetricPage({
  kind,
  selectedDate,
}: {
  kind: MetricKind;
  selectedDate?: string;
}) {
  const page = await getMetricSeries();

  // Falls back to the legacy pipeline when GraphQL can't serve the page, so it
  // still renders and the notice reports which path actually served it.
  let analytics: MetricAnalytics;
  let secondaryAnalytics: MetricAnalytics | undefined;
  if (page) {
    analytics = selectMetricSeries(kind, page.data);
    // Calories charts active against total energy.
    secondaryAnalytics =
      kind === "calories" ? page.data.totalCalories : undefined;
  } else {
    const snapshot = await getHealthSnapshot();
    analytics = selectLegacyAnalytics(kind, snapshot.analytics);
    secondaryAnalytics =
      kind === "calories" ? snapshot.analytics.totalCalories : undefined;
  }

  return (
    <MigratedPage run={page?.run ?? null} source={graphqlSource[kind]}>
      <MetricDetailPage
        kind={kind}
        analytics={analytics}
        secondaryAnalytics={secondaryAnalytics}
        selectedDate={validDate(selectedDate) ? selectedDate : undefined}
      />
    </MigratedPage>
  );
}

function selectLegacyAnalytics(
  kind: MetricKind,
  analytics: Awaited<ReturnType<typeof getHealthSnapshot>>["analytics"],
): MetricAnalytics {
  switch (kind) {
    case "steps":
      return analytics.steps;
    case "calories":
      return analytics.activeCalories;
    case "heart-rate":
      return analytics.restingHeartRate;
    case "weight":
      return analytics.weight;
  }
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
