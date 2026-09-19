/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query SleepConsistencyPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepConsistency {\n          baselineWindowDays\n          minimumBaselineNights\n          methodology\n          average7DayScore\n          average30DayScore\n          previous30DayAverageScore\n          daily {\n            date\n            source\n            bedtimeAt\n            wakeAt\n            bedtimeMinutesLocal\n            wakeMinutesLocal\n            baselineBedtimeMinutesLocal\n            baselineWakeMinutesLocal\n            bedtimeDeviationMinutes\n            wakeDeviationMinutes\n            baselineNightCount\n            score\n            category\n            rolling7DayAverageScore\n            rolling30DayAverageScore\n            qualityFlags\n          }\n        }\n      }\n    }\n  }\n": typeof types.SleepConsistencyPageDocument,
    "\n  query SleepDebtPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepDebt {\n          targetMinutes\n          methodology\n          average7DayMinutes\n          average30DayMinutes\n          previous30DayAverageMinutes\n          latest {\n            date\n            debtMinutes\n          }\n          daily {\n            date\n            sleepMinutes\n            targetMinutes\n            debtMinutes\n            surplusMinutes\n            category\n            rolling7DayAverageMinutes\n            rolling7DayTotalMinutes\n            rolling30DayAverageMinutes\n          }\n        }\n      }\n    }\n  }\n": typeof types.SleepDebtPageDocument,
};
const documents: Documents = {
    "\n  query SleepConsistencyPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepConsistency {\n          baselineWindowDays\n          minimumBaselineNights\n          methodology\n          average7DayScore\n          average30DayScore\n          previous30DayAverageScore\n          daily {\n            date\n            source\n            bedtimeAt\n            wakeAt\n            bedtimeMinutesLocal\n            wakeMinutesLocal\n            baselineBedtimeMinutesLocal\n            baselineWakeMinutesLocal\n            bedtimeDeviationMinutes\n            wakeDeviationMinutes\n            baselineNightCount\n            score\n            category\n            rolling7DayAverageScore\n            rolling30DayAverageScore\n            qualityFlags\n          }\n        }\n      }\n    }\n  }\n": types.SleepConsistencyPageDocument,
    "\n  query SleepDebtPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepDebt {\n          targetMinutes\n          methodology\n          average7DayMinutes\n          average30DayMinutes\n          previous30DayAverageMinutes\n          latest {\n            date\n            debtMinutes\n          }\n          daily {\n            date\n            sleepMinutes\n            targetMinutes\n            debtMinutes\n            surplusMinutes\n            category\n            rolling7DayAverageMinutes\n            rolling7DayTotalMinutes\n            rolling30DayAverageMinutes\n          }\n        }\n      }\n    }\n  }\n": types.SleepDebtPageDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SleepConsistencyPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepConsistency {\n          baselineWindowDays\n          minimumBaselineNights\n          methodology\n          average7DayScore\n          average30DayScore\n          previous30DayAverageScore\n          daily {\n            date\n            source\n            bedtimeAt\n            wakeAt\n            bedtimeMinutesLocal\n            wakeMinutesLocal\n            baselineBedtimeMinutesLocal\n            baselineWakeMinutesLocal\n            bedtimeDeviationMinutes\n            wakeDeviationMinutes\n            baselineNightCount\n            score\n            category\n            rolling7DayAverageScore\n            rolling30DayAverageScore\n            qualityFlags\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SleepConsistencyPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepConsistency {\n          baselineWindowDays\n          minimumBaselineNights\n          methodology\n          average7DayScore\n          average30DayScore\n          previous30DayAverageScore\n          daily {\n            date\n            source\n            bedtimeAt\n            wakeAt\n            bedtimeMinutesLocal\n            wakeMinutesLocal\n            baselineBedtimeMinutesLocal\n            baselineWakeMinutesLocal\n            bedtimeDeviationMinutes\n            wakeDeviationMinutes\n            baselineNightCount\n            score\n            category\n            rolling7DayAverageScore\n            rolling30DayAverageScore\n            qualityFlags\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SleepDebtPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepDebt {\n          targetMinutes\n          methodology\n          average7DayMinutes\n          average30DayMinutes\n          previous30DayAverageMinutes\n          latest {\n            date\n            debtMinutes\n          }\n          daily {\n            date\n            sleepMinutes\n            targetMinutes\n            debtMinutes\n            surplusMinutes\n            category\n            rolling7DayAverageMinutes\n            rolling7DayTotalMinutes\n            rolling30DayAverageMinutes\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SleepDebtPage {\n    viewer {\n      analytics {\n        runId\n        algorithmVersion\n        timeZone\n        processedAt\n        sleepDebt {\n          targetMinutes\n          methodology\n          average7DayMinutes\n          average30DayMinutes\n          previous30DayAverageMinutes\n          latest {\n            date\n            debtMinutes\n          }\n          daily {\n            date\n            sleepMinutes\n            targetMinutes\n            debtMinutes\n            surplusMinutes\n            category\n            rolling7DayAverageMinutes\n            rolling7DayTotalMinutes\n            rolling30DayAverageMinutes\n          }\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;