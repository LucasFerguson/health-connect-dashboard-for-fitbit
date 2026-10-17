/**
 * Reads and writes this browser's session cookie. Server-only: `cookies()`
 * exists only in server components, route handlers and server actions, and
 * writing works only in the latter two.
 */
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "~/domain/auth";

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const requestHeaders = await headers();
  const secure =
    requestHeaders.get("x-forwarded-proto") === "https" ||
    (requestHeaders.get("origin") ?? "").startsWith("https:");
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(secure));
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
