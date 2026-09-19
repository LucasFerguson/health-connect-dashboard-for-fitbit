/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type DebtCategory =
  | 'HIGH'
  | 'LOW'
  | 'MODERATE'
  | 'NONE';

export type SleepDebtPageQueryVariables = Exact<{ [key: string]: never; }>;


export type SleepDebtPageQuery = { viewer: { analytics: { runId: string, algorithmVersion: string, timeZone: string, processedAt: string | null, sleepDebt: { targetMinutes: number, methodology: string, average7DayMinutes: number | null, average30DayMinutes: number | null, previous30DayAverageMinutes: number | null, latest: { date: string, debtMinutes: number } | null, daily: Array<{ date: string, sleepMinutes: number, targetMinutes: number, debtMinutes: number, surplusMinutes: number, category: DebtCategory, rolling7DayAverageMinutes: number | null, rolling7DayTotalMinutes: number | null, rolling30DayAverageMinutes: number | null }> } } } };


export const SleepDebtPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SleepDebtPage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"algorithmVersion"}},{"kind":"Field","name":{"kind":"Name","value":"timeZone"}},{"kind":"Field","name":{"kind":"Name","value":"processedAt"}},{"kind":"Field","name":{"kind":"Name","value":"sleepDebt"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"methodology"}},{"kind":"Field","name":{"kind":"Name","value":"average7DayMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"average30DayMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"previous30DayAverageMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"latest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"debtMinutes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"daily"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"sleepMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"targetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"debtMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"surplusMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"rolling7DayAverageMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"rolling7DayTotalMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"rolling30DayAverageMinutes"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<SleepDebtPageQuery, SleepDebtPageQueryVariables>;