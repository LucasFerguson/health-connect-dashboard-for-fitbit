/**
 * Transport-level concerns shared by the two server-side paths that talk to
 * HCGateway's GraphQL API: the RSC Apollo Client (`graphqlClient.ts`) and the
 * same-origin proxy route (`src/app/api/graphql/route.ts`).
 *
 * This lives apart from `graphqlClient.ts` because that module is only
 * importable under the `react-server` condition — `registerApolloClient` is
 * exported nowhere else — so a route handler can't reach through it for the
 * token. Splitting the credential handling out means there is still exactly one
 * login implementation and one endpoint derivation, which is the point: a
 * second copy is a second place for the token to leak from.
 *
 * Server-only by construction. It reads `env`, whose server keys throw when
 * touched from the browser bundle, and nothing here is `NEXT_PUBLIC_`.
 */
import { z } from "zod";
import { env } from "~/env";
import { LoginError, readBodySnippet } from "./backendDiagnostics";

/**
 * Cached across requests deliberately: the token is an account credential,
 * not per-request state, and re-logging-in on every page render would add a
 * network round trip to each one.
 */
let cachedToken: string | null = null;

export async function fetchGraphQLToken(baseUrl: string): Promise<string> {
  if (cachedToken) return cachedToken;
  const loginUrl = `${baseUrl}/api/v2/login`;
  let response: Response;
  try {
    response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: env.API_USERNAME,
        password: env.API_PASSWORD,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new LoginError(loginUrl, null, "", { cause });
  }
  if (!response.ok) {
    throw new LoginError(
      loginUrl,
      response.status,
      await readBodySnippet(response),
    );
  }
  cachedToken = z
    .object({ token: z.string() })
    .parse(await response.json()).token;
  return cachedToken;
}

/** Clears the cached token so the next request logs in again. Call this when
 * a response comes back 401. */
export function invalidateGraphQLToken(): void {
  cachedToken = null;
}

/**
 * True when API_URL/API_USERNAME/API_PASSWORD are all configured. All three
 * or nothing: there is no anonymous or partial mode, so `withAnalytics` throws
 * when this is false rather than attempting a request that can only fail.
 */
export function isGraphQLConfigured(): boolean {
  return Boolean(env.API_URL && env.API_USERNAME && env.API_PASSWORD);
}

/**
 * The GraphQL API runs as its own Compose service on port 6645, beside the
 * Flask REST API on 6644 that `API_URL` points at. Derive the GraphQL origin
 * by swapping the port unless `GRAPHQL_URL` overrides it outright.
 *
 * Without this the client posts to `<rest-host>:6644/graphql` and gets
 * gunicorn's 404 HTML page.
 */
export function graphqlEndpoint(baseUrl: string): string {
  const override = process.env.GRAPHQL_URL;
  if (override) return override;
  return `${baseUrl.replace(/:\d+$/, ":6645")}/graphql`;
}
