/**
 * Transport-level concerns shared by the two server-side paths that talk to
 * HCGateway's GraphQL API: the RSC Apollo Client (`graphqlClient.ts`) and the
 * same-origin proxy route (`src/app/api/graphql/route.ts`).
 *
 * This lives apart from `graphqlClient.ts` because that module is only
 * importable under the `react-server` condition — `registerApolloClient` is
 * exported nowhere else — so a route handler can't reach through it.
 *
 * The bearer token is the signed-in browser's own HCGateway session, read
 * from its httpOnly cookie (`~/server/auth/session`). There is no shared
 * server-side credential.
 */
import { env } from "~/env";

/** True when API_URL is configured. Without it there is no backend to ask, so
 * `withAnalytics` throws rather than attempting a request that can only fail. */
export function isGraphQLConfigured(): boolean {
  return Boolean(env.API_URL);
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
