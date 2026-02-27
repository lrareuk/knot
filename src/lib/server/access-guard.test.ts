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
        accountState: "active",
        recoveryKeyRequired: false,
        hasSignupName: false,
      })
    ).toBeNull();
  });

  it("redirects authenticated hidden users to login", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
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
        accountState: "active",
        recoveryKeyRequired: true,
        hasSignupName: false,
      })
    ).toBe("/recovery-key");
  });
});
