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
 * This is the React-Server-Component path: it uses `query()` from
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
import { query } from "../graphqlClient";

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
 */
export async function withAnalytics<TResult extends AnalyticsQueryResult, T>(
  label: string,
  document: TypedDocumentNode<TResult, Record<string, never>>,
  select: (analytics: TResult["viewer"]["analytics"]) => T,
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

    const { data } = await query({ query: document });
    // Apollo types `data` as possibly undefined: a query can resolve carrying
    // only errors.
    if (!data) throw new EmptyResponseError();
    try {
      return select(data.viewer.analytics);
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
