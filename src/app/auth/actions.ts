"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login, signup } from "@/domain/auth";
import { clearSession, setSession } from "@/lib/session";

export type AuthState = { error?: string };

const signupSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  name: z.string().min(1, "이름을 입력하세요.").max(50),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

const loginSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }
  try {
    const user = await signup(parsed.data);
    await setSession({ userId: user.id, name: user.name });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "회원가입에 실패했습니다." };
  }
  redirect("/");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }
  const user = await login(parsed.data);
  if (!user) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  await setSession({ userId: user.id, name: user.name });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
