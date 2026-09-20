"use client";

/**
 * Client-component Apollo Client, the counterpart to `graphqlClient.ts`'s RSC
 * one. `ApolloNextAppProvider` gives every client component in the tree the
 * same request-scoped instance; per Apollo's Next.js guide this works even
 * though `layout.tsx` is a Server Component.
 *
 * Exists because RSC query results don't update in the browser. The dashboard's
 * 60s refresh needs reactivity, so it goes through `useQuery` here rather than
 * `getClient()` — see `HealthDataProvider`.
 */
import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      /**
       * Relative on purpose, and safe here. Apollo's guide calls for an
       * absolute URL because a client component also renders on the server
       * during SSR, where a relative URL has no origin to resolve against —
       * but no component in this app issues its first fetch during SSR: every
       * consumer of this client seeds itself from data the RSC path already
       * fetched and only polls once mounted in the browser. A relative URL is
       * what keeps the proxy same-origin; hardcoding a LAN address would both
       * break outside that network and defeat the point of the proxy.
       */
      uri: "/api/graphql",
      // Next.js patches global `fetch` and caches it by default, which would
      // let the framework serve a stale poll result for live health data.
      // Matches the RSC client's transport-level opt-out.
      fetchOptions: { cache: "no-store" },
    }),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
