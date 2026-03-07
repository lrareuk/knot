import { expect, test } from "@playwright/test";

test.describe("Public Smoke", () => {
  test("loads landing and legal pages", async ({ page }) => {
    const landing = await page.goto("/");
    expect(landing?.ok()).toBeTruthy();

    const legal = await page.goto("/legal");
    expect(legal?.ok()).toBeTruthy();
  });
});
