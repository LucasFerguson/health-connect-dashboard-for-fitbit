"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PASSWORD_MAX,
  USERNAME_RULE,
  isValidUsername,
  normalizeUsername,
  safeNextPath,
} from "~/domain/auth";
import {
  backendChangePassword,
  backendCreateApiKey,
  backendLogin,
  backendRevoke,
  backendRevokeApiKey,
  backendSignup,
} from "./hcgateway";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "./session";
import { requestClient, signInLimiter, signupLimiter } from "./throttle";

export interface AuthFormState {
  error: string | null;
  username: string;
  /** Signup only: the request went in and now waits for approval. */
  requested?: boolean;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(field(formData, "username"));
  const password = field(formData, "password");
  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }
  // Only failures count, and a success doesn't reset them: otherwise one
  // working account could clear the way for guessing at others.
  const client = await requestClient();
  if (signInLimiter.isLimited(client)) {
    return {
      error: "Too many failed sign-in attempts. Try again in 15 minutes.",
      username,
    };
  }
  const result = await backendLogin(username, password);
  if (!result.ok) {
    signInLimiter.record(client);
    return { error: result.error, username };
  }
  await setSessionCookie(result.token);
  redirect(safeNextPath(field(formData, "next")));
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(field(formData, "username"));
  const password = field(formData, "password");
  if (!username) return { error: "Choose a username.", username };
  if (!isValidUsername(username)) return { error: USERNAME_RULE, username };
  if (password.length < 8 || password.length > PASSWORD_MAX) {
    return {
      error: `Use a password of 8 to ${PASSWORD_MAX} characters.`,
      username,
    };
  }
  if (password !== field(formData, "confirm")) {
    return { error: "The passwords don't match.", username };
  }
  const client = await requestClient();
  if (signupLimiter.isLimited(client)) {
    return {
      error: "Too many account requests from here. Try again in an hour.",
      username,
    };
  }
  signupLimiter.record(client);
  const result = await backendSignup(username, password);
  if (!result.ok) return { error: result.error, username };
  return { error: null, username, requested: true };
}

export async function signOut(): Promise<void> {
  const token = await getSessionToken();
  if (token) await backendRevoke(token);
  await clearSessionCookie();
  redirect("/login");
}

export interface PasswordFormState {
  error: string | null;
  changed: boolean;
}

export async function changePassword(
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const current = field(formData, "current");
  const next = field(formData, "password");
  if (!current)
    return { error: "Enter your current password.", changed: false };
  if (next.length < 8 || next.length > PASSWORD_MAX) {
    return {
      error: `Use a new password of 8 to ${PASSWORD_MAX} characters.`,
      changed: false,
    };
  }
  if (next !== field(formData, "confirm")) {
    return { error: "The new passwords don't match.", changed: false };
  }
  const result = await backendChangePassword(token, current, next);
  return result.ok
    ? { error: null, changed: true }
    : { error: result.error, changed: false };
}

export interface ApiKeyFormState {
  error: string | null;
  /** The key just made: shown once, then gone. */
  created: { name: string; key: string } | null;
}

export async function createApiKey(
  _previous: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const name = field(formData, "name").trim();
  if (!name) {
    return {
      error: 'Give the key a name, like "laptop export".',
      created: null,
    };
  }
  const result = await backendCreateApiKey(token, name);
  if (!result.ok) return { error: result.error, created: null };
  revalidatePath("/settings");
  return {
    error: null,
    created: { name: result.summary.name, key: result.key },
  };
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  await backendRevokeApiKey(token, field(formData, "id"));
  revalidatePath("/settings");
}
