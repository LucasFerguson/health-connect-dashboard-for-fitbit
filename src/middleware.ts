import { NextResponse, type NextRequest } from "next/server";
import {
  PUBLIC_PAGES,
  SESSION_COOKIE,
  isHttpsRequest,
  sessionCookieOptions,
} from "~/domain/auth";

/**
 * Gatekeeper for every route: no session cookie means /login for pages and a
 * 401 for API routes. Whether the token is still valid is HCGateway's call;
 * a rejected one is handled where the data is fetched (`withViewer`, the
 * GraphQL proxy).
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const publicPage = PUBLIC_PAGES.includes(pathname);

  if (!token) {
    if (
      publicPage ||
      pathname.startsWith("/auth/") ||
      // The Android app download, so someone can install it before they
      // have an account (accounts are made on /signup).
      pathname.startsWith("/download/") ||
      pathname === "/api/health"
    ) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          errors: [
            {
              message: "Not signed in",
              extensions: { code: "UNAUTHENTICATED" },
            },
          ],
        },
        { status: 401 },
      );
    }
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (publicPage) return NextResponse.redirect(new URL("/", request.url));

  const response = NextResponse.next();
  // Slide the cookie's expiry forward. GET only: sign-out is a POST server
  // action that deletes the cookie, and re-setting it here would race that.
  if (request.method === "GET" && !pathname.startsWith("/auth/")) {
    const secure = isHttpsRequest(request.headers, request.nextUrl.protocol);
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
