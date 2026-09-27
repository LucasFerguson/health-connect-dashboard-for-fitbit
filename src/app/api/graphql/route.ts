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
 * `variables` must be forwarded: browser operations such as the sleep-stage
 * graph's `SleepStages($range: TimeRange!)` carry their arguments there rather
 * than in the query text, so dropping it would fail them as "variable not
 * provided".
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

    // Streamed straight through rather than `await upstream.json()` then
    // re-serializing: the proxy has no reason to parse the body, and this way
    // Apollo sees the GraphQL envelope byte-for-byte — `errors` and partial
    // `data` included — instead of a re-encoded copy. It also avoids buffering
    // the whole response in memory, which matters most for the ~1 MB overview
    // query.
    //
    // Note this is not a large latency win, despite looking like one. Measured
    // fixed overhead of this handler is ~7-14ms (a `runId`-only query), so the
    // remaining per-request time is backend execution (~0.3s for the daily
    // series) plus transfer of the payload itself. Shrinking a query's selection
    // set is the lever that actually moves those numbers, not this handler.
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        // The response is per-user and time-sensitive; never let a shared cache
        // hold it.
        "Cache-Control": "private, no-store",
      },
    });
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
