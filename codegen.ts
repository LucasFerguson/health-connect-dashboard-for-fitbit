import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Generates TypeScript types from HCGateway's GraphQL schema so the frontend
 * never hand-maintains a parallel copy of the backend's wire contract.
 *
 * The schema is read from the checked-in `graphql-introspection.json` rather
 * than the live endpoint, because `/graphql` requires a bearer token and this
 * config is tracked in git — no credentials belong here. Refresh that file
 * with `npm run codegen:schema` (which reads API_* from .env.local) whenever
 * the backend schema changes, then re-run `npm run codegen`.
 *
 * Uses `client-preset`, the current recommended setup. It generates a `graphql()`
 * function that returns fully-typed documents, so queries are written inline in
 * the files that use them and there is a single output namespace — which also
 * avoids the duplicate-identifier collisions that the older
 * typescript + typescript-operations + typed-document-node combination
 * produced for enums referenced inside a selection set.
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: "./graphql-introspection.json",
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/types/__generated__/": {
      preset: "client",
      config: {
        avoidOptionals: {
          // Prefer explicit `null` over optional fields: HCGateway's contract
          // sends explicit nulls for missing health data, and collapsing that
          // into `undefined` is how a missing value becomes a rendered zero.
          field: true,
          inputValue: false,
        },
        defaultScalarType: "unknown",
        // Emit enums as string-literal unions rather than TS `enum`
        // declarations: unions are erasable, which `verbatimModuleSyntax`
        // requires, and `Record<Union, ...>` still gives exhaustiveness checks.
        enumsAsTypes: true,
        useTypeImports: true,
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
