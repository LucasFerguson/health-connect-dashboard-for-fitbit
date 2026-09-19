/**
 * Refreshes `graphql-introspection.json` from the live HCGateway GraphQL API.
 *
 * `/graphql` requires a bearer token, so this logs in with API_USERNAME /
 * API_PASSWORD from .env.local (same credentials the REST paths use) and
 * writes the introspection result to disk. `codegen.ts` then reads that file,
 * which keeps credentials out of the tracked codegen config.
 *
 * Run with: npm run codegen:schema
 */
import { writeFile } from "node:fs/promises";
import { getIntrospectionQuery } from "graphql";

const baseUrl = process.env.API_URL;
const username = process.env.API_USERNAME;
const password = process.env.API_PASSWORD;
const graphqlUrl = process.env.GRAPHQL_URL ?? deriveGraphqlUrl(baseUrl);

/** The GraphQL API runs as its own service on 6645, beside the REST API on
 * 6644, so derive it from API_URL unless GRAPHQL_URL overrides. */
function deriveGraphqlUrl(restUrl: string | undefined): string | undefined {
  if (!restUrl) return undefined;
  return `${restUrl.replace(/:\d+$/, ":6645")}/graphql`;
}

async function main(): Promise<void> {
  if (!baseUrl || !username || !password || !graphqlUrl) {
    throw new Error(
      "API_URL, API_USERNAME, and API_PASSWORD must be set (see .env.local)",
    );
  }

  const loginResponse = await fetch(`${baseUrl}/api/v2/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }
  const { token } = (await loginResponse.json()) as { token?: string };
  if (!token) throw new Error("Login response contained no token");

  const introspection = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!introspection.ok) {
    throw new Error(`Introspection failed: ${introspection.status}`);
  }
  const result = (await introspection.json()) as {
    data?: unknown;
    errors?: unknown[];
  };
  if (result.errors?.length) {
    throw new Error(`Introspection errors: ${JSON.stringify(result.errors)}`);
  }

  await writeFile(
    "graphql-introspection.json",
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(`Wrote graphql-introspection.json from ${graphqlUrl}`);
}

await main();
