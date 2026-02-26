export type StartRouteInput = {
  isAuthenticated: boolean;
  paid: boolean;
  onboardingDone: boolean;
  accountState: "active" | "panic_hidden";
  recoveryKeyRequired: boolean;
};

export function resolveStartRedirect(input: StartRouteInput): string {
  if (!input.isAuthenticated) {
    return "/signup?next=%2Fstart";
  }

  if (input.accountState !== "active") {
    return "/login";
  }

  if (!input.paid) {
    return "/signup/payment";
  }

  if (!input.onboardingDone) {
    return "/onboarding";
  }

  if (input.recoveryKeyRequired) {
    return "/recovery-key";
  }

  return "/dashboard";
}
