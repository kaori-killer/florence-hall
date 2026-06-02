import type { Page } from "@playwright/test";

let userCounter = 0;

export function uniqueUser(): { email: string; name: string; password: string } {
  userCounter += 1;
  const stamp = `${Date.now()}-${userCounter}`;
  return {
    email: `e2e-${stamp}@test.local`,
    name: `테스터${stamp.slice(-4)}`,
    password: "password1234",
  };
}

export async function signUp(
  page: Page,
  user: { email: string; name: string; password: string },
): Promise<void> {
  await page.goto("/auth/signup");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("이름").fill(user.name);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "회원가입" }).click();
  await page.waitForURL("/");
}

export async function logIn(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/auth/login");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}
