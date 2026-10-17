"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import { notchStyle } from "~/components/ui/notch";
import type { AuthFormState } from "~/server/auth/actions";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface AuthFormProps {
  mode: "login" | "signup";
  action: AuthAction;
  /** Where to go after signing in (login only). */
  next?: string;
  notice?: string;
  /** Rendered below the sign-in card, e.g. the Android app download. */
  footer?: ReactNode;
}

export const authInputClass =
  "border-ink-500 bg-ink-850 text-ink-0 focus:border-brand-400 w-full border px-3 py-2 text-sm outline-none transition-colors duration-[120ms]";

/** Shared sign-in / create-account card. One browser session lasts until
 * SIGN OUT, so this is rarely seen twice on the same device. */
export function AuthForm({
  mode,
  action,
  next,
  notice,
  footer,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    username: "",
  });
  const signup = mode === "signup";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="bg-ink-800 border-ink-600 w-full max-w-sm border p-6">
        <div className="mb-6 flex items-center gap-2">
          <span
            className="bg-brand-400 block size-[14px]"
            style={notchStyle(6)}
            aria-hidden
          />
          <span className="font-display text-ink-0 text-lg tracking-[.14em]">
            DASHBOARD
          </span>
        </div>
        <h1 className="font-display text-ink-0 mb-1 text-2xl tracking-[.06em]">
          {signup ? "Create an account" : "Sign in"}
        </h1>
        <p className="text-ink-100 mb-5 text-sm">
          {signup
            ? "This account also signs in the HCGateway phone app."
            : "Use your HCGateway account, the same one the phone app uses."}
        </p>

        {notice ? (
          <p className="border-caution text-caution-text mb-4 border-l-2 pl-3 text-sm">
            {notice}
          </p>
        ) : null}

        <form action={formAction} className="flex flex-col gap-3">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
            USERNAME
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              defaultValue={state.username}
              required
              className={authInputClass}
            />
          </label>
          <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
            PASSWORD
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 8 : undefined}
              required
              className={authInputClass}
            />
          </label>
          {signup ? (
            <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
              CONFIRM PASSWORD
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className={authInputClass}
              />
            </label>
          ) : null}

          {state.error ? (
            <p role="alert" className="text-alert text-sm">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="bg-brand-500 text-ink-0 font-display mt-2 cursor-pointer py-2 tracking-[.1em] transition-opacity duration-[120ms] hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "…" : signup ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>

        <p className="text-ink-200 mt-5 text-sm">
          {signup ? "Already have an account? " : "No account yet? "}
          <Link
            href={signup ? "/login" : "/signup"}
            className="text-brand-text hover:text-ink-0 underline-offset-2 hover:underline"
          >
            {signup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
      {footer}
    </main>
  );
}
