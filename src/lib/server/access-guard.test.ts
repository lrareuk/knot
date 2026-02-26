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
        hasSignupName: false,
      })
    ).toBeNull();
  });
});
