export type StartRouteInput = {
  isAuthenticated: boolean;
  paid: boolean;
  onboardingDone: boolean;
};

export function resolveStartRedirect(input: StartRouteInput): string {
  if (!input.isAuthenticated) {
    return "/signup?next=%2Fstart";
  }

  if (!input.paid) {
    return "/signup/payment";
  }

  if (!input.onboardingDone) {
    return "/onboarding";
  }

  return "/dashboard";
}
