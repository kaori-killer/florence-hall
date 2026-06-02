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
    <form action={formAction} className="space-y-4 max-w-sm">
      <FormField
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
      />
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
        <p role="alert" className="text-sm text-red-600" data-testid="auth-error">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-neutral-900 text-white py-2 disabled:opacity-60"
      >
        {pending ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
