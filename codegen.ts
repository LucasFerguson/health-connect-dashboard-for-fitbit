import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Generates TypeScript types from HCGateway's GraphQL schema so the frontend
 * never hand-maintains a parallel copy of the backend's contract (the problem
 * `src/domain/analytics.ts` and `dayAnalyticsSchema.ts` represent today — see
 * GRAPHQL_MIGRATION_REDUNDANCY.md).
 *
 * The schema is read from the checked-in `graphql-introspection.json` rather
 * than the live endpoint, because `/graphql` requires a bearer token and this
 * config is tracked in git — no credentials belong here. Refresh that file
 * with `npm run codegen:schema` (which reads API_* from .env.local) whenever
 * the backend schema changes, then re-run `npm run codegen`.
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: "./graphql-introspection.json",
  documents: ["src/**/*.{ts,tsx}"],
  // Nothing queries GraphQL yet; don't fail the build for that.
  ignoreNoDocuments: true,
  generates: {
    "./src/types/__generated__/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        avoidOptionals: {
          // Prefer explicit `null` over optional fields: HCGateway's contract
          // sends explicit nulls for missing health data, and collapsing that
          // into `undefined` is how a missing value becomes a rendered zero.
          field: true,
          inputValue: false,
        },
        defaultScalarType: "unknown",
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        scalars: {
          // Both are ISO-8601 strings over the wire. `Date` is a calendar day
          // ("2026-09-18"), `DateTime` a full instant — the domain already
          // models these as `DateKey` and `ISODateTime`.
          Date: "string",
          DateTime: "string",
          JSON: "unknown",
        },
      },
    },
  },
};

export default config;
