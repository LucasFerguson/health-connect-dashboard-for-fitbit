/**
 * HCGateway's REST account endpoints. Every login and signup starts a new
 * session of its own on the backend, independent of the phone app's.
 */
import { z } from "zod";
import { env } from "~/env";

export type AuthResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

const tokenBody = z.object({ token: z.string().min(1) });
const errorBody = z.object({ error: z.string() });

/** Messages for the statuses a person can fix from the form. HCGateway's own
 * 404 text tells phone users to come here, which is wrong on this side. */
const friendlyErrors: Record<string, Partial<Record<number, string>>> = {
  login: { 403: "Wrong password.", 404: "No account with that username." },
  signup: {},
};

async function post(
  endpoint: "login" | "signup",
  username: string,
  password: string,
): Promise<AuthResult> {
  if (!env.API_URL) return { ok: false, error: "API_URL is not configured." };
  let response: Response;
  try {
    response = await fetch(`${env.API_URL}/api/v2/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, client: "dashboard" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return {
      ok: false,
      error: "Couldn't reach HCGateway. Is the backend running?",
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const parsed = tokenBody.safeParse(body);
    if (parsed.success) return { ok: true, token: parsed.data.token };
  }
  const friendly = friendlyErrors[endpoint]?.[response.status];
  const backendError = errorBody.safeParse(body);
  return {
    ok: false,
    error:
      friendly ??
      (backendError.success
        ? backendError.data.error
        : `HCGateway answered ${response.status}.`),
  };
}

export const backendLogin = (username: string, password: string) =>
  post("login", username, password);

export const backendSignup = (username: string, password: string) =>
  post("signup", username, password);

/** Ends this browser's session on HCGateway. Best effort: signing out locally
 * must still work when the backend is down. */
export async function backendRevoke(token: string): Promise<void> {
  if (!env.API_URL) return;
  try {
    await fetch(`${env.API_URL}/api/v2/revoke`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    console.error(
      "Session revoke failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/** The signed-in account's username, or null if HCGateway can't say. */
export async function backendAccount(
  token: string,
): Promise<{ username: string } | null> {
  if (!env.API_URL) return null;
  try {
    const response = await fetch(`${env.API_URL}/api/v2/account`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const parsed = z
      .object({ username: z.string() })
      .safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function backendChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.API_URL) return { ok: false, error: "API_URL is not configured." };
  let response: Response;
  try {
    response = await fetch(`${env.API_URL}/api/v2/account/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return {
      ok: false,
      error: "Couldn't reach HCGateway. Is the backend running?",
    };
  }
  if (response.ok) return { ok: true };
  if (response.status === 403) {
    return { ok: false, error: "Your current password is wrong." };
  }
  const body = errorBody.safeParse(await response.json().catch(() => null));
  return {
    ok: false,
    error: body.success
      ? body.data.error
      : `HCGateway answered ${response.status}.`,
  };
}
