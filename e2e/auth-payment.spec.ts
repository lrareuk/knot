import { expect, test } from "@playwright/test";
import { login, readCredentials } from "./helpers/auth";

const paymentCredentials = readCredentials("E2E_PAYMENT_EMAIL", "E2E_PAYMENT_PASSWORD");
const couponCode = process.env.E2E_TEST_COUPON_CODE?.trim();

test.describe("Auth and Payment Smoke", () => {
  test("signup payment screen remains scrollable on short viewports", async ({ page }) => {
    test.skip(!paymentCredentials, "Set E2E_PAYMENT_EMAIL and E2E_PAYMENT_PASSWORD to run this smoke test.");
    if (!paymentCredentials) {
      return;
    }

    await login(page, paymentCredentials, "/signup/payment");
    await expect(page).toHaveURL(/\/signup\/payment/);
    await expect(page.getByTestId("checkout-display-total")).toBeVisible();

    const metrics = await page.evaluate(() => {
      const root = document.scrollingElement ?? document.documentElement;
      const before = root.scrollTop;
      root.scrollTo({ top: root.scrollHeight });
      return {
        before,
        after: root.scrollTop,
        scrollHeight: root.scrollHeight,
        clientHeight: root.clientHeight,
      };
    });

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
    expect(metrics.after).toBeGreaterThan(metrics.before);
  });

  test("checkout amount is reflected in both header and CTA", async ({ page }) => {
    test.skip(!paymentCredentials, "Set E2E_PAYMENT_EMAIL and E2E_PAYMENT_PASSWORD to run this smoke test.");
    if (!paymentCredentials) {
      return;
    }

    await login(page, paymentCredentials, "/signup/payment");
    await expect(page).toHaveURL(/\/signup\/payment/);

    const displayAmount = page.getByTestId("checkout-display-total");
    await expect(displayAmount).toBeVisible();
    const amountText = (await displayAmount.innerText()).trim();
    expect(amountText).not.toBe("...");

    const submitButton = page.getByTestId("checkout-submit-button");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText(amountText);
  });

  test("coupon apply updates visible payment amount", async ({ page }) => {
    test.skip(!paymentCredentials, "Set E2E_PAYMENT_EMAIL and E2E_PAYMENT_PASSWORD to run this smoke test.");
    test.skip(!couponCode, "Set E2E_TEST_COUPON_CODE to validate coupon total updates.");
    if (!paymentCredentials || !couponCode) {
      return;
    }

    await login(page, paymentCredentials, "/signup/payment");
    await expect(page).toHaveURL(/\/signup\/payment/);

    const displayAmount = page.getByTestId("checkout-display-total");
    const before = (await displayAmount.innerText()).trim();

    await page.getByLabel("Coupon code").fill(couponCode);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/applied/i)).toBeVisible({ timeout: 30_000 });

    const after = (await displayAmount.innerText()).trim();
    expect(after).not.toBe(before);
    await expect(page.getByTestId("checkout-submit-button")).toContainText(after);
  });
});
