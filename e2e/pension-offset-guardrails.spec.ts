import { expect, test } from "@playwright/test";
import { login, readCredentials } from "./helpers/auth";

const credentials = readCredentials("E2E_ONBOARDING_EMAIL", "E2E_ONBOARDING_PASSWORD");

test.describe("Pension Offsetting Guardrails", () => {
  test("report generation requires E&W pension-risk acknowledgement when flagged", async ({ page }) => {
    test.skip(!credentials, "Set E2E_ONBOARDING_EMAIL and E2E_ONBOARDING_PASSWORD to run this smoke test.");
    if (!credentials) return;

    await login(page, credentials, "/dashboard/report");
    await expect(page).toHaveURL(/\/dashboard\/report/);

    const riskAck = page.getByLabel(
      "I understand this scenario may rely on pension offsetting assumptions and may need specialist pension advice."
    );
    const visible = await riskAck.isVisible();
    test.skip(!visible, "No flagged E&W scenario available in this dataset.");

    const generateButton = page.getByRole("button", { name: "Generate report" });
    await expect(generateButton).toBeDisabled();
    await riskAck.check();
    await expect(generateButton).toBeEnabled();
  });

  test("marketplace inquiry requires pension-risk acknowledgement when flagged", async ({ page }) => {
    test.skip(!credentials, "Set E2E_ONBOARDING_EMAIL and E2E_ONBOARDING_PASSWORD to run this smoke test.");
    if (!credentials) return;

    await login(page, credentials, "/dashboard/marketplace");
    await expect(page).toHaveURL(/\/dashboard\/marketplace/);

    const firstProfile = page.getByRole("link", { name: "View profile" }).first();
    const profileCount = await firstProfile.count();
    test.skip(profileCount === 0, "No marketplace provider available in this dataset.");
    await firstProfile.click();
    await expect(page).toHaveURL(/\/dashboard\/marketplace\/providers\//);

    await page.getByLabel("Your message").fill("I would like to discuss options for our modelled pension and property outcomes.");
    await page.locator(".marketplace-composer-scenarios input[type='checkbox']").first().check();
    await page.getByLabel("I have finished modelling the relevant scenarios for this firm.").check();

    const riskAck = page.getByLabel(
      "I understand this submission includes pension trade-off assumptions and the firm receives a locked snapshot."
    );
    const visible = await riskAck.isVisible();
    test.skip(!visible, "No flagged E&W scenario selected in this dataset.");

    const sendButton = page.getByRole("button", { name: "Send inquiry" });
    await expect(sendButton).toBeDisabled();
    await riskAck.check();
    await expect(sendButton).toBeEnabled();
  });
});
