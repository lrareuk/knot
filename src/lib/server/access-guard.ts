export type AccessInput = {
  pathname: string;
  isAuthenticated: boolean;
  paid: boolean;
  onboardingDone: boolean;
};

export function resolveAccessRedirect(input: AccessInput): string | null {
  const { pathname, isAuthenticated, paid, onboardingDone } = input;

  if (!isAuthenticated) {
    if (
      pathname.startsWith("/payment") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings")
    ) {
      return "/login";
    }
    return null;
  }

  if (pathname === "/login" || pathname === "/signup") {
    if (!paid) return "/payment";
    if (!onboardingDone) return "/onboarding";
    return "/dashboard";
  }

  if (pathname.startsWith("/payment")) {
    if (!paid) return null;
    if (!onboardingDone) return "/onboarding";
    return "/dashboard";
  }

  if (pathname.startsWith("/onboarding")) {
    if (!paid) return "/payment";
    return null;
  }

  if (pathname.startsWith("/dashboard")) {
    if (!paid) return "/payment";
    if (!onboardingDone) return "/onboarding";
    return null;
  }

  return null;
}
