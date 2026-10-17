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

/**
 * Over HTTPS the cookie is `SameSite=None; Secure; Partitioned`, so signing
 * in also works when the dashboard is embedded in an iframe on another site.
 * Browsers refuse to store or send a `Lax` cookie in a cross-site frame, and
 * only accept `None` on `Secure` cookies; `Partitioned` (CHIPS) keys the
 * cookie to the embedding site, so it survives third-party cookie blocking.
 *
 * Over plain HTTP (the LAN today) none of that is allowed, so it stays
 * `Lax` without `Secure`, and embedding works only from the same site (the
 * same host on any port).
 */
export function sessionCookieOptions(secure: boolean) {
  return secure
    ? ({
        httpOnly: true,
        sameSite: "none",
        secure: true,
        partitioned: true,
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      } as const)
    : ({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      } as const);
}

/** Options that delete the cookie. A partitioned cookie is only removed by a
 * Set-Cookie with the same attributes, so a bare delete would leave it. */
export function clearedSessionCookieOptions(secure: boolean) {
  return { ...sessionCookieOptions(secure), maxAge: 0 };
}

/** Whether the browser reached us over HTTPS, directly or through a proxy
 * such as a Cloudflare tunnel that terminates TLS. */
export function isHttpsRequest(headers: Headers, protocol?: string): boolean {
  return (
    protocol === "https:" ||
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https"
  );
}

/** Only same-site paths, so `?next=` can't bounce the browser elsewhere. */
export function safeNextPath(next: unknown): string {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
    ? next
    : "/";
}
