"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "~/domain/auth";
import { backendLogin, backendRevoke, backendSignup } from "./hcgateway";
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
