/**
 * Shared plumbing for GraphQL-backed pages, so each page's data module is just
 * a query plus (while the legacy domain types still exist) a thin adapter.
 *
 * Every migrated page needs the same three things, and getting any of them
 * wrong is a real bug rather than a style preference:
 *
 * 1. Skip GraphQL entirely when it isn't configured (the fixture/demo path).
 * 2. Never throw — a transport failure must fall back to the legacy pipeline
 *    so the page still renders and MigrationNotice can report which path
 *    served it. Throwing here 500s a page that has a working fallback.
 * 3. Surface run provenance (`runId`/`algorithmVersion`/`processedAt`)
 *    consistently, so the UI can show which prepared run produced the numbers.
 *
 * This is the React-Server-Component path: it uses `query()` from
 * `registerApolloClient`, which scopes the client and its cache to one
 * request. Client components that need reactivity (polling, refetch) must go
 * through `ApolloNextAppProvider` and the `useQuery`/`useSuspenseQuery` hooks
 * instead — per Apollo's Next.js guidance, RSC queries don't update in the
 * browser.
 */
import type { TypedDocumentNode } from "@apollo/client";
import { isGraphQLConfigured, query } from "../graphqlClient";

/** Provenance of the prepared analytics run that produced a page's numbers. */
export interface RunProvenance {
  runId: string;
  algorithmVersion: string;
  timeZone: string;
  processedAt: string | null;
}

/**
 * Every page query selects these run fields on `viewer.analytics`, so results
 * are constrained to include them. Keeps `withAnalytics` able to extract
 * provenance without each caller re-implementing it.
 */
export interface AnalyticsQueryResult {
  viewer: {
    analytics: {
      runId: string;
      algorithmVersion: string;
      timeZone: string;
      processedAt: string | null;
    };
  };
}

export interface AnalyticsPage<T> {
  /** Page-specific data, mapped by the caller's `select`. */
  data: T;
  run: RunProvenance;
}

/**
 * Runs `document` against HCGateway's GraphQL API and maps the result with
 * `select`. Returns `null` — never throws — when GraphQL can't serve the page,
 * which the caller should treat as "fall back to the legacy pipeline".
 *
 * @param label short name used in the error log, e.g. "sleep-debt"
 */
export async function withAnalytics<TResult extends AnalyticsQueryResult, T>(
  label: string,
  document: TypedDocumentNode<TResult, Record<string, never>>,
  select: (analytics: TResult["viewer"]["analytics"]) => T,
): Promise<AnalyticsPage<T> | null> {
  if (!isGraphQLConfigured()) return null;

  try {
    const { data } = await query({ query: document });
    // Apollo types `data` as possibly undefined: a query can resolve carrying
    // only errors.
    if (!data) return null;
    const { analytics } = data.viewer;
    return {
      data: select(analytics),
      run: {
        runId: analytics.runId,
        algorithmVersion: analytics.algorithmVersion,
        timeZone: analytics.timeZone,
        processedAt: analytics.processedAt,
      },
    };
  } catch (error) {
    console.error(
      `GraphQL ${label} query failed; falling back to legacy pipeline`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
