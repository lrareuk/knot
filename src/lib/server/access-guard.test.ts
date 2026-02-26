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
      })
    ).toBe("/login");
  });

  it("redirects authenticated unpaid users to payment", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard",
        isAuthenticated: true,
        paid: false,
        onboardingDone: false,
      })
    ).toBe("/payment");
  });

  it("redirects paid not-onboarded users to onboarding", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard/report",
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
      })
    ).toBe("/onboarding");
  });

  it("allows dashboard for paid onboarded users", () => {
    expect(
      resolveAccessRedirect({
        pathname: "/dashboard/compare",
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
      })
    ).toBeNull();
  });
});
