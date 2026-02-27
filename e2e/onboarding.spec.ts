import { expect, test } from "@playwright/test";
import { login, readCredentials } from "./helpers/auth";

const onboardingCredentials = readCredentials("E2E_ONBOARDING_EMAIL", "E2E_ONBOARDING_PASSWORD");

test.describe("Onboarding Smoke", () => {
  test("deleting middle property row keeps remaining values bound to correct rows", async ({ page }) => {
    test.skip(!onboardingCredentials, "Set E2E_ONBOARDING_EMAIL and E2E_ONBOARDING_PASSWORD to run this smoke test.");
    if (!onboardingCredentials) {
      return;
    }

    await login(page, onboardingCredentials, "/onboarding/property");
    await expect(page).toHaveURL(/\/onboarding\/property/);

    await page.getByRole("button", { name: /add another property/i }).click();
    await page.getByRole("button", { name: /add another property/i }).click();

    const labels = page.getByLabel("What would you call this property?");
    await labels.nth(0).fill("Alpha");
    await labels.nth(1).fill("Bravo");
    await labels.nth(2).fill("Charlie");

    const secondCard = page.locator(".onboarding-item-card").nth(1);
    await secondCard.getByRole("button", { name: "Delete" }).click();
    await secondCard.getByRole("button", { name: "Remove" }).click();

    const updatedLabels = page.getByLabel("What would you call this property?");
    await expect(updatedLabels.nth(0)).toHaveValue("Alpha");
    await expect(updatedLabels.nth(1)).toHaveValue("Charlie");
  });

  test("review page shows loading skeleton before hydrated content", async ({ page }) => {
    test.skip(!onboardingCredentials, "Set E2E_ONBOARDING_EMAIL and E2E_ONBOARDING_PASSWORD to run this smoke test.");
    if (!onboardingCredentials) {
      return;
    }

    await page.route("**/rest/v1/financial_position*", async (route) => {
      await page.waitForTimeout(900);
      await route.continue();
    });

    await login(page, onboardingCredentials, "/onboarding/review");
    await expect(page).toHaveURL(/\/onboarding\/review/);
    await expect(page.getByTestId("onboarding-review-loading")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Review your financial position/i })).toBeVisible({ timeout: 30_000 });
  });
});
