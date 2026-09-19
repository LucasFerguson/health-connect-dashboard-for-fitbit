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
 */
import { HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { z } from "zod";
import { env } from "~/env";

/**
 * Cached across requests deliberately: the token is an account credential,
 * not per-request state, and re-logging-in on every page render would add a
 * network round trip to each one. Mirrors `healthConnectClient.ts`'s
 * module-level `tokenCache` for the same reason.
 */
let cachedToken: string | null = null;

async function fetchToken(baseUrl: string): Promise<string> {
  if (cachedToken) return cachedToken;
  const response = await fetch(`${baseUrl}/api/v2/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: env.API_USERNAME,
      password: env.API_PASSWORD,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`HCGateway login returned ${response.status}`);
  }
  cachedToken = z
    .object({ token: z.string() })
    .parse(await response.json()).token;
  return cachedToken;
}

/** Clears the cached token so the next request logs in again. Call this when
 * a response comes back 401, the way `healthConnectClient.ts` does. */
export function invalidateGraphQLToken(): void {
  cachedToken = null;
}

/**
 * True when API_URL/API_USERNAME/API_PASSWORD are all configured, matching
 * `createHealthRepository`'s all-or-nothing gate. Callers must fall back to
 * fixture data when this is false, the same way the REST paths do.
 */
export function isGraphQLConfigured(): boolean {
  return Boolean(env.API_URL && env.API_USERNAME && env.API_PASSWORD);
}

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  const baseUrl = env.API_URL;
  const authLink = new SetContextLink(async (prevContext) => {
    if (!baseUrl) throw new Error("API_URL is not configured");
    const token = await fetchToken(baseUrl);
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
        uri: `${baseUrl ?? "http://api-url-not-configured"}/graphql`,
      }),
    ),
  });
});
