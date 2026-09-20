/**
 * SCAFFOLDING — not yet used by any page. HCGateway has no GraphQL schema or
 * `/graphql` route yet (see `doc/graphql-read-api-audit.md` in the sibling
 * `/root/HCGateway` repo: audit/design-baseline only, no implementation).
 *
 * This sets up the Apollo Client instance ahead of time so that once a real
 * schema exists, a page can start issuing queries without also having to
 * wire up transport/auth from scratch. Do not add queries against a guessed
 * schema shape — confirm the live schema first (see
 * feedback_verify_live_api_responses in project memory).
 *
 * Uses `registerApolloClient` from `@apollo/client-integration-nextjs` rather
 * than a module-level `new ApolloClient(...)`: in the App Router a bare
 * singleton is shared across concurrent requests, which would leak one user's
 * cached data into another request. `registerApolloClient` scopes the client
 * (and its cache) to a single request instead. This is the
 * React-Server-Component entrypoint only; client components would need a
 * separate `ApolloNextAppProvider` wrapper.
 *
 * Auth mirrors `healthConnectClient.ts`'s bearer-token pattern: log in with
 * API_USERNAME/API_PASSWORD, then attach `Authorization: Bearer <token>` on
 * every request. HCGateway derives the user and database from that token
 * alone — never pass a user ID as a query argument.
 *
 * The token fetch and endpoint derivation live in `graphqlAuth.ts` so the
 * same-origin proxy route (`src/app/api/graphql/route.ts`) can reuse them: this
 * module is only importable under the `react-server` condition, so a route
 * handler can't reach the token through it.
 *
 * ---
 *
 * TODO once HCGateway publishes a real schema — these can't be decided
 * without it, per the `apollo-client` skill's guidance:
 *
 * 1. **`typePolicies` / `keyFields` are unconfigured.** HCGateway's prepared
 *    metrics are `{status, value, unit, source, qualityFlags}` leaf objects
 *    with no `id`. Per the skill, types like that want `keyFields: false` so
 *    the cache groups them under their parent instead of trying to normalize
 *    them. Needs the real type names to write.
 *
 * 2. **Set `errorPolicy: "all"` per operation, NOT globally.** HCGateway's
 *    contract is partial-data-friendly (`partial`, `insufficient_data`,
 *    `not_implemented`), so rendering partial results is desirable — but the
 *    skill explicitly warns against a global error policy via
 *    `defaultOptions` because it breaks hook return-type narrowing. Put it on
 *    each query.
 *
 * 3. **Consider `RetryLink`** (`@apollo/client/link/retry`) for the transient
 *    5xx/network retries `healthConnectClient.ts` currently hand-rolls, and
 *    an `ErrorLink` that calls `invalidateGraphQLToken()` on a 401 so the
 *    next request re-logs-in.
 */
import { HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { env } from "~/env";
import { fetchGraphQLToken, graphqlEndpoint } from "./graphqlAuth";

// Re-exported so existing importers (`graphql/fetchAnalytics.ts`) keep a single
// entrypoint even though the credential handling moved to `graphqlAuth.ts`.
export { invalidateGraphQLToken, isGraphQLConfigured } from "./graphqlAuth";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  const baseUrl = env.API_URL;
  const authLink = new SetContextLink(async (prevContext) => {
    if (!baseUrl) throw new Error("API_URL is not configured");
    const token = await fetchGraphQLToken(baseUrl);
    // `OperationContext.headers` is typed `any` by Apollo; narrow it before
    // spreading so the lint rule against unsafe `any` assignment holds.
    const previousHeaders = (prevContext.headers ?? {}) as Record<
      string,
      string
    >;
    return {
      headers: { ...previousHeaders, Authorization: `Bearer ${token}` },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    // Absolute URL is required for SSR; relative URLs can't be resolved
    // server-side. Falls back to a placeholder that will fail loudly rather
    // than silently pointing somewhere unintended when API_URL is unset.
    link: authLink.concat(
      new HttpLink({
        uri: baseUrl
          ? graphqlEndpoint(baseUrl)
          : "http://api-url-not-configured/graphql",
        // Next.js patches global `fetch` and caches it by default, which would
        // let the framework serve a stale GraphQL response for live health
        // data. Opt out at the transport so freshness doesn't depend on every
        // call site remembering to. Individual operations can still override
        // this per-query via `context.fetchOptions` (e.g.
        // `next: { revalidate: 60 }`) for genuinely static reads such as
        // analytics config.
        //
        // Note: `fetchOptions` is ignored under
        // `export const dynamic = "force-static"`. Every page that would use
        // this is `force-dynamic`, so that limitation doesn't apply here.
        fetchOptions: { cache: "no-store" },
      }),
    ),
  });
});
