/**
 * Reads and writes this browser's session cookie. Server-only: `cookies()`
 * exists only in server components, route handlers and server actions, and
 * writing works only in the latter two.
 */
import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  clearedSessionCookieOptions,
  isHttpsRequest,
  sessionCookieOptions,
} from "~/domain/auth";

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

async function secureRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  return (
    isHttpsRequest(requestHeaders) ||
    (requestHeaders.get("origin") ?? "").startsWith("https:")
  );
}

export async function setSessionCookie(token: string): Promise<void> {
  const secure = await secureRequest();
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(secure));
}

export async function clearSessionCookie(): Promise<void> {
  const secure = await secureRequest();
  (await cookies()).set(
    SESSION_COOKIE,
    "",
    clearedSessionCookieOptions(secure),
  );
}
