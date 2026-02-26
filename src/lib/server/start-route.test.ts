import { describe, expect, it } from "vitest";
import { resolveStartRedirect } from "@/lib/server/start-route";

describe("resolveStartRedirect", () => {
  it("routes unauthenticated users to signup with next=/start", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: false,
        paid: false,
        onboardingDone: false,
        accountState: "active",
        recoveryKeyRequired: false,
      })
    ).toBe("/signup?next=%2Fstart");
  });

  it("routes authenticated unpaid users to payment", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: false,
        onboardingDone: false,
        accountState: "active",
        recoveryKeyRequired: false,
      })
    ).toBe("/signup/payment");
  });

  it("routes paid users with incomplete onboarding to onboarding", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: false,
        accountState: "active",
        recoveryKeyRequired: false,
      })
    ).toBe("/onboarding");
  });

  it("routes paid onboarded users to dashboard", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        accountState: "active",
        recoveryKeyRequired: false,
      })
    ).toBe("/dashboard");
  });

  it("routes hidden users to login", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        accountState: "panic_hidden",
        recoveryKeyRequired: false,
      })
    ).toBe("/login");
  });

  it("routes ready users with required recovery key to recovery-key", () => {
    expect(
      resolveStartRedirect({
        isAuthenticated: true,
        paid: true,
        onboardingDone: true,
        accountState: "active",
        recoveryKeyRequired: true,
      })
    ).toBe("/recovery-key");
  });
});
