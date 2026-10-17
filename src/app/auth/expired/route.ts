import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "~/domain/auth";

export const dynamic = "force-dynamic";

/** HCGateway rejected this browser's session (signed out elsewhere, or the
 * database was reset). Drop the cookie and ask for a fresh sign-in. */
export function GET(request: Request) {
  const response = NextResponse.redirect(
    new URL("/login?expired=1", request.url),
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
