"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <h1 className="text-2xl font-semibold">Log in to edit</h1>
      <p className="text-sm text-slate-400">
        Anyone can view notes. Only logged-in users can upload, edit, or delete.
      </p>
      <label className="block text-sm">
        Username
        <input
          name="username"
          autoComplete="username"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          required
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          required
        />
      </label>
      {state.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-sky-500 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
