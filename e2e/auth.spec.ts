import { expect, test } from "@playwright/test";
import { signUp, uniqueUser } from "./helpers";

test.describe("auth", () => {
  test("회원가입 후 헤더에 사용자명이 노출된다", async ({ page }) => {
    const user = uniqueUser();
    await signUp(page, user);
    await expect(page.getByTestId("user-name")).toHaveText(user.name);
  });

  test("잘못된 비밀번호로 로그인하면 에러를 보여준다", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("이메일").fill("nobody@example.com");
    await page.getByLabel("비밀번호").fill("wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByTestId("auth-error")).toBeVisible();
  });
});
