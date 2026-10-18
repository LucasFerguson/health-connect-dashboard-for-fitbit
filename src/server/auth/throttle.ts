/**
 * The form limits themselves. Kept out of `actions.ts` because a
 * "use server" module may only export async functions.
 */
import { headers } from "next/headers";
import { AttemptLimiter, clientAddress } from "~/domain/rateLimit";

const MINUTE = 60_000;

/** Failed sign-ins per visitor. */
export const signInLimiter = new AttemptLimiter(10, 15 * MINUTE);

/** Account requests per visitor; a person needs one. */
export const signupLimiter = new AttemptLimiter(3, 60 * MINUTE);

export async function requestClient(): Promise<string> {
  return clientAddress(await headers());
}
