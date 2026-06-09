import { expect, test } from "@playwright/test";

test.describe("browse", () => {
  test("공연 목록과 잔여 좌석이 노출된다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "오늘 어떤 공연 보러 가세요?" }),
    ).toBeVisible();
    await expect(page.getByTestId("performance-list").locator("li")).toHaveCount(3);
  });

  test("공연 상세에서 좌석 맵이 보인다", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("performance-list").locator("li").first().click();
    await expect(page.locator('[data-testid^="seat-"]').first()).toBeVisible();
    const seatCount = await page.locator('[data-testid^="seat-"]').count();
    expect(seatCount).toBe(30);
  });
});
