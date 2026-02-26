export type AccessInput = {
  pathname: string;
  isAuthenticated: boolean;
  paid: boolean;
  onboardingDone: boolean;
  hasSignupName: boolean;
};

export function resolveAccessRedirect(input: AccessInput): string | null {
  const { pathname, isAuthenticated, paid, onboardingDone, hasSignupName } = input;
  const isSignupPaymentPath = pathname === "/signup/payment" || pathname.startsWith("/signup/payment/");
  const isSignupPaymentSuccessPath = pathname === "/signup/payment/success";
  const isAuthEntryPath = pathname === "/signup" || pathname === "/signup/email" || pathname === "/login" || pathname === "/login/reset";

  if (!isAuthenticated) {
    if (pathname === "/signup/email" && !hasSignupName) {
      return "/signup";
    }

    if (isSignupPaymentPath) {
      return "/signup";
    }

    if (
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings")
    ) {
      return "/login";
    }
    return null;
  }

  if (isAuthEntryPath) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    return "/dashboard";
  }

  if (isSignupPaymentPath) {
    if (isSignupPaymentSuccessPath) {
      return null;
    }

    if (!paid) return null;
    if (!onboardingDone) return "/onboarding";
    return "/dashboard";
  }

  if (pathname.startsWith("/onboarding")) {
    if (!paid) return "/signup/payment";
    if (onboardingDone) return "/dashboard";
    return null;
  }

  if (pathname.startsWith("/dashboard")) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    return null;
  }

  return null;
}
