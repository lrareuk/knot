import { describe, expect, it } from "vitest";
import { resolveAccessRedirect } from "@/lib/server/access-guard";

describe("resolveAccessRedirect", () => {
  it("redirects unauthenticated protected paths to login", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/login");
  });

  it("redirects unauthenticated admin paths to login", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/admin/recovery",
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/login");
  });

  it("redirects signup email step to signup when signup name is missing", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/signup/email",
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/signup");
  });

  it("redirects unauthenticated signup payment routes to signup", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/signup/payment",
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/signup");
  });

  it("redirects authenticated unpaid users to payment", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: true,
        paid: false,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/signup/payment");
  });

  it("redirects paid not-onboarded users to onboarding", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard/report",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/onboarding");
  });

  it("allows signed-in users on signup payment success page", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/signup/payment/success",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("allows dashboard for paid onboarded users", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard/compare",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("allows onboarding routes for paid onboarded users so they can edit their financial position", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/onboarding/review",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("allows onboarding routes while onboarding is incomplete even if recovery key is still required", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/onboarding/dates",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: true,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("redirects incomplete onboarding to safety page when financial abuse acknowledgement is missing", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/onboarding/dates",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: false,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/onboarding/safety");
  });

  it("allows safety page while onboarding is incomplete and acknowledgement is missing", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/onboarding/safety",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: false,
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("redirects onboarding routes to recovery-key after onboarding is complete when key setup is still required", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/onboarding/dates",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: true,
        hasSignupName: false,
      })
    ).toBe("/recovery-key");
  });

  it("redirects recovery-key route to onboarding until onboarding is complete", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/recovery-key",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: true,
        hasSignupName: false,
      })
    ).toBe("/onboarding");
  });

  it("redirects authenticated hidden users to login", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        financialAbuseAcknowledged: true,
        accountState: "panic_hidden",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBe("/login");
  });

  it("redirects ready users with required recovery key to recovery-key page", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        financialAbuseAcknowledged: true,
        accountState: "active",
        recoveryKeyRequired: true,
        hasSignupName: false,
      })
    ).toBe("/recovery-key");
  });
});
