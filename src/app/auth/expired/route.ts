import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  clearedSessionCookieOptions,
  isHttpsRequest,
} from "~/domain/auth";

export const dynamic = "force-dynamic";

/** HCGateway rejected this browser's session (signed out elsewhere, or the
 * database was reset). Drop the cookie and ask for a fresh sign-in. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?expired=1", request.url),
  );
  const secure = isHttpsRequest(request.headers, request.nextUrl.protocol);
  response.cookies.set(SESSION_COOKIE, "", clearedSessionCookieOptions(secure));
  return response;
}
