"use client";

import { useActionState } from "react";
import { FormField } from "../components/FormField";
import type { AuthState } from "./actions";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  const submitLabel = mode === "signup" ? "회원가입" : "로그인";

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="이메일" name="email" type="email" autoComplete="email" />
      {mode === "signup" && (
        <FormField label="이름" name="name" autoComplete="name" />
      )}
      <FormField
        label="비밀번호"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />
      {state.error && (
        <p
          role="alert"
          data-testid="auth-error"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {pending ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
