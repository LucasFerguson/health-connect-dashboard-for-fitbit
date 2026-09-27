/**
 * The React-Server-Component Apollo Client. Every page's server-side read goes
 * through this; `graphql/fetchAnalytics.ts` wraps it.
 *
 * Uses `registerApolloClient` rather than a module-level `new ApolloClient(...)`:
 * in the App Router a bare singleton is shared across concurrent requests, so
 * one request's cache could serve another's. `registerApolloClient` scopes the
 * client and its cache to a single request.
 *
 * Client components do NOT use this — RSC queries don't update in the browser.
 * They go through `src/app/ApolloWrapper.tsx` and the `/api/graphql` proxy.
 *
 * Auth mirrors `healthConnectClient.ts`: log in with API_USERNAME/API_PASSWORD,
 * attach `Authorization: Bearer <token>`. HCGateway derives the user from the
 * token alone — never pass a user ID as a query argument. The token fetch and
 * endpoint derivation live in `graphqlAuth.ts` so the proxy route can reuse
 * them; this module is only importable under the `react-server` condition.
 *
 * The cache normalizes by the backend's run-scoped `id`s, with the shared
 * `typePolicies` from `graphql/typePolicies.ts`. The cache is per request, so
 * this mostly matters when one request runs several queries (and for the
 * browser client, which lives for the whole session).
 *
 * Still open:
 *
 * - A `RetryLink` for transient 5xx, plus an `ErrorLink` calling
 *   `invalidateGraphQLToken()` on 401. The proxy route already does the 401
 *   half; this path still relies on the next request re-logging in.
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
import { typePolicies } from "./graphql/typePolicies";

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
    // Shared with the browser client; see `graphql/typePolicies.ts`.
    cache: new InMemoryCache({ typePolicies }),
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
