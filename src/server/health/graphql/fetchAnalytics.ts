/**
 * Shared plumbing for GraphQL-backed pages, so each page's data module is just
 * a query plus a thin adapter.
 *
 * Throws `BackendRequestError` when GraphQL can't serve the page. There is no
 * local fallback: pages catch it with `settle()` and render
 * `BackendErrorPanel`, which explains exactly which layer failed. Never catch
 * this to render an empty page; empty reads as "no health data", not
 * "backend down".
 *
 * This is the React-Server-Component path: it uses `getClient()` from
 * `registerApolloClient`, which scopes the client and its cache to one
 * request. Client components that need reactivity (polling, refetch) must go
 * through `ApolloNextAppProvider` and the `useQuery`/`useSuspenseQuery` hooks
 * instead — per Apollo's Next.js guidance, RSC queries don't update in the
 * browser.
 */
import type { TypedDocumentNode } from "@apollo/client";
import { ServerError } from "@apollo/client/errors";
import { env } from "~/env";
import {
  BackendRequestError,
  EmptyResponseError,
  FrontendMappingError,
  NotConfiguredError,
  configSnapshot,
  describeDocument,
  diagnose,
  missingConfig,
  type RequestContext,
} from "../backendDiagnostics";
import { graphqlEndpoint, invalidateGraphQLToken } from "../graphqlAuth";
import { getClient } from "../graphqlClient";

interface ViewerQueryResult {
  viewer: unknown;
}

interface AnalyticsQueryResult {
  viewer: { analytics: unknown };
}

/**
 * Runs `document` against HCGateway's GraphQL API and maps
 * `viewer.analytics` with `select`. Every failure — missing config, login,
 * network, HTTP, GraphQL errors, or an exception in `select` itself — is
 * rethrown as a `BackendRequestError` carrying a full diagnosis, which the
 * page renders with `settle()` + `BackendErrorPanel`.
 *
 * @param label short loader name used in the report, e.g. "sleep-debt"
 * @param variables the operation's variables, when it declares any
 */
export function withAnalytics<
  TResult extends AnalyticsQueryResult,
  T,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  label: string,
  document: TypedDocumentNode<TResult, TVariables>,
  select: (analytics: TResult["viewer"]["analytics"]) => T,
  variables?: TVariables,
): Promise<T> {
  return withViewer(
    label,
    document,
    (viewer) => select(viewer.analytics),
    variables,
  );
}

/**
 * `withAnalytics` for operations rooted elsewhere under `viewer` (e.g.
 * `viewer.ingestion` for the sync heartbeat), with identical error handling.
 * `withAnalytics` is a thin wrapper over this, so the two can't drift apart.
 */
export async function withViewer<
  TResult extends ViewerQueryResult,
  T,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  label: string,
  document: TypedDocumentNode<TResult, TVariables>,
  select: (viewer: TResult["viewer"]) => T,
  variables?: TVariables,
): Promise<T> {
  const config = configSnapshot(env);
  const context: RequestContext = {
    transport: "graphql",
    label,
    ...describeDocument(document),
    endpoint: config.apiUrl ? graphqlEndpoint(config.apiUrl) : null,
    loginUrl: config.apiUrl ? `${config.apiUrl}/api/v2/login` : null,
    config,
    startedAt: Date.now(),
  };

  try {
    const missing = missingConfig(config);
    if (missing.length > 0) throw new NotConfiguredError(missing);

    // Apollo's `VariablesOption` makes `variables` required or forbidden
    // depending on the concrete operation, which a generic wrapper can't
    // prove. Callers are still checked: `variables` is typed `TVariables`.
    //
    // `getClient().query` rather than the `query` shortcut: the shortcut logs
    // a warning on every call outside a React render, which is where
    // `/api/sync-status` (a route handler) runs. Inside a render the two are
    // the same request-scoped client.
    const client = getClient();
    const options = { query: document, variables } as Parameters<
      typeof client.query<TResult, TVariables>
    >[0];
    const { data } = await client.query<TResult, TVariables>(options);
    // Apollo types `data` as possibly undefined: a query can resolve carrying
    // only errors.
    if (!data) throw new EmptyResponseError();
    try {
      return select(data.viewer);
    } catch (error) {
      throw new FrontendMappingError(error);
    }
  } catch (error) {
    // A rejected token means the cached one expired; drop it so the next
    // request logs in again instead of failing the same way forever.
    if (ServerError.is(error) && error.statusCode === 401) {
      invalidateGraphQLToken();
    }
    const diagnostics = diagnose(error, context);
    console.error(
      `GraphQL ${label} failed: ${diagnostics.title}`,
      JSON.stringify({
        kind: diagnostics.kind,
        endpoint: context.endpoint,
        operation: context.operation,
        causes: diagnostics.causes,
      }),
    );
    throw new BackendRequestError(diagnostics);
  }
}
