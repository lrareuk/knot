import { expect, test } from "@playwright/test";
import { login, readCredentials } from "./helpers/auth";

const dashboardCredentials = readCredentials("E2E_DASHBOARD_EMAIL", "E2E_DASHBOARD_PASSWORD");

test.describe("Dashboard and Settings Smoke", () => {
  test("mobile nav exposes report destination", async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width > 900, "This smoke test validates mobile/tablet nav only.");
    test.skip(!dashboardCredentials, "Set E2E_DASHBOARD_EMAIL and E2E_DASHBOARD_PASSWORD to run this smoke test.");
    if (!dashboardCredentials) {
      return;
    }

    await login(page, dashboardCredentials, "/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    const reportLink = page.getByRole("link", { name: "Report" });
    await expect(reportLink).toBeVisible();
    await reportLink.click();
    await expect(page).toHaveURL(/\/dashboard\/report/);
  });

  test("settings rejects password update when current password is wrong", async ({ page }) => {
    test.skip(!dashboardCredentials, "Set E2E_DASHBOARD_EMAIL and E2E_DASHBOARD_PASSWORD to run this smoke test.");
    if (!dashboardCredentials) {
      return;
    }

    await login(page, dashboardCredentials, "/settings");
    await expect(page).toHaveURL(/\/settings/);

    await page.getByLabel("Current password").fill("definitely-wrong-password");
    await page.getByLabel("New password").fill("TempPassword123!");
    await page.getByLabel("Confirm new password").fill("TempPassword123!");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Current password is incorrect.")).toBeVisible();
  });

  test("panic mode offers keyboard/screen-reader confirmation path", async ({ page }) => {
    test.skip(!dashboardCredentials, "Set E2E_DASHBOARD_EMAIL and E2E_DASHBOARD_PASSWORD to run this smoke test.");
    if (!dashboardCredentials) {
      return;
    }

    await login(page, dashboardCredentials, "/settings");
    await expect(page).toHaveURL(/\/settings/);

    await page.getByRole("button", { name: "Arm panic mode" }).click();
    await page.getByRole("button", { name: "Use keyboard/screen reader confirmation" }).click();
    await expect(page.getByRole("button", { name: "Confirm hide account" })).toBeVisible();
  });
});
