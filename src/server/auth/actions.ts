"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "~/domain/auth";
import {
  backendChangePassword,
  backendLogin,
  backendRevoke,
  backendSignup,
} from "./hcgateway";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "./session";

export interface AuthFormState {
  error: string | null;
  username: string;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = field(formData, "username").trim();
  const password = field(formData, "password");
  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }
  const result = await backendLogin(username, password);
  if (!result.ok) return { error: result.error, username };
  await setSessionCookie(result.token);
  redirect(safeNextPath(field(formData, "next")));
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = field(formData, "username").trim();
  const password = field(formData, "password");
  if (!username) return { error: "Choose a username.", username };
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters.", username };
  }
  if (password !== field(formData, "confirm")) {
    return { error: "The passwords don't match.", username };
  }
  const result = await backendSignup(username, password);
  if (!result.ok) return { error: result.error, username };
  await setSessionCookie(result.token);
  redirect("/");
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
  if (next.length < 8) {
    return {
      error: "Use a new password of at least 8 characters.",
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
