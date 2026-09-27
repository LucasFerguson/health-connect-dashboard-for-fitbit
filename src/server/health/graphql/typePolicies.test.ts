import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { InMemoryCache, gql } from "@apollo/client";
import {
  REPLACED_LIST_FIELDS,
  VALUE_OBJECT_TYPES,
  typePolicies,
} from "./typePolicies";

interface IntrospectionTypeRef {
  kind: string;
  name: string | null;
  ofType: IntrospectionTypeRef | null;
}

interface IntrospectionType {
  kind: string;
  name: string;
  fields: { name: string; type: IntrospectionTypeRef }[] | null;
}

const schemaTypes = (
  JSON.parse(
    readFileSync(
      new URL("../../../../graphql-introspection.json", import.meta.url),
      "utf8",
    ),
  ) as { data: { __schema: { types: IntrospectionType[] } } }
).data.__schema.types.filter(
  (type) => type.kind === "OBJECT" && !type.name.startsWith("__"),
);
const byName = new Map(schemaTypes.map((type) => [type.name, type]));

const hasId = (type: IntrospectionType) =>
  (type.fields ?? []).some((field) => field.name === "id");
const namedType = (ref: IntrospectionTypeRef): string =>
  ref.ofType ? namedType(ref.ofType) : (ref.name ?? "");
const isList = (ref: IntrospectionTypeRef): boolean =>
  ref.kind === "NON_NULL" && ref.ofType
    ? isList(ref.ofType)
    : ref.kind === "LIST";

void describe("typePolicies against the committed schema", () => {
  void it("covers exactly the id-less types used as single-object fields", () => {
    const expected = new Set<string>();
    for (const type of schemaTypes) {
      for (const field of type.fields ?? []) {
        const target = byName.get(namedType(field.type));
        if (target && !hasId(target) && !isList(field.type)) {
          expected.add(target.name);
        }
      }
    }
    assert.deepEqual([...VALUE_OBJECT_TYPES].sort(), [...expected].sort());
  });

  void it("only replaces lists on entity types that exist and are lists", () => {
    for (const [typename, fields] of Object.entries(REPLACED_LIST_FIELDS)) {
      const type = byName.get(typename);
      assert.ok(type, `${typename} is not in the schema`);
      assert.ok(hasId(type), `${typename} has no id, so it is not an entity`);
      for (const fieldName of fields) {
        const field = type.fields?.find((f) => f.name === fieldName);
        assert.ok(field, `${typename}.${fieldName} is not in the schema`);
        assert.ok(isList(field.type), `${typename}.${fieldName} is not a list`);
      }
    }
  });
});

void describe("typePolicies in an InMemoryCache", () => {
  const ANALYTICS_ID = "acct:algo:a:b";
  const DEBT_DAILY = gql`
    query DebtDaily {
      viewer {
        analytics {
          id
          sleepDebt {
            targetMinutes
            daily {
              id
              date
              debtMinutes
            }
          }
        }
      }
    }
  `;
  const DEBT_BREAKDOWN = gql`
    query DebtBreakdown {
      viewer {
        analytics {
          id
          sleepDebt {
            breakdown30Day {
              recordedDays
              high
            }
          }
        }
      }
    }
  `;

  void it("merges two selections of the same value object without warning", () => {
    const cache = new InMemoryCache({ typePolicies });
    const warnings: unknown[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      cache.writeQuery({
        query: DEBT_DAILY,
        data: {
          viewer: {
            __typename: "Viewer",
            analytics: {
              __typename: "Analytics",
              id: ANALYTICS_ID,
              sleepDebt: {
                __typename: "SleepDebtSummary",
                targetMinutes: 480,
                daily: [
                  {
                    __typename: "SleepDebtDay",
                    id: `${ANALYTICS_ID}:2026-09-19`,
                    date: "2026-09-19",
                    debtMinutes: 12,
                  },
                ],
              },
            },
          },
        },
      });
      cache.writeQuery({
        query: DEBT_BREAKDOWN,
        data: {
          viewer: {
            __typename: "Viewer",
            analytics: {
              __typename: "Analytics",
              id: ANALYTICS_ID,
              sleepDebt: {
                __typename: "SleepDebtSummary",
                breakdown30Day: {
                  __typename: "SleepDebtBreakdown",
                  recordedDays: 30,
                  high: 19,
                },
              },
            },
          },
        },
      });
    } finally {
      console.warn = originalWarn;
    }

    assert.deepEqual(warnings, []);
    // Both selections are still readable: the second write merged into the
    // first instead of replacing it.
    assert.ok(cache.readQuery({ query: DEBT_DAILY }));
    assert.ok(cache.readQuery({ query: DEBT_BREAKDOWN }));
    // The daily row is normalized under its own id.
    assert.ok(cache.extract()[`SleepDebtDay:${ANALYTICS_ID}:2026-09-19`]);
  });
});
