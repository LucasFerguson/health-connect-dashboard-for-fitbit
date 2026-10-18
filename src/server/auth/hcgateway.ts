/**
 * HCGateway's REST account endpoints. Every login starts a new session of its
 * own on the backend, independent of the phone app's. Signup only files a
 * request that an admin has to approve before the account exists.
 */
import { z } from "zod";
import { env } from "~/env";

export type AuthResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export type SignupResult = { ok: true } | { ok: false; error: string };

type Endpoint = "login" | "signup";

const tokenBody = z.object({ token: z.string().min(1) });
const errorBody = z.object({ error: z.string() });
const pendingBody = z.object({ pending: z.literal(true) });

/** HCGateway says this only to someone who knows the password they asked
 * for the account with. */
const PENDING_APPROVAL =
  "Your account is still waiting for approval. Contact Lucas to have it approved and created.";

/** Messages for the statuses a person can act on from the form. Login's 403
 * deliberately doesn't say whether the username or the password was wrong. */
const friendlyErrors: Record<Endpoint, Partial<Record<number, string>>> = {
  login: {
    403: "Wrong username or password.",
    429: "Too many failed sign-in attempts. Try again in 15 minutes.",
  },
  signup: {},
};

type Answer = { status: number; body: unknown } | { error: string };

async function post(
  endpoint: Endpoint,
  username: string,
  password: string,
): Promise<Answer> {
  if (!env.API_URL) return { error: "API_URL is not configured." };
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
    return { error: "Couldn't reach HCGateway. Is the backend running?" };
  }
  const body: unknown = await response.json().catch(() => null);
  return { status: response.status, body };
}

function errorMessage(
  endpoint: Endpoint,
  { status, body }: { status: number; body: unknown },
): string {
  const backendError = errorBody.safeParse(body);
  return (
    friendlyErrors[endpoint][status] ??
    (backendError.success
      ? backendError.data.error
      : `HCGateway answered ${status}.`)
  );
}

export async function backendLogin(
  username: string,
  password: string,
): Promise<AuthResult> {
  const answer = await post("login", username, password);
  if ("error" in answer) return { ok: false, error: answer.error };
  const token = tokenBody.safeParse(answer.body);
  if (answer.status === 201 && token.success) {
    return { ok: true, token: token.data.token };
  }
  if (pendingBody.safeParse(answer.body).success) {
    return { ok: false, error: PENDING_APPROVAL };
  }
  return { ok: false, error: errorMessage("login", answer) };
}

/** Files an account request. HCGateway answers 202 whether or not it was
 * queued, so a taken username looks the same as a new one here. */
export async function backendSignup(
  username: string,
  password: string,
): Promise<SignupResult> {
  const answer = await post("signup", username, password);
  if ("error" in answer) return { ok: false, error: answer.error };
  if (answer.status === 202) return { ok: true };
  return { ok: false, error: errorMessage("signup", answer) };
}

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
