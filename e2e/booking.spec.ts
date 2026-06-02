import { expect, test } from "@playwright/test";
import { signUp, uniqueUser } from "./helpers";

test.describe("booking", () => {
  test("좌석 2개를 선택해 예매하면 마이페이지에 나타난다", async ({ page }) => {
    await signUp(page, uniqueUser());

    await page.goto("/");
    await page.getByTestId("performance-list").locator("li").first().click();

    const availableSeats = page.locator('[data-testid^="seat-"][data-booked="false"]');
    await availableSeats.nth(0).click();
    await availableSeats.nth(1).click();

    await expect(page.getByTestId("selected-count")).toHaveText("2");
    await page.getByTestId("book-button").click();

    await page.waitForURL("/my");
    await expect(page.getByTestId("my-bookings").locator("li")).toHaveCount(1);
    await expect(
      page.getByTestId("my-bookings").locator("li").first(),
    ).toHaveAttribute("data-status", "CONFIRMED");
  });

  test("취소하면 좌석이 다시 예매 가능해진다", async ({ page }) => {
    await signUp(page, uniqueUser());

    await page.goto("/");
    await page.getByTestId("performance-list").locator("li").nth(1).click();
    const availableSeats = page.locator('[data-testid^="seat-"][data-booked="false"]');
    const firstSeat = availableSeats.first();
    const seatId = await firstSeat.getAttribute("data-testid");
    await firstSeat.click();
    await page.getByTestId("book-button").click();
    await page.waitForURL("/my");

    const cancelButton = page
      .getByTestId("my-bookings")
      .locator("li")
      .first()
      .getByRole("button", { name: /예매 취소/ });
    await cancelButton.click();

    await expect(
      page.getByTestId("my-bookings").locator("li").first(),
    ).toHaveAttribute("data-status", "CANCELLED");

    await page.goto("/");
    await page.getByTestId("performance-list").locator("li").nth(1).click();
    await expect(page.locator(`[data-testid="${seatId}"]`)).toHaveAttribute(
      "data-booked",
      "false",
    );
  });

  test("로그인하지 않으면 예매 버튼이 비활성화된다", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("performance-list").locator("li").first().click();
    await expect(page.getByTestId("book-button")).toBeDisabled();
  });
});
