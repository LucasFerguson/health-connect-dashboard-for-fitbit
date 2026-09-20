/**
 * Same-origin GraphQL proxy for the browser.
 *
 * Client components can't talk to HCGateway's `/graphql` directly: the endpoint
 * needs a bearer token minted from API_USERNAME/API_PASSWORD, and anything the
 * browser can send is a credential the browser has. So the client Apollo Client
 * (`src/app/ApolloWrapper.tsx`) posts here instead, and this handler — which
 * runs server-side — is the only place the token is attached. Nothing is
 * exposed as `NEXT_PUBLIC_*`; the browser never sees a credential, only a
 * relative URL on its own origin.
 *
 * Deliberately not a transparent proxy:
 *
 * - Only `query`, `variables` and `operationName` cross over. Forwarding the
 *   incoming headers would let a caller override `Authorization` (or smuggle
 *   cookies upstream), which is exactly the boundary this exists to hold.
 * - Failures answer with a fixed message. An upstream error string can carry
 *   the request it was made with, so it is logged without the token and never
 *   echoed to the client.
 *
 * Note this grants the browser the same read scope as the server pages already
 * render — the token belongs to the single self-hosted account, and HCGateway
 * derives the user from it, so the proxy can't be pointed at another user's
 * data. It does not narrow to an operation allowlist; if this dashboard ever
 * becomes multi-user, that allowlist is the next thing to add.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import {
  fetchGraphQLToken,
  graphqlEndpoint,
  invalidateGraphQLToken,
  isGraphQLConfigured,
} from "~/server/health/graphqlAuth";

export const dynamic = "force-dynamic";

/**
 * `variables` is passed through for forward-compatibility even though the
 * server currently ignores it (GRAPHQL_BACKEND_REQUESTS.md item 1) — dropping
 * it here would turn a backend fix into a frontend mystery.
 */
const graphqlRequestShape = z.object({
  query: z.string().min(1),
  variables: z.record(z.unknown()).nullish(),
  operationName: z.string().nullish(),
});

export async function POST(request: Request) {
  if (!isGraphQLConfigured()) {
    // Same signal the RSC path gives itself via `withAnalytics`: GraphQL can't
    // serve this, so say so rather than returning an empty result that would
    // read as "no health data".
    return NextResponse.json(
      { errors: [{ message: "The GraphQL API is not configured" }] },
      { status: 503 },
    );
  }

  let body: z.infer<typeof graphqlRequestShape>;
  try {
    body = graphqlRequestShape.parse(await request.json());
  } catch {
    return NextResponse.json(
      { errors: [{ message: "Expected a JSON body with a `query` string" }] },
      { status: 400 },
    );
  }

  const baseUrl = env.API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { errors: [{ message: "The GraphQL API is not configured" }] },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(graphqlEndpoint(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await fetchGraphQLToken(baseUrl)}`,
      },
      body: JSON.stringify({
        query: body.query,
        variables: body.variables ?? undefined,
        operationName: body.operationName ?? undefined,
      }),
      cache: "no-store",
      // The overview query is the widest one the dashboard issues (~321 KB over
      // the wire); a minute is generous but the poll is only every 60s anyway.
      signal: AbortSignal.timeout(60_000),
    });

    if (upstream.status === 401) {
      // The cached token expired. Drop it so the next poll logs in again, the
      // way `healthConnectClient.ts` does on a 401.
      invalidateGraphQLToken();
    }

    if (!upstream.ok) {
      console.error(`GraphQL proxy: upstream returned ${upstream.status}`);
      return NextResponse.json(
        { errors: [{ message: "The GraphQL API could not be reached" }] },
        { status: 502 },
      );
    }

    // Returned as the upstream's own JSON so Apollo sees an unmodified GraphQL
    // response envelope, `errors` and partial `data` included.
    const payload: unknown = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    // Only the message, never the request: the fetch options carry the token.
    console.error(
      "GraphQL proxy request failed",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { errors: [{ message: "The GraphQL API could not be reached" }] },
      { status: 502 },
    );
  }
}
