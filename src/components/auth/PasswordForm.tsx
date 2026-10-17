"use client";

import { useActionState } from "react";
import { changePassword } from "~/server/auth/actions";
import { authInputClass } from "./AuthForm";

/** Change the signed-in account's password. Other signed-in devices (the
 * phone app, other browsers) stay signed in afterwards. */
export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {
    error: null,
    changed: false,
  });

  return (
    // Remount on success so the password fields clear.
    <form
      key={state.changed ? "changed" : "editing"}
      action={formAction}
      className="flex max-w-sm flex-col gap-3"
    >
      <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
        CURRENT PASSWORD
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={authInputClass}
        />
      </label>
      <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
        NEW PASSWORD
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={authInputClass}
        />
      </label>
      <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
        CONFIRM NEW PASSWORD
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={authInputClass}
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-alert text-sm">
          {state.error}
        </p>
      ) : null}
      {state.changed ? (
        <p role="status" className="text-recovery text-sm">
          Password changed. Your other devices stay signed in.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-500 text-ink-0 font-display mt-2 cursor-pointer py-2 tracking-[.1em] transition-opacity duration-[120ms] hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "…" : "CHANGE PASSWORD"}
      </button>
    </form>
  );
}
