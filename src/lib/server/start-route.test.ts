import { describe, expect, it } from "vitest";
import { resolveStartRedirect } from "@/lib/server/start-route";

describe("resolveStartRedirect", () => {
  it("routes unauthenticated users to signup with next=/start", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
      })
    ).toBe("/signup?next=%2Fstart");
  });

  it("routes authenticated unpaid users to payment", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: false,
        onboardingDone: false,
      })
    ).toBe("/signup/payment");
  });

  it("routes paid users with incomplete onboarding to onboarding", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
      })
    ).toBe("/onboarding");
  });

  it("routes paid onboarded users to dashboard", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
      })
    ).toBe("/dashboard");
  });
});
