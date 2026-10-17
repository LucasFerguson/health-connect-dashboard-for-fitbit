/**
 * Browser sign-in, shared by the middleware (edge), server code and client
 * components — so nothing here may import server-only modules.
 *
 * The cookie holds this browser's own HCGateway session token. HCGateway
 * sessions don't expire, and each device has its own, so signing out here
 * leaves the phone app signed in.
 */
export const SESSION_COOKIE = "hc_session";

/** Browsers cap cookie lifetime at 400 days. The middleware re-sets the
 * cookie on every page load, so a browser in regular use never reaches it. */
const SESSION_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/** Pages that render without a session. */
export const PUBLIC_PAGES = ["/login", "/signup"];

/** Route that clears a rejected session cookie, then sends the browser to
 * /login. Server renders can't delete cookies themselves, so they redirect
 * here instead. */
export const SESSION_EXPIRED_PATH = "/auth/expired";

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax",
    // Only over HTTPS: the dashboard is usually reached over plain HTTP on the
    // LAN, where a Secure cookie would never be sent back.
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  } as const;
}

/** Only same-site paths, so `?next=` can't bounce the browser elsewhere. */
export function safeNextPath(next: unknown): string {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
    ? next
    : "/";
}
