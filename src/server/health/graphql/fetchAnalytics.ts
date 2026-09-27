/**
 * Shared plumbing for GraphQL-backed pages, so each page's data module is just
 * a query plus a thin adapter.
 *
 * Throws when GraphQL can't serve the page — unconfigured credentials, an
 * unreachable backend, or a response carrying only errors. There is no local
 * fallback: the root `error.tsx` boundary renders a "couldn't load health
 * data" state instead, which is the honest outcome. Never catch this to render
 * an empty page; empty reads as "no health data", not "backend down".
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

interface AnalyticsQueryResult {
  viewer: { analytics: unknown };
}

/**
 * Runs `document` against HCGateway's GraphQL API and maps
 * `viewer.analytics` with `select`.
 *
 * @param label short name used in error messages, e.g. "sleep-debt"
 */
export async function withAnalytics<TResult extends AnalyticsQueryResult, T>(
  label: string,
  document: TypedDocumentNode<TResult, Record<string, never>>,
  select: (analytics: TResult["viewer"]["analytics"]) => T,
): Promise<T> {
  if (!isGraphQLConfigured()) {
    throw new Error(
      `GraphQL ${label} query skipped: API_URL, API_USERNAME and API_PASSWORD must all be set`,
    );
  }

  const { data } = await query({ query: document });
  // Apollo types `data` as possibly undefined: a query can resolve carrying
  // only errors.
  if (!data) throw new Error(`GraphQL ${label} query returned no data`);
  return select(data.viewer.analytics);
}
