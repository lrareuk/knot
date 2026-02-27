import { expect, type Page } from "@playwright/test";

export type Credentials = {
  email: string;
  password: string;
};

export function readCredentials(emailEnvKey: string, passwordEnvKey: string): Credentials | null {
  const email = process.env[emailEnvKey];
  const password = process.env[passwordEnvKey];

  if ((!email || !password) && process.env.CI) {
    throw new Error(
      `Missing required e2e credentials: ${emailEnvKey} and ${passwordEnvKey}. Set both in CI to avoid skipped smoke coverage.`,
    );
  }

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function login(page: Page, credentials: Credentials, nextPath: string) {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByLabel("Email address").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/login/);
}
